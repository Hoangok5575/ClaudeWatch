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
        className="flex flex-col items-center justify-center gap-3 py-16 text-text-tertiary"
        role="status"
        aria-label="No instances found"
      >
        <Monitor className="h-10 w-10" aria-hidden="true" />
        <p className="text-sm">No instances match your filter</p>
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
