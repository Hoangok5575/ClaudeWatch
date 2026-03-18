import { cn } from '../lib/utils'
import type { ClaudeInstance } from '../lib/types'

interface StatusBadgeProps {
  status: ClaudeInstance['status']
  className?: string
}

const statusConfig: Record<
  ClaudeInstance['status'],
  { label: string; colorClass: string; dotClass: string }
> = {
  active: {
    label: 'Active',
    colorClass: 'text-status-active',
    dotClass: 'bg-status-active'
  },
  idle: {
    label: 'Idle',
    colorClass: 'text-status-idle',
    dotClass: 'bg-status-idle'
  },
  exited: {
    label: 'Exited',
    colorClass: 'text-status-exited',
    dotClass: 'bg-status-exited'
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        config.colorClass,
        className
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span className={cn('h-2 w-2 rounded-full', config.dotClass)} aria-hidden="true" />
      {config.label}
    </span>
  )
}
