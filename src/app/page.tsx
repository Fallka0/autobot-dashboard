"use client";

import { DashboardShell, HeroStat, Kpi, Panel, Chip, currency, pct, confidenceTone } from "@/components/dashboard-ui";
import { useDashboardData } from "@/lib/use-dashboard-data";

export default function Home() {
  const data = useDashboardData();

  return (
    <DashboardShell
      title="Overview"
      subtitle="Paper trading dashboard, operator view"
      headerPills={[`Mode: ${data.mode}`, `Benchmark: ${data.benchmark}`, `Sync: ${data.lastSync}`]}
    >
      <section className="app-hero relative overflow-hidden rounded-[32px] px-7 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.55fr_0.95fr] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-700">Overview</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
              AutoBot at a glance.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-soft)]">
              Quick read on portfolio state, current conviction, and whether the bot is behaving like a calm operator or a confused intern.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <Chip>{data.botStatus}</Chip>
              <Chip>{data.marketRegime}</Chip>
              <Chip>{`${data.openPositions} open positions`}</Chip>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <HeroStat label="Equity" value={currency(data.equity)} />
            <HeroStat label="Cash" value={currency(data.cash)} />
            <HeroStat label="Exposure" value={pct(data.exposurePct)} />
            <HeroStat label="Weekly PnL" value={pct(data.weeklyPnlPct)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <Kpi title="Bot" value={data.botStatus} detail={`Mode ${data.mode}`} />
        <Kpi title="Benchmark" value={data.benchmark} detail={`Regime ${data.marketRegime}`} />
        <Kpi title="Positions" value={String(data.openPositions)} detail={`${data.learning.openTrackedOutcomes} outcomes tracked`} />
        <Kpi title="Learning" value={`${data.closedOutcomes}`} detail="Closed outcomes with realized feedback" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <Panel title="Open Positions" meta={`${data.positions.length} active holdings`}>
          <div className="space-y-3">
            {data.positions.map((position) => (
              <div key={position.symbol} className="app-card rounded-3xl px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-medium text-[var(--text-primary)]">{position.symbol}</div>
                    <div className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{position.thesis}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[var(--text-soft)]">{pct(position.sizePct)}</div>
                    <div className="mt-1 text-base font-medium text-[var(--text-primary)]">{currency(position.marketValue)}</div>
                    <div className={`mt-1 text-sm ${position.unrealizedPnlPct >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {pct(position.unrealizedPnlPct)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Latest Decisions" meta="Newest reasoning first">
            <div className="space-y-3">
              {data.decisions.slice(0, 5).map((decision) => (
                <div key={`${decision.time}-${decision.symbol}-${decision.action}`} className="app-card grid gap-3 rounded-3xl px-4 py-4 md:grid-cols-[64px_72px_1fr_auto]">
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

          <Panel title="Market Pulse" meta="What the bot is watching">
            <p className="text-sm leading-6 text-[var(--text-secondary)]">{data.marketNews.headline}</p>
          </Panel>
        </div>
      </section>
    </DashboardShell>
  );
}
