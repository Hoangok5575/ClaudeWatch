import Foundation
import os.log

/// Data model matching the stats.json written by the Electron main process.
/// Must stay in sync with WidgetStatsPayload in widget-stats-writer.ts.
struct WidgetStatsPayload: Codable {
    let updatedAt: String
    let stats: Stats
    let instances: [InstanceData]
    let usage: UsageData?
    let promo: PromoData?

    private static let logger = Logger(
        subsystem: "com.zkidzdev.claudewatch.widget",
        category: "WidgetStats"
    )

    struct Stats: Codable {
        let total: Int
        let active: Int
        let idle: Int
        let exited: Int
    }

    struct UsageData: Codable {
        let totalCostUSD: Double
        let totalInputTokens: Int
        let totalOutputTokens: Int
        let totalCacheReadTokens: Int
        let dataAvailable: Bool
    }

    struct PromoData: Codable {
        let is2x: Bool
        let promoActive: Bool
        let expiresInSeconds: Int?
        let promoPeriod: String
    }

    struct InstanceData: Codable, Identifiable {
        let pid: Int
        let projectName: String
        let status: String
        let cpuPercent: Double
        let memPercent: Double
        let elapsedSeconds: Int

        var id: Int { pid }

        var isActive: Bool { status == "active" }
        var isIdle: Bool { status == "idle" }
    }

    /// Time since last update, in seconds
    var staleness: TimeInterval {
        guard let date = ISO8601DateFormatter().date(from: updatedAt) else { return .infinity }
        return Date().timeIntervalSince(date)
    }

    /// Whether the data is considered stale (older than 5 minutes)
    var isStale: Bool { staleness > 300 }

    /// Read stats.json from the App Group shared container
    static func load() -> WidgetStatsPayload? {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: "group.com.zkidzdev.claudewatch"
        ) else {
            logger.error("containerURL returned nil — App Group access denied (signing mismatch?)")
            return nil
        }

        let fileURL = containerURL.appendingPathComponent("stats.json")
        logger.info("Reading stats from: \(fileURL.path)")

        guard let data = try? Data(contentsOf: fileURL) else {
            logger.warning("stats.json not found or unreadable at: \(fileURL.path)")
            return nil
        }

        guard let payload = try? JSONDecoder().decode(WidgetStatsPayload.self, from: data) else {
            logger.error("Failed to decode stats.json (\(data.count) bytes)")
            return nil
        }

        logger.info("Loaded stats: \(payload.stats.total) total, \(payload.stats.active) active")
        return payload
    }

    /// Empty/default payload for when no data is available
    static let empty = WidgetStatsPayload(
        updatedAt: ISO8601DateFormatter().string(from: Date()),
        stats: Stats(total: 0, active: 0, idle: 0, exited: 0),
        instances: [],
        usage: nil,
        promo: nil
    )
}

/// Format token count into compact string (e.g. 1.2K, 455.8M)
func formatCompactNumber(_ n: Int) -> String {
    if n < 1_000 { return "\(n)" }
    if n < 1_000_000 {
        let v = Double(n) / 1_000.0
        return v.truncatingRemainder(dividingBy: 1) == 0
            ? "\(Int(v))K"
            : String(format: "%.1fK", v)
    }
    if n < 1_000_000_000 {
        let v = Double(n) / 1_000_000.0
        return v.truncatingRemainder(dividingBy: 1) == 0
            ? "\(Int(v))M"
            : String(format: "%.1fM", v)
    }
    let v = Double(n) / 1_000_000_000.0
    return String(format: "%.1fB", v)
}

/// Format USD cost as "$X.XX"
func formatCurrency(_ amount: Double) -> String {
    return String(format: "$%.2f", amount)
}

/// Format countdown seconds into "Xh Ym" or "Ym"
func formatCountdown(_ seconds: Int) -> String {
    if seconds <= 0 { return "0m" }
    let h = seconds / 3600
    let m = (seconds % 3600) / 60
    if h > 0 { return "\(h)h \(m)m" }
    return "\(m)m"
}

/// Format elapsed seconds into human-readable string
func formatElapsed(_ seconds: Int) -> String {
    let hours = seconds / 3600
    let minutes = (seconds % 3600) / 60
    let secs = seconds % 60

    if hours > 0 {
        return String(format: "%d:%02d:%02d", hours, minutes, secs)
    } else {
        return String(format: "%d:%02d", minutes, secs)
    }
}
