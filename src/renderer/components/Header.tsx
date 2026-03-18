import { LayoutDashboard, History, Settings } from 'lucide-react'
import { cn } from '../lib/utils'

export type ViewType = 'dashboard' | 'history' | 'settings'

interface HeaderProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

const navItems: { view: ViewType; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'history', label: 'History', icon: History },
  { view: 'settings', label: 'Settings', icon: Settings }
]

export function Header({ currentView, onViewChange }: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border px-4" role="banner">
      {/* macOS traffic light space */}
      <div className="w-[75px] shrink-0" aria-hidden="true" />

      {/* App title */}
      <h1 className="mr-auto text-sm font-semibold text-text-primary">Claude Tracker</h1>

      {/* Nav tabs */}
      <nav aria-label="Main navigation" className="flex items-center gap-1">
        {navItems.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            type="button"
            onClick={() => onViewChange(view)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              currentView === view
                ? 'bg-accent/15 text-accent'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            )}
            aria-current={currentView === view ? 'page' : undefined}
            aria-label={label}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>
    </header>
  )
}
