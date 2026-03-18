import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SessionTracker } from './session-tracker'
import { ProcessMonitor } from './process-monitor'
import type { ClaudeInstance, SessionHistoryEntry } from '../renderer/lib/types'

// Helper to create a mock ClaudeInstance
function makeInstance(overrides: Partial<ClaudeInstance> = {}): ClaudeInstance {
  return {
    pid: 1000,
    tty: 'ttys001',
    status: 'active',
    cpuPercent: 25.0,
    memPercent: 1.5,
    elapsedTime: '05:00',
    elapsedSeconds: 300,
    projectPath: '/Users/test/project',
    projectName: 'test/project',
    flags: [],
    startedAt: new Date('2026-03-18T10:00:00Z'),
    ...overrides
  }
}

// Create a mock ProcessMonitor
function createMockMonitor(): ProcessMonitor & { _setPollResult: (r: ClaudeInstance[]) => void } {
  let pollResult: ClaudeInstance[] = []
  const monitor = {
    poll: vi.fn(async () => pollResult),
    _setPollResult: (r: ClaudeInstance[]) => {
      pollResult = r
    }
  } as unknown as ProcessMonitor & { _setPollResult: (r: ClaudeInstance[]) => void }
  return monitor
}

describe('SessionTracker', () => {
  let monitor: ReturnType<typeof createMockMonitor>
  let tracker: SessionTracker

  beforeEach(() => {
    vi.useFakeTimers()
    monitor = createMockMonitor()
    tracker = new SessionTracker(monitor, { maxHistoryEntries: 5 })
  })

  afterEach(() => {
    tracker.stop()
    vi.useRealTimers()
  })

  describe('getInstances()', () => {
    it('should return empty array before first poll', () => {
      expect(tracker.getInstances()).toEqual([])
    })

    it('should return current instances after poll', async () => {
      const instance = makeInstance({ pid: 100 })
      monitor._setPollResult([instance])

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)

      const instances = tracker.getInstances()
      expect(instances).toHaveLength(1)
      expect(instances[0].pid).toBe(100)
    })
  })

  describe('getHistory()', () => {
    it('should return empty array initially', () => {
      expect(tracker.getHistory()).toEqual([])
    })

    it('should add exited instance to history when it disappears', async () => {
      const instance = makeInstance({ pid: 200, status: 'active' })
      monitor._setPollResult([instance])

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)

      // Instance disappears
      monitor._setPollResult([])
      await vi.advanceTimersByTimeAsync(1000)

      const history = tracker.getHistory()
      expect(history).toHaveLength(1)
      expect(history[0].pid).toBe(200)
      expect(history[0].status).toBe('exited')
      expect(history[0].projectPath).toBe('/Users/test/project')
    })
  })

  describe('clearHistory()', () => {
    it('should clear all history entries', async () => {
      const instance = makeInstance({ pid: 300 })
      monitor._setPollResult([instance])

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)

      monitor._setPollResult([])
      await vi.advanceTimersByTimeAsync(1000)

      expect(tracker.getHistory()).toHaveLength(1)

      tracker.clearHistory()
      expect(tracker.getHistory()).toEqual([])
    })
  })

  describe('getStats()', () => {
    it('should return correct stats', async () => {
      const active = makeInstance({ pid: 400, status: 'active' })
      const idle = makeInstance({ pid: 401, status: 'idle', cpuPercent: 0.1 })
      monitor._setPollResult([active, idle])

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)

      const stats = tracker.getStats()
      expect(stats.total).toBe(2)
      expect(stats.active).toBe(1)
      expect(stats.idle).toBe(1)
      expect(stats.exited).toBe(0)
    })

    it('should count exited instances from history', async () => {
      const instance = makeInstance({ pid: 500 })
      monitor._setPollResult([instance])

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)

      monitor._setPollResult([])
      await vi.advanceTimersByTimeAsync(1000)

      const stats = tracker.getStats()
      expect(stats.total).toBe(0)
      expect(stats.exited).toBe(1)
    })
  })

  describe('event emissions', () => {
    it("should emit 'instance-appeared' when new PID appears", async () => {
      const handler = vi.fn()
      tracker.on('instance-appeared', handler)

      const instance = makeInstance({ pid: 600 })
      monitor._setPollResult([instance])

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].pid).toBe(600)
    })

    it("should emit 'instance-exited' when PID disappears", async () => {
      const handler = vi.fn()
      tracker.on('instance-exited', handler)

      const instance = makeInstance({ pid: 700 })
      monitor._setPollResult([instance])

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)

      monitor._setPollResult([])
      await vi.advanceTimersByTimeAsync(1000)

      expect(handler).toHaveBeenCalledTimes(1)
      const entry: SessionHistoryEntry = handler.mock.calls[0][0]
      expect(entry.pid).toBe(700)
      expect(entry.status).toBe('exited')
      expect(entry.durationSeconds).toBeGreaterThanOrEqual(0)
    })

    it("should emit 'instance-status-changed' when status changes", async () => {
      const handler = vi.fn()
      tracker.on('instance-status-changed', handler)

      const activeInstance = makeInstance({ pid: 800, status: 'active' })
      monitor._setPollResult([activeInstance])

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)

      // Same PID, now idle
      const idleInstance = makeInstance({ pid: 800, status: 'idle' })
      monitor._setPollResult([idleInstance])
      await vi.advanceTimersByTimeAsync(1000)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].instance.pid).toBe(800)
      expect(handler.mock.calls[0][0].instance.status).toBe('idle')
      expect(handler.mock.calls[0][0].previousStatus).toBe('active')
    })

    it("should emit 'update' on every poll cycle", async () => {
      const handler = vi.fn()
      tracker.on('update', handler)

      monitor._setPollResult([])

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)

      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should include stats in update event', async () => {
      const handler = vi.fn()
      tracker.on('update', handler)

      const instance = makeInstance({ pid: 900, status: 'active' })
      monitor._setPollResult([instance])

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)

      const update = handler.mock.calls[0][0]
      expect(update.instances).toHaveLength(1)
      expect(update.stats.active).toBe(1)
      expect(update.stats.total).toBe(1)
    })
  })

  describe('history limits', () => {
    it('should respect maxHistoryEntries', async () => {
      // maxHistoryEntries is 5
      tracker.start(1000)

      for (let i = 0; i < 8; i++) {
        const instance = makeInstance({ pid: 1000 + i })
        monitor._setPollResult([instance])
        await vi.advanceTimersByTimeAsync(1000)

        monitor._setPollResult([])
        await vi.advanceTimersByTimeAsync(1000)
      }

      const history = tracker.getHistory()
      expect(history.length).toBeLessThanOrEqual(5)
    })
  })

  describe('start() and stop()', () => {
    it('should stop polling when stop() is called', async () => {
      const handler = vi.fn()
      tracker.on('update', handler)

      monitor._setPollResult([])

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)
      expect(handler).toHaveBeenCalledTimes(1)

      tracker.stop()
      await vi.advanceTimersByTimeAsync(5000)
      expect(handler).toHaveBeenCalledTimes(1) // no more calls
    })

    it('should be safe to call stop() multiple times', () => {
      tracker.start(1000)
      tracker.stop()
      tracker.stop() // should not throw
    })

    it('should be safe to call start() multiple times (restarts)', async () => {
      const handler = vi.fn()
      tracker.on('update', handler)

      monitor._setPollResult([])

      tracker.start(1000)
      tracker.start(1000) // restart
      await vi.advanceTimersByTimeAsync(1000)

      // Should still work
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle poll errors gracefully', async () => {
      vi.mocked(monitor.poll).mockRejectedValueOnce(new Error('poll error'))
      const handler = vi.fn()
      tracker.on('update', handler)

      tracker.start(1000)
      await vi.advanceTimersByTimeAsync(1000)

      // Should not throw, and should not emit update on error
      // Next poll should work normally
      monitor._setPollResult([makeInstance({ pid: 1100 })])
      await vi.advanceTimersByTimeAsync(1000)

      expect(handler).toHaveBeenCalled()
    })
  })
})
