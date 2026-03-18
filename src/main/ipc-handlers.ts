import { ipcMain, BrowserWindow, app } from 'electron'
import type { SessionTracker } from './session-tracker'
import type { SettingsStore } from './store'
import type { AppSettings } from '../renderer/lib/types'

interface IpcHandlerOptions {
  tracker: SessionTracker
  store: SettingsStore
  onOpenDashboard: () => void
}

export function setupIpcHandlers(options: IpcHandlerOptions): void {
  const { tracker, store, onOpenDashboard } = options

  ipcMain.handle('instances:get', () => {
    return {
      instances: tracker.getInstances(),
      stats: tracker.getStats()
    }
  })

  ipcMain.handle('settings:get', () => {
    return store.getSettings()
  })

  ipcMain.handle(
    'settings:set',
    (_event: Electron.IpcMainInvokeEvent, data: Partial<AppSettings>) => {
      store.setSettings(data)
      return store.getSettings()
    }
  )

  ipcMain.handle('history:get', () => {
    return store.getHistory()
  })

  ipcMain.handle('history:clear', () => {
    store.clearHistory()
    return { success: true }
  })

  ipcMain.handle('app:open-dashboard', () => {
    onOpenDashboard()
    return { success: true }
  })

  ipcMain.handle('app:quit', () => {
    app.quit()
  })
}

export function forwardUpdatesToRenderer(
  tracker: SessionTracker,
  getWindow: () => BrowserWindow | null
): void {
  tracker.on('update', (data) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('instances:update', data)
    }
  })
}
