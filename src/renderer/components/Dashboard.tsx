import { Search, Activity, Moon, XCircle, Layers } from 'lucide-react'
import { cn } from '../lib/utils'
import { useInstances, type StatusFilter } from '../hooks/useInstances'
import { InstanceList } from './InstanceList'

const filterButtons: { filter: StatusFilter; label: string }[] = [
  { filter: 'all', label: 'All' },
  { filter: 'active', label: 'Active' },
  { filter: 'idle', label: 'Idle' },
  { filter: 'exited', label: 'Exited' }
]

const statusBorderColors: Record<string, string> = {
  total: 'border-l-accent',
  active: 'border-l-status-active',
  idle: 'border-l-status-idle',
  exited: 'border-l-status-exited'
}

const statCards: {
  key: keyof ReturnType<typeof useInstances>['stats']
  label: string
  icon: typeof Activity
  colorClass: string
}[] = [
  {
    key: 'total',
    label: 'Total',
    icon: Layers,
    colorClass: 'text-accent'
  },
  {
    key: 'active',
    label: 'Active',
    icon: Activity,
    colorClass: 'text-status-active'
  },
  {
    key: 'idle',
    label: 'Idle',
    icon: Moon,
    colorClass: 'text-status-idle'
  },
  {
    key: 'exited',
    label: 'Exited',
    icon: XCircle,
    colorClass: 'text-status-exited'
  }
]

export function Dashboard() {
  const { stats, filter, setFilter, searchQuery, setSearchQuery, filteredInstances } =
    useInstances()

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden p-5">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3" role="region" aria-label="Instance statistics">
        {statCards.map(({ key, label, icon: Icon, colorClass }) => (
          <div key={key} className={cn('stat-card border-l-2', statusBorderColors[key])}>
            <div className="flex items-center gap-1.5">
              <Icon className={cn('h-3.5 w-3.5', colorClass)} aria-hidden="true" />
              <span className="text-caption uppercase tracking-wider text-text-secondary">
                {label}
              </span>
            </div>
            <span
              className="text-stat tabular-nums text-text-primary"
              aria-label={`${label}: ${stats[key]}`}
            >
              {stats[key]}
            </span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <div
          className="flex gap-1 rounded-full bg-surface-raised p-1"
          role="group"
          aria-label="Filter by status"
        >
          {filterButtons.map(({ filter: f, label }) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(filter === f ? 'filter-btn-active' : 'filter-btn')}
              aria-pressed={filter === f}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search instances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-64 rounded-card border border-border bg-surface-raised pl-8 pr-3 text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent-ring"
            aria-label="Search instances"
          />
        </div>
      </div>

      {/* Instance list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <InstanceList instances={filteredInstances} />
      </div>
    </div>
  )
}
