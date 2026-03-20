import { useState, useEffect } from 'react'
import type { RateLimits } from '../lib/types'

interface UseRateLimitsReturn {
  rateLimits: RateLimits | null
  loading: boolean
}

export function useRateLimits(): UseRateLimitsReturn {
  const [rateLimits, setRateLimits] = useState<RateLimits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!window.api?.getRateLimits) {
      setLoading(false)
      return
    }

    window.api.getRateLimits().then((data) => {
      if (data) setRateLimits(data)
      setLoading(false)
    })

    const cleanup = window.api.onRateLimitsUpdate((data: RateLimits) => {
      setRateLimits(data)
      setLoading(false)
    })

    return cleanup
  }, [])

  return { rateLimits, loading }
}
