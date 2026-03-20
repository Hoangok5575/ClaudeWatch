import SwiftUI
import WidgetKit

/// Compact rate limit pill: "5h: 42%" with color coding
struct RateLimitPill: View {
    let label: String
    let percent: Double
    var renderingMode: WidgetRenderingMode = .fullColor

    var body: some View {
        Text("\(label): \(Int(min(100, percent)))%")
            .font(.system(size: 10, weight: .medium, design: .monospaced))
            .foregroundStyle(WidgetColors.rateLimitColor(for: percent, mode: renderingMode))
            .monospacedDigit()
    }
}

/// Medium widget: stats bar + usage bar + 3 instance rows
struct MediumWidgetView: View {
    let data: WidgetStatsPayload
    @Environment(\.widgetRenderingMode) var renderingMode

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Stats bar
            HStack(spacing: 12) {
                StatPill(color: WidgetColors.statusColor(for: "active", mode: renderingMode), count: data.stats.active, label: "active", renderingMode: renderingMode)
                StatPill(color: WidgetColors.statusColor(for: "idle", mode: renderingMode), count: data.stats.idle, label: "idle", renderingMode: renderingMode)

                Spacer()

                if data.promo?.is2x == true {
                    Text("2x")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(WidgetColors.statusColor(for: "active", mode: renderingMode))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(WidgetColors.statusColor(for: "active", mode: renderingMode).opacity(0.15))
                        .clipShape(Capsule())
                }

                Text("ClaudeWatch")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(WidgetColors.textTertiary(for: renderingMode))
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 8)

            // Usage bar
            if let usage = data.usage, usage.dataAvailable {
                HStack(spacing: 8) {
                    Text(formatCurrency(usage.totalCostUSD))
                        .foregroundStyle(WidgetColors.statusColor(for: "active", mode: renderingMode))
                    Text("·")
                        .foregroundStyle(WidgetColors.textTertiary(for: renderingMode))
                    Text("\(formatCompactNumber(usage.totalInputTokens)) in")
                        .foregroundStyle(WidgetColors.textSecondary(for: renderingMode))
                    Text("·")
                        .foregroundStyle(WidgetColors.textTertiary(for: renderingMode))
                    Text("\(formatCompactNumber(usage.totalOutputTokens)) out")
                        .foregroundStyle(WidgetColors.textSecondary(for: renderingMode))
                }
                .font(.system(size: 10, weight: .medium, design: .monospaced))
                .padding(.horizontal, 16)
                .padding(.bottom, 6)
            }

            // Rate limit pills
            if let rl = data.rateLimits, rl.dataAvailable {
                HStack(spacing: 8) {
                    RateLimitPill(label: "5h", percent: rl.window5hPercent, renderingMode: renderingMode)
                    RateLimitPill(label: "7d", percent: rl.window7dPercent, renderingMode: renderingMode)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 6)
            }

            // Separator
            Rectangle()
                .fill(WidgetColors.border)
                .frame(height: 1)
                .padding(.horizontal, 16)

            if data.instances.isEmpty {
                Spacer()
                Text("No instances detected")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(WidgetColors.textTertiary(for: renderingMode))
                    .frame(maxWidth: .infinity)
                Spacer()
            } else {
                // Instance rows (max 3)
                VStack(spacing: 0) {
                    ForEach(Array(data.instances.prefix(3))) { instance in
                        InstanceRow(instance: instance, renderingMode: renderingMode)
                    }
                }
                .padding(.top, 4)

                Spacer()

                // Overflow indicator
                if data.instances.count > 3 {
                    Text("+\(data.instances.count - 3) more")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(WidgetColors.textTertiary(for: renderingMode))
                        .padding(.horizontal, 16)
                        .padding(.bottom, 8)
                }
            }
        }
        .widgetAccentable()
        .containerBackground(for: .widget) {
            WidgetColors.surface
        }
    }
}
