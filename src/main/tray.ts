import { Tray, Menu, nativeImage, MenuItemConstructorOptions } from 'electron'
import { join } from 'path'
import type { ClaudeInstance, InstanceUpdate } from '../renderer/lib/types'

interface TrayManagerOptions {
  onOpenDashboard: () => void
  onQuit: () => void
}

const STATUS_EMOJI: Record<ClaudeInstance['status'], string> = {
  active: '\uD83D\uDFE2',
  idle: '\uD83D\uDFE1',
  finished: '\uD83D\uDFE1',
  exited: '\uD83D\uDD34'
}

export class TrayManager {
  private tray: Tray | null = null
  private onOpenDashboard: () => void
  private onQuit: () => void

  constructor(options: TrayManagerOptions) {
    this.onOpenDashboard = options.onOpenDashboard
    this.onQuit = options.onQuit
    this.createTray()
  }

  private createTray(): void {
    // Create a minimal 16x16 template image for macOS menu bar
    const icon = nativeImage.createEmpty()
    this.tray = new Tray(icon)
    this.tray.setTitle('\u25CF 0')
    this.tray.setToolTip('Claude Tracker')
  }

  update(instances: ClaudeInstance[], stats: InstanceUpdate['stats']): void {
    if (!this.tray) return

    this.tray.setTitle(`\u25CF ${stats.active}`)

    const menuItems: MenuItemConstructorOptions[] = []

    // Header
    menuItems.push({
      label: `Claude Tracker \u2014 ${stats.total} instance${stats.total !== 1 ? 's' : ''}`,
      enabled: false
    })
    menuItems.push({ type: 'separator' })

    // Instance list (max 10)
    const maxShown = 10
    const shown = instances.slice(0, maxShown)
    for (const inst of shown) {
      const emoji = STATUS_EMOJI[inst.status] ?? '\u26AA'
      menuItems.push({
        label: `${emoji} ${inst.projectName} \u2014 ${inst.elapsedTime}`,
        enabled: false
      })
    }
    if (instances.length > maxShown) {
      menuItems.push({
        label: `  +${instances.length - maxShown} more`,
        enabled: false
      })
    }

    if (instances.length > 0) {
      menuItems.push({ type: 'separator' })
    }

    // Actions
    menuItems.push({
      label: 'Open Dashboard',
      click: () => this.onOpenDashboard()
    })
    menuItems.push({
      label: 'Settings',
      click: () => this.onOpenDashboard()
    })
    menuItems.push({ type: 'separator' })
    menuItems.push({
      label: 'Quit',
      click: () => this.onQuit()
    })

    const contextMenu = Menu.buildFromTemplate(menuItems)
    this.tray.setContextMenu(contextMenu)
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}
