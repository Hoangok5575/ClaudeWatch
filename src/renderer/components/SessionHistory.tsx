import { useState, useEffect } from 'react'
import { Trash2, Clock, FileText } from 'lucide-react'
import { formatElapsedTime, timeAgo } from '../lib/utils'
import type { SessionHistoryEntry } from '../lib/types'
import { StatusBadge } from './StatusBadge'

export function SessionHistory() {
  const [history, setHistory] = useState<SessionHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.api) {
      setLoading(false)
      return
    }

    window.api
      .getHistory()
      .then((data) => {
        setHistory(data)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleClear = async () => {
    if (typeof window === 'undefined' || !window.api) return
    await window.api.clearHistory()
    setHistory([])
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-secondary">Loading history...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Session History</h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-status-exited transition-colors hover:bg-status-exited/10"
            aria-label="Clear all history"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Clear History
          </button>
        )}
      </div>

      {/* List */}
      {history.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 text-text-tertiary"
          role="status"
        >
          <FileText className="h-10 w-10" aria-hidden="true" />
          <p className="text-sm">No session history yet</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2" role="list" aria-label="Session history entries">
            {history.map((entry) => (
              <div
                key={`${entry.pid}-${String(entry.startedAt)}`}
                className="card flex items-center gap-3 px-4 py-3"
                role="listitem"
              >
                <StatusBadge status={entry.status} />
                <span
                  className="min-w-0 flex-1 truncate text-sm text-text-primary"
                  title={entry.projectPath}
                >
                  {entry.projectName}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {formatElapsedTime(entry.durationSeconds)}
                </span>
                <span className="text-xs text-text-tertiary">
                  {timeAgo(new Date(entry.endedAt))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
