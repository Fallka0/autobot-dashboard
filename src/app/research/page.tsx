"use client";

import { DashboardShell, Panel, Tag, confidenceTone, pct } from "@/components/dashboard-ui";
import { useDashboardData } from "@/lib/use-dashboard-data";

export default function ResearchPage() {
  const data = useDashboardData();

  return (
    <DashboardShell
      title="Research"
      subtitle="Market context, watchlist, and reasoning"
      headerPills={[`Mode: ${data.mode}`, `Benchmark: ${data.benchmark}`, `Sync: ${data.lastSync}`]}
    >
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
        <div className="space-y-6">
          <Panel title="Market Context" meta="Premarket and persistent macro memory">
            <div className="space-y-4">
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{data.marketNews.headline}</p>
              <div className="flex flex-wrap gap-2">
                {data.marketNews.watching.map((keyword) => (
                  <Tag key={keyword} tone="watch">
                    {keyword}
                  </Tag>
                ))}
                {data.marketNews.blocking.map((keyword) => (
                  <Tag key={keyword} tone="block">
                    {keyword}
                  </Tag>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Watchlist" meta="Top ranked candidates">
            <div className="space-y-3">
              {data.watchlist.map((item) => (
                <div key={item.symbol} className="app-card rounded-3xl px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-[var(--text-primary)]">{item.symbol}</div>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${confidenceTone(item.confidence)}`}>
                      {item.confidence.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm text-[var(--text-soft)]">
                    <span>{item.setup}</span>
                    <span>RS {pct(item.relativeStrengthPct)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Decision Feed" meta="Newest decisions at the top">
          <div className="space-y-3">
            {data.decisions.map((decision) => (
              <div key={`${decision.time}-${decision.symbol}-${decision.action}`} className="app-card grid gap-3 rounded-3xl px-4 py-4 md:grid-cols-[72px_72px_1fr_auto]">
                <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">{decision.time}</div>
                <div className="font-medium text-[var(--text-primary)]">{decision.symbol}</div>
                <div className="text-sm leading-6 text-[var(--text-secondary)]">{decision.summary}</div>
                <div className="flex justify-end">
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${confidenceTone(decision.confidence)}`}>
                    {decision.action} {decision.confidence.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </DashboardShell>
  );
}
