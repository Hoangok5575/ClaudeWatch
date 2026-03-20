import { readFile } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'
import { BrowserWindow } from 'electron'
import type { RateLimits, RateLimitWindow } from '../renderer/lib/types'

interface RateLimitsFileData {
  window_5h?: { used_percentage?: number; resets_at?: string }
  window_7d?: { used_percentage?: number; resets_at?: string }
  updated_at?: string
}

const EMPTY_WINDOW: RateLimitWindow = { used_percentage: 0, resets_at: null }

const EMPTY_RATE_LIMITS: RateLimits = {
  window_5h: { ...EMPTY_WINDOW },
  window_7d: { ...EMPTY_WINDOW },
  updated_at: null,
  dataAvailable: false
}

/** Maximum age (in ms) before cached rate-limit data is considered stale. */
const STALENESS_THRESHOLD_MS = 5 * 60 * 1000

export class RateLimitReader {
  private getWindows: (() => BrowserWindow | null)[]
  private interval: NodeJS.Timeout | null = null
  private lastData: RateLimits | null = null
  private listeners = new Set<(data: RateLimits) => void>()
  private filePath: string

  constructor(getWindows: (() => BrowserWindow | null)[]) {
    this.getWindows = getWindows
    this.filePath = join(homedir(), '.claude', 'cache', 'rate-limits.json')
  }

  async read(): Promise<RateLimits> {
    let result: RateLimits
    try {
      const raw = await readFile(this.filePath, 'utf-8')
      const data: RateLimitsFileData = JSON.parse(raw)

      // Check staleness
      const updatedAt = data.updated_at ?? null
      if (updatedAt) {
        const age = Date.now() - new Date(updatedAt).getTime()
        if (age > STALENESS_THRESHOLD_MS) {
          result = { ...EMPTY_RATE_LIMITS }
        } else {
          result = {
            window_5h: {
              used_percentage: data.window_5h?.used_percentage ?? 0,
              resets_at: data.window_5h?.resets_at ?? null
            },
            window_7d: {
              used_percentage: data.window_7d?.used_percentage ?? 0,
              resets_at: data.window_7d?.resets_at ?? null
            },
            updated_at: updatedAt,
            dataAvailable: true
          }
        }
      } else {
        result = { ...EMPTY_RATE_LIMITS }
      }
    } catch {
      result = { ...EMPTY_RATE_LIMITS }
    }

    this.lastData = result
    this.send(result)
    return result
  }

  getLastData(): RateLimits | null {
    return this.lastData
  }

  onUpdate(listener: (data: RateLimits) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  startPolling(intervalMs = 15_000): void {
    this.read()
    this.interval = setInterval(() => this.read(), intervalMs)
  }

  stopPolling(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private send(data: RateLimits): void {
    for (const listener of this.listeners) {
      listener(data)
    }

    for (const getWin of this.getWindows) {
      const win = getWin()
      if (win && !win.isDestroyed()) {
        win.webContents.send('ratelimits:update', data)
      }
    }
  }
}
