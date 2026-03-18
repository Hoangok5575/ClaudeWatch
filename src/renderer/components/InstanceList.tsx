import { Monitor } from 'lucide-react'
import type { ClaudeInstance } from '../lib/types'
import { InstanceCard } from './InstanceCard'

interface InstanceListProps {
  instances: ClaudeInstance[]
}

export function InstanceList({ instances }: InstanceListProps) {
  if (instances.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-20 text-text-tertiary"
        role="status"
        aria-label="No instances found"
      >
        <Monitor className="h-12 w-12" aria-hidden="true" />
        <div className="text-center">
          <p className="text-sm font-medium text-text-secondary">No instances found</p>
          <p className="mt-1 text-caption text-text-tertiary">
            Claude processes will appear here when detected
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2" role="list" aria-label="Claude instances">
      {instances.map((instance) => (
        <div key={instance.pid} role="listitem">
          <InstanceCard instance={instance} />
        </div>
      ))}
    </div>
  )
}
