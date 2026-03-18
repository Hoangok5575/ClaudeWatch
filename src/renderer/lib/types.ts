export interface ClaudeInstance {
  pid: number
  tty: string
  status: 'active' | 'idle' | 'exited'
  cpuPercent: number
  memPercent: number
  elapsedTime: string
  elapsedSeconds: number
  projectPath: string
  projectName: string
  flags: string[]
  sessionId?: string
  startedAt: Date
  lastStatusChange?: Date
  lastBecameIdleAt?: Date
}

export interface SessionHistoryEntry {
  pid: number
  projectPath: string
  projectName: string
  status: 'exited'
  startedAt: Date
  endedAt: Date
  durationSeconds: number
  flags: string[]
}

export interface AppSettings {
  pollingIntervalMs: number
  cpuIdleThreshold: number
  launchAtLogin: boolean
  notifications: {
    onTaskComplete: boolean
    onIdle: boolean
    onExited: boolean
    onError: boolean
    sound: boolean
    pingSound: boolean
    doNotDisturb: boolean
  }
  theme: 'dark' | 'light' | 'system'
  maxHistoryEntries: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  pollingIntervalMs: 3000,
  cpuIdleThreshold: 1.0,
  launchAtLogin: false,
  notifications: {
    onTaskComplete: true,
    onIdle: true,
    onExited: true,
    onError: true,
    sound: true,
    pingSound: true,
    doNotDisturb: false
  },
  theme: 'dark',
  maxHistoryEntries: 100
}

export interface InstanceUpdate {
  instances: ClaudeInstance[]
  stats: {
    total: number
    active: number
    idle: number
    exited: number
    recentlyCompleted: number
  }
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateInfo {
  version: string
  releaseNotes?: string
}

export interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export interface UpdaterStatusPayload {
  status: UpdateStatus
  data?: UpdateInfo | UpdateProgress | string
}

export interface UsageStats {
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  totalCostUSD: number
  modelUsage: ModelUsageEntry[]
  dataAvailable: boolean
  lastUpdated: string | null
}

export interface ModelUsageEntry {
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
  costUSD: number
}

export interface PromoStatus {
  is2x: boolean
  promoActive: boolean
  isWeekend: boolean
  currentWindowEnd: string | null
  nextWindowStart: string | null
  expiresInSeconds: number | null
  promoPeriod: string
  peakHoursLocal: string
}

export type IpcChannels =
  | 'instances:update'
  | 'instances:get'
  | 'settings:get'
  | 'settings:set'
  | 'history:get'
  | 'history:clear'
  | 'app:open-dashboard'
  | 'app:quit'
  | 'terminal:open'
  | 'updater:check'
  | 'updater:download'
  | 'updater:install'
  | 'updater:status'
  | 'usage:get'
  | 'usage:refresh'
  | 'usage:update'
  | 'promo:get'
  | 'promo:update'
