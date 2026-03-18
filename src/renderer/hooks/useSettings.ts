import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '../lib/types'
import { DEFAULT_SETTINGS } from '../lib/types'

interface UseSettingsReturn {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  loading: boolean
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(() => {
    return typeof window !== 'undefined' && !!window.api
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.api) {
      setLoading(false)
      return
    }

    window.api
      .getSettings()
      .then((data) => {
        setSettings(data)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    if (typeof window === 'undefined' || !window.api) return

    const updated = await window.api.setSettings(partial)
    setSettings(updated)
  }, [])

  return { settings, updateSettings, loading }
}
