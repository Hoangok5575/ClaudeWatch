import { useState, useEffect, useMemo } from 'react'
import type { ClaudeInstance, InstanceUpdate } from '../lib/types'

export type StatusFilter = 'all' | 'active' | 'idle' | 'exited'

interface UseInstancesReturn {
  instances: ClaudeInstance[]
  stats: InstanceUpdate['stats']
  filter: StatusFilter
  setFilter: (filter: StatusFilter) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredInstances: ClaudeInstance[]
}

const emptyStats: InstanceUpdate['stats'] = {
  total: 0,
  active: 0,
  idle: 0,
  exited: 0
}

export function useInstances(): UseInstancesReturn {
  const [instances, setInstances] = useState<ClaudeInstance[]>([])
  const [stats, setStats] = useState<InstanceUpdate['stats']>(emptyStats)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined' || !window.api) return

    window.api.getInstances().then((data) => {
      setInstances(data.instances)
      setStats(data.stats)
    })

    const unsubscribe = window.api.onInstancesUpdate((data) => {
      setInstances(data.instances)
      setStats(data.stats)
    })

    return unsubscribe
  }, [])

  const filteredInstances = useMemo(() => {
    let result = instances

    if (filter !== 'all') {
      result = result.filter((i) => i.status === filter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (i) =>
          i.projectName.toLowerCase().includes(q) ||
          i.projectPath.toLowerCase().includes(q) ||
          i.flags.some((f) => f.toLowerCase().includes(q))
      )
    }

    return result
  }, [instances, filter, searchQuery])

  return {
    instances,
    stats,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    filteredInstances
  }
}
