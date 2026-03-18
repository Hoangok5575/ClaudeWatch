import SwiftUI
import WidgetKit

/// Medium widget: stats bar + usage bar + 3 instance rows
struct MediumWidgetView: View {
    let data: WidgetStatsPayload

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Stats bar
            HStack(spacing: 12) {
                StatPill(color: WidgetColors.statusActive, count: data.stats.active, label: "active")
                StatPill(color: WidgetColors.statusIdle, count: data.stats.idle, label: "idle")

                Spacer()

                if data.promo?.is2x == true {
                    Text("2x")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(WidgetColors.statusActive)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(WidgetColors.statusActive.opacity(0.15))
                        .clipShape(Capsule())
                }

                Text("ClaudeWatch")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(WidgetColors.textTertiary)
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 8)

            // Usage bar
            if let usage = data.usage, usage.dataAvailable {
                HStack(spacing: 8) {
                    Text(formatCurrency(usage.totalCostUSD))
                        .foregroundStyle(WidgetColors.statusActive)
                    Text("·")
                        .foregroundStyle(WidgetColors.textTertiary)
                    Text("\(formatCompactNumber(usage.totalInputTokens)) in")
                        .foregroundStyle(WidgetColors.textSecondary)
                    Text("·")
                        .foregroundStyle(WidgetColors.textTertiary)
                    Text("\(formatCompactNumber(usage.totalOutputTokens)) out")
                        .foregroundStyle(WidgetColors.textSecondary)
                }
                .font(.system(size: 10, weight: .medium, design: .monospaced))
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
                    .foregroundStyle(WidgetColors.textTertiary)
                    .frame(maxWidth: .infinity)
                Spacer()
            } else {
                // Instance rows (max 3)
                VStack(spacing: 0) {
                    ForEach(Array(data.instances.prefix(3))) { instance in
                        InstanceRow(instance: instance)
                    }
                }
                .padding(.top, 4)

                Spacer()

                // Overflow indicator
                if data.instances.count > 3 {
                    Text("+\(data.instances.count - 3) more")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(WidgetColors.textTertiary)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 8)
                }
            }
        }
        .containerBackground(for: .widget) {
            WidgetColors.surface
        }
    }
}
