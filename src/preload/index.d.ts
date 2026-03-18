import type { AppSettings, InstanceUpdate } from '../renderer/lib/types'

export interface ElectronAPI {
  getInstances: () => Promise<InstanceUpdate>
  getSettings: () => Promise<AppSettings>
  setSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
  getHistory: () => Promise<unknown[]>
  clearHistory: () => Promise<{ success: boolean }>
  openDashboard: () => Promise<{ success: boolean }>
  quit: () => Promise<void>
  onInstancesUpdate: (callback: (data: InstanceUpdate) => void) => () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
