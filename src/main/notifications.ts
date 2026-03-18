import { Notification } from 'electron'
import type { AppSettings, ClaudeInstance, SessionHistoryEntry } from '../renderer/lib/types'

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}h ${m}m ${s}s`
  }
  return `${m}m ${s}s`
}

export class NotificationManager {
  private getSettings: () => AppSettings

  constructor(settingsGetter: () => AppSettings) {
    this.getSettings = settingsGetter
  }

  notifyIdle(instance: ClaudeInstance): void {
    const settings = this.getSettings()
    if (!settings.notifications.onIdle || settings.notifications.doNotDisturb) {
      return
    }

    const notification = new Notification({
      title: 'Claude finished',
      body: `${instance.projectName} \u2014 ran for ${instance.elapsedTime}`
    })
    notification.show()
  }

  notifyExited(entry: SessionHistoryEntry): void {
    const settings = this.getSettings()
    if (!settings.notifications.onExited || settings.notifications.doNotDisturb) {
      return
    }

    const duration = formatDuration(entry.durationSeconds)
    const notification = new Notification({
      title: 'Claude session ended',
      body: `${entry.projectName} \u2014 ran for ${duration}`
    })
    notification.show()
  }
}
