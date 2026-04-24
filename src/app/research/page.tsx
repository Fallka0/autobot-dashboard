"use client";

import { DashboardShell, Panel, Tag, confidenceTone, pct } from "@/components/dashboard-ui";
import { useDashboardData } from "@/lib/use-dashboard-data";

export default function ResearchPage() {
  const data = useDashboardData();

  return (
    <DashboardShell
      title="News & Thoughts"
      subtitle="Market context, watchlist, and deeper bot reasoning"
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

          <Panel title="News Feed" meta="Headlines and persistent risks shaping decisions">
            <div className="space-y-3">
              {data.marketNews.items.map((item, index) => (
                <div key={`${item.title}-${index}`} className="app-card rounded-3xl px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-[var(--text-primary)]">{item.title}</div>
                    <span className="rounded-full px-3 py-1 text-xs font-medium app-chip">
                      {item.kind === "memory" ? "Persistent" : "Headline"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.summary}</div>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm text-cyan-700"
                    >
                      Source
                    </a>
                  ) : null}
                </div>
              ))}
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

        <div className="space-y-6">
          <Panel title="AutoBot Thoughts" meta="Deeper read on what the bot currently believes">
            <div className="space-y-4">
              {data.thoughts.map((thought) => (
                <div key={`${thought.time}-${thought.symbol}-${thought.action}`} className="app-card rounded-3xl px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        {thought.time} · {thought.symbol}
                      </div>
                      <div className="mt-2 text-lg font-medium text-[var(--text-primary)]">{thought.headline}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${thought.action === "BUY" ? confidenceTone(0.8) : "app-chip"}`}>
                      {thought.action}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{thought.thesis}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <ThoughtList title="Why It Can Work" items={thought.canWork} />
                    <ThoughtList title="What Can Break It" items={thought.canFail} />
                    <ThoughtList title="Invalidations" items={thought.invalidations} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

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
        </div>
      </section>
    </DashboardShell>
  );
}

function ThoughtList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-sm font-medium text-[var(--text-primary)]">{title}</div>
      <div className="mt-2 space-y-2">
        {items.length ? items.map((item) => (
          <p key={item} className="text-sm leading-6 text-[var(--text-soft)]">
            {item}
          </p>
        )) : (
          <p className="text-sm leading-6 text-[var(--text-soft)]">No stored note yet.</p>
        )}
      </div>
    </div>
  );
}
