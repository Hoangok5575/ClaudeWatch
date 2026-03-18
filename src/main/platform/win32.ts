import { execFile } from 'child_process'
import type { RawProcessInfo, PlatformDetector } from './darwin'

function execFilePromise(bin: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(bin, args, (err, stdout, stderr) => {
      if (err) {
        reject(err)
        return
      }
      resolve({ stdout: stdout as string, stderr: stderr as string })
    })
  })
}

export class Win32Detector implements PlatformDetector {
  async getClaudeProcesses(): Promise<RawProcessInfo[]> {
    try {
      const { stdout } = await execFilePromise('tasklist', [
        '/FI',
        'IMAGENAME eq claude.exe',
        '/FO',
        'CSV',
        '/NH'
      ])

      const processes: RawProcessInfo[] = []
      const lines = stdout.split('\n').filter((l) => l.trim())

      for (const line of lines) {
        // CSV format: "claude.exe","PID","Session Name","Session#","Mem Usage"
        const parts = line.split(',').map((p) => p.replace(/"/g, '').trim())
        if (parts.length < 2) continue

        const pid = parseInt(parts[1], 10)
        if (isNaN(pid)) continue

        // Get additional process details via wmic
        try {
          const { stdout: wmicOut } = await execFilePromise('wmic', [
            'process',
            'where',
            `ProcessId=${pid}`,
            'get',
            'CommandLine,ExecutablePath',
            '/FORMAT:CSV'
          ])

          const wmicLines = wmicOut.split('\n').filter((l) => l.trim() && !l.startsWith('Node'))
          if (wmicLines.length > 0) {
            const wmicParts = wmicLines[0].split(',')
            const command = wmicParts.slice(1).join(',').trim()

            processes.push({
              pid,
              stat: 'S', // Windows doesn't provide stat like ps
              cpuPercent: 0, // Would need separate perf counter
              memPercent: 0,
              elapsedTime: '00:00',
              tty: 'console',
              command
            })
          }
        } catch {
          // Skip this process if wmic fails
        }
      }

      return processes
    } catch {
      return []
    }
  }

  async getWorkingDirectory(pid: number): Promise<string> {
    try {
      const { stdout } = await execFilePromise('wmic', [
        'process',
        'where',
        `ProcessId=${pid}`,
        'get',
        'ExecutablePath'
      ])

      const lines = stdout
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      if (lines.length > 1) {
        const exePath = lines[1]
        // Get directory from executable path
        const lastSlash = exePath.lastIndexOf('\\')
        return lastSlash > 0 ? exePath.substring(0, lastSlash) : exePath
      }
      return ''
    } catch {
      return ''
    }
  }
}
