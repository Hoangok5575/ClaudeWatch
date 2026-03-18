import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Cpu, MemoryStick, Terminal } from 'lucide-react'
import { cn, formatElapsedTime } from '../lib/utils'
import type { ClaudeInstance } from '../lib/types'
import { StatusBadge } from './StatusBadge'
import { ProjectTag } from './ProjectTag'

interface InstanceCardProps {
  instance: ClaudeInstance
}

export function InstanceCard({ instance }: InstanceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [elapsed, setElapsed] = useState(instance.elapsedSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setElapsed(instance.elapsedSeconds)

    if (instance.status === 'active' || instance.status === 'idle') {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [instance.elapsedSeconds, instance.status, instance.pid])

  return (
    <div className="glass-card-hover overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-label={`${instance.projectName} - ${instance.status}`}
      >
        {/* Left: status + project */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <StatusBadge status={instance.status} />
          <ProjectTag projectName={instance.projectName} projectPath={instance.projectPath} />
        </div>

        {/* Center: elapsed + flags */}
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="font-mono tabular-nums" aria-label="Elapsed time">
            {formatElapsedTime(elapsed)}
          </span>
          {instance.flags.length > 0 && (
            <span className="hidden truncate sm:inline" title={instance.flags.join(' ')}>
              {instance.flags.slice(0, 2).join(' ')}
            </span>
          )}
        </div>

        {/* Right: resource usage + expand */}
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span
            className="inline-flex items-center gap-1"
            aria-label={`CPU: ${instance.cpuPercent.toFixed(1)}%`}
          >
            <Cpu className="h-3 w-3" aria-hidden="true" />
            {instance.cpuPercent.toFixed(1)}%
          </span>
          <span
            className="inline-flex items-center gap-1"
            aria-label={`Memory: ${instance.memPercent.toFixed(1)}%`}
          >
            <MemoryStick className="h-3 w-3" aria-hidden="true" />
            {instance.memPercent.toFixed(1)}%
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-text-tertiary transition-transform duration-150',
              expanded && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div
          className="border-t border-border px-4 py-3 text-xs text-text-secondary"
          role="region"
          aria-label="Instance details"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-text-tertiary" aria-hidden="true" />
              <span>PID: {instance.pid}</span>
            </div>
            <div>
              <span>TTY: {instance.tty}</span>
            </div>
            <div className="col-span-2 truncate" title={instance.projectPath}>
              Path: {instance.projectPath}
            </div>
            {instance.sessionId && (
              <div className="col-span-2 truncate">Session: {instance.sessionId}</div>
            )}
            {instance.flags.length > 0 && (
              <div className="col-span-2">Flags: {instance.flags.join(' ')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
