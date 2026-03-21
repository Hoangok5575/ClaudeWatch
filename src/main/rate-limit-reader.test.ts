import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockReadFile = vi.hoisted(() => vi.fn())
const mockHomedir = vi.hoisted(() => vi.fn().mockReturnValue('/Users/test'))

vi.mock('fs/promises', () => ({
  readFile: mockReadFile
}))

vi.mock('os', () => ({
  homedir: mockHomedir
}))

vi.mock('electron', () => ({
  BrowserWindow: vi.fn()
}))

import { RateLimitReader } from './rate-limit-reader'

function makeMockWindow(destroyed = false) {
  return {
    isDestroyed: () => destroyed,
    webContents: { send: vi.fn() }
  }
}

function freshRateLimitsJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    window_5h: { used_percentage: 45, resets_at: '2026-03-20T20:00:00Z' },
    window_7d: { used_percentage: 62, resets_at: '2026-03-27T00:00:00Z' },
    updated_at: new Date().toISOString(),
    ...overrides
  })
}

describe('RateLimitReader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-20T15:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads fresh data and sets dataAvailable=true, isStale=false', async () => {
    mockReadFile.mockResolvedValue(freshRateLimitsJson())
    const reader = new RateLimitReader([])
    const result = await reader.read()

    expect(result.dataAvailable).toBe(true)
    expect(result.isStale).toBe(false)
    expect(result.window_5h.used_percentage).toBe(45)
    expect(result.window_7d.used_percentage).toBe(62)
    expect(result.window_7d.resets_at).toBe('2026-03-27T00:00:00Z')
  })

  it('returns dataAvailable=false when file is missing', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'))
    const reader = new RateLimitReader([])
    const result = await reader.read()

    expect(result.dataAvailable).toBe(false)
    expect(result.isStale).toBe(false)
    expect(result.window_5h.used_percentage).toBe(0)
  })

  it('returns dataAvailable=true and isStale=true when data is stale (>5 min)', async () => {
    const staleTime = new Date(Date.now() - 6 * 60 * 1000).toISOString()
    mockReadFile.mockResolvedValue(freshRateLimitsJson({ updated_at: staleTime }))
    const reader = new RateLimitReader([])
    const result = await reader.read()

    expect(result.dataAvailable).toBe(true)
    expect(result.isStale).toBe(true)
    expect(result.window_5h.used_percentage).toBe(45)
    expect(result.window_7d.used_percentage).toBe(62)
  })

  it('returns dataAvailable=false for malformed JSON', async () => {
    mockReadFile.mockResolvedValue('not json {{{')
    const reader = new RateLimitReader([])
    const result = await reader.read()

    expect(result.dataAvailable).toBe(false)
    expect(result.isStale).toBe(false)
  })

  it('returns dataAvailable=false when updated_at is missing', async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        window_5h: { used_percentage: 10 },
        window_7d: { used_percentage: 20 }
      })
    )
    const reader = new RateLimitReader([])
    const result = await reader.read()

    expect(result.dataAvailable).toBe(false)
    expect(result.isStale).toBe(false)
  })

  it('broadcasts to BrowserWindows on read', async () => {
    mockReadFile.mockResolvedValue(freshRateLimitsJson())
    const win = makeMockWindow()
    const reader = new RateLimitReader([() => win as never])
    await reader.read()

    expect(win.webContents.send).toHaveBeenCalledWith(
      'ratelimits:update',
      expect.objectContaining({ dataAvailable: true })
    )
  })

  it('skips destroyed windows', async () => {
    mockReadFile.mockResolvedValue(freshRateLimitsJson())
    const win = makeMockWindow(true)
    const reader = new RateLimitReader([() => win as never])
    await reader.read()

    expect(win.webContents.send).not.toHaveBeenCalled()
  })

  it('calls registered listeners on read', async () => {
    mockReadFile.mockResolvedValue(freshRateLimitsJson())
    const listener = vi.fn()
    const reader = new RateLimitReader([])
    reader.onUpdate(listener)
    await reader.read()

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        dataAvailable: true,
        window_5h: expect.objectContaining({ used_percentage: 45 })
      })
    )
  })

  it('unsubscribe removes listener', async () => {
    mockReadFile.mockResolvedValue(freshRateLimitsJson())
    const listener = vi.fn()
    const reader = new RateLimitReader([])
    const unsub = reader.onUpdate(listener)

    await reader.read()
    expect(listener).toHaveBeenCalledTimes(1)

    unsub()
    await reader.read()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('getLastData returns null before first read', () => {
    const reader = new RateLimitReader([])
    expect(reader.getLastData()).toBeNull()
  })

  it('getLastData returns last read result', async () => {
    mockReadFile.mockResolvedValue(freshRateLimitsJson())
    const reader = new RateLimitReader([])
    await reader.read()

    const last = reader.getLastData()
    expect(last?.dataAvailable).toBe(true)
    expect(last?.window_5h.used_percentage).toBe(45)
  })

  it('startPolling reads immediately then on interval', async () => {
    mockReadFile.mockResolvedValue(freshRateLimitsJson())
    const win = makeMockWindow()
    const reader = new RateLimitReader([() => win as never])

    reader.startPolling(15_000)

    // Initial read happens synchronously (returns promise)
    await vi.advanceTimersByTimeAsync(0)
    expect(win.webContents.send).toHaveBeenCalledTimes(1)

    // After interval
    await vi.advanceTimersByTimeAsync(15_000)
    expect(win.webContents.send).toHaveBeenCalledTimes(2)

    reader.stopPolling()
  })

  it('stopPolling stops interval', async () => {
    mockReadFile.mockResolvedValue(freshRateLimitsJson())
    const win = makeMockWindow()
    const reader = new RateLimitReader([() => win as never])

    reader.startPolling(15_000)
    await vi.advanceTimersByTimeAsync(0)

    reader.stopPolling()
    await vi.advanceTimersByTimeAsync(30_000)

    // Only the initial read
    expect(win.webContents.send).toHaveBeenCalledTimes(1)
  })

  it('handles null window getters gracefully', async () => {
    mockReadFile.mockResolvedValue(freshRateLimitsJson())
    const reader = new RateLimitReader([() => null])
    // Should not throw
    await reader.read()
  })
})
