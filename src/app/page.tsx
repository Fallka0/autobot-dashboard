"use client";

import { useEffect, useState } from "react";

import {
  dashboardSnapshotEndpoint,
  fallbackDashboardData,
  type DashboardData,
} from "@/lib/dashboard-data";

const controlActions = [
  { action: "start_bot", label: "Start Bot" },
  { action: "stop_bot", label: "Stop Bot" },
  { action: "run_premarket", label: "Pre-market" },
  { action: "run_open", label: "Open" },
  { action: "run_midday", label: "Midday" },
  { action: "run_position_watch", label: "Watch" },
  { action: "run_eod", label: "EOD" },
  { action: "sync_dashboard", label: "Sync" },
] as const;

type ControlAction = (typeof controlActions)[number]["action"];

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function pct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function confidenceTone(value: number) {
  if (value >= 0.8) return "app-chip-success";
  if (value >= 0.7) return "app-chip-info";
  if (value >= 0.62) return "app-chip-warning";
  return "app-chip-danger";
}

function orderTone(status: string) {
  if (status === "filled") return "app-chip-success";
  if (status === "submitted") return "app-chip-info";
  if (status === "blocked") return "app-chip-warning";
  return "app-chip-danger";
}

export default function Home() {
  const [data, setData] = useState<DashboardData>(fallbackDashboardData);
  const [controlToken, setControlToken] = useState(
    () => (typeof window === "undefined" ? "" : window.localStorage.getItem("autobot-control-token") ?? ""),
  );
  const [controlBusy, setControlBusy] = useState<ControlAction | null>(null);
  const [controlMessage, setControlMessage] = useState("No manual command queued yet.");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(dashboardSnapshotEndpoint, { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as DashboardData;
        if (!cancelled) {
          setData(payload);
        }
      } catch {
        // Keep the fallback shell if the snapshot is temporarily unavailable.
      }
    };

    void load();
    const intervalId = window.setInterval(load, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const submitControl = async (action: ControlAction) => {
    setControlBusy(action);
    setControlMessage("Queueing command...");
    try {
      const response = await fetch("/api/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-autobot-control-token": controlToken,
        },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as { status?: string; command?: { requestedAtUtc?: string } };
      if (!response.ok) {
        throw new Error(payload.status ?? `HTTP ${response.status}`);
      }
      setControlMessage(
        `${labelForAction(action)} queued at ${payload.command?.requestedAtUtc ?? "now"}. The laptop will pick it up on the next minute tick.`,
      );
    } catch (error) {
      setControlMessage(
        `Could not queue ${labelForAction(action)}. ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setControlBusy(null);
    }
  };

  const saveControlToken = (value: string) => {
    setControlToken(value);
    window.localStorage.setItem("autobot-control-token", value);
  };

  return (
    <main className="app-shell">
      <header className="app-header sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 text-[var(--header-text)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--header-border)] bg-[var(--header-pill)] text-lg">
              A
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-semibold tracking-tight">AutoBot</span>
              <span className="block text-xs text-[var(--header-subtext)]">
                Paper trading dashboard, operator view
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <HeaderPill label={`Mode: ${data.mode}`} />
            <HeaderPill label={`Benchmark: ${data.benchmark}`} />
            <HeaderPill label={`Sync: ${data.lastSync}`} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="app-hero relative overflow-hidden rounded-[32px] px-7 py-8">
          <div className="grid gap-8 lg:grid-cols-[1.55fr_0.95fr] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-700">
                AutoBot Dashboard
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
                Trade decisions, market context, and learning in one place.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-soft)]">
                A live-ready control surface for open positions, new ideas, order
                flow, and the bot&apos;s running thesis about what matters right now.
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
          <Kpi
            title="Benchmark"
            value={data.benchmark}
            detail={`Regime ${data.marketRegime}`}
          />
          <Kpi
            title="Positions"
            value={String(data.openPositions)}
            detail={`${data.learning.openTrackedOutcomes} outcomes tracked`}
          />
          <Kpi
            title="Learning"
            value={`${data.closedOutcomes}`}
            detail="Closed outcomes with realized feedback"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <Panel
              title="Open Positions"
              meta={`${data.positions.length} active holdings`}
            >
              <div className="overflow-hidden rounded-3xl border border-[color:var(--border-subtle)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--surface-muted)] text-[var(--text-soft)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Symbol</th>
                      <th className="px-4 py-3 font-medium">Size</th>
                      <th className="px-4 py-3 font-medium">Value</th>
                      <th className="px-4 py-3 font-medium">PnL</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--surface)]">
                    {data.positions.map((position) => (
                      <tr
                        key={position.symbol}
                        className="border-t border-[color:var(--border-subtle)]"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-[var(--text-primary)]">
                            {position.symbol}
                          </div>
                          <div className="mt-1 max-w-xl text-xs leading-5 text-[var(--text-soft)]">
                            {position.thesis}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          {pct(position.sizePct)}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          {currency(position.marketValue)}
                        </td>
                        <td
                          className={`px-4 py-3 ${
                            position.unrealizedPnlPct >= 0
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }`}
                        >
                          {pct(position.unrealizedPnlPct)}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          {position.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="Decision Feed" meta="Most recent reasoning">
              <div className="space-y-3">
                {data.decisions.map((decision) => (
                  <div
                    key={`${decision.time}-${decision.symbol}-${decision.action}`}
                    className="app-card grid gap-3 rounded-3xl px-4 py-4 md:grid-cols-[72px_72px_1fr_auto]"
                  >
                    <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      {decision.time}
                    </div>
                    <div className="font-medium text-[var(--text-primary)]">
                      {decision.symbol}
                    </div>
                    <div className="text-sm leading-6 text-[var(--text-secondary)]">
                      {decision.summary}
                    </div>
                    <div className="flex justify-end">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${confidenceTone(
                          decision.confidence,
                        )}`}
                      >
                        {decision.action} {decision.confidence.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Market Context" meta="Premarket and persistent memory">
              <div className="space-y-4">
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {data.marketNews.headline}
                </p>
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

            <Panel title="Watchlist" meta="Top ranked entry candidates">
              <div className="space-y-3">
                {data.watchlist.map((item) => (
                  <div
                    key={item.symbol}
                    className="app-card rounded-3xl px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-[var(--text-primary)]">
                        {item.symbol}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${confidenceTone(
                          item.confidence,
                        )}`}
                      >
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

            <Panel title="Order Lifecycle" meta="Submission and broker state">
              <div className="space-y-3">
                {data.orders.map((order) => (
                  <div
                    key={`${order.time}-${order.symbol}-${order.status}`}
                    className="app-card rounded-3xl px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-[var(--text-primary)]">
                        {order.symbol}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${orderTone(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-[var(--text-muted)]">
                      {order.time} UTC
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      {order.detail}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Learning Status" meta="How the bot is adapting">
              <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                <MetricRow
                  label="Open tracked outcomes"
                  value={String(data.learning.openTrackedOutcomes)}
                />
                <MetricRow
                  label="Closed outcomes with PnL"
                  value={String(data.learning.closedWithPnl)}
                />
                <p className="border-t border-[color:var(--border-subtle)] pt-3 leading-6 text-[var(--text-soft)]">
                  {data.learning.note}
                </p>
              </div>
            </Panel>

            <Panel title="Manual Controls" meta="Queue commands for the laptop bot">
              <div className="space-y-4">
                <label className="block text-sm text-[var(--text-soft)]">
                  Control token
                  <input
                    type="password"
                    value={controlToken}
                    onChange={(event) => saveControlToken(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                    placeholder="Enter dashboard control token"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {controlActions.map((item) => (
                    <button
                      key={item.action}
                      type="button"
                      onClick={() => void submitControl(item.action)}
                      disabled={!controlToken || controlBusy !== null}
                      className="app-card rounded-2xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {controlBusy === item.action ? "Queueing..." : item.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm leading-6 text-[var(--text-soft)]">{controlMessage}</p>
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function HeaderPill({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-[color:var(--header-border)] bg-[var(--header-pill)] px-4 py-2 text-sm text-[var(--header-text-muted)]">
      {label}
    </div>
  );
}

function Panel({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <section className="app-surface rounded-[28px] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-soft)]">{meta}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-hero-stat rounded-2xl px-4 py-5 text-center">
      <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
        {label}
      </p>
    </div>
  );
}

function Kpi({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="app-surface rounded-[24px] px-5 py-4">
      <div className="text-sm text-[var(--text-soft)]">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
        {value}
      </div>
      <div className="mt-1 text-sm text-[var(--text-muted)]">{detail}</div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="app-chip rounded-full px-3 py-1 font-medium">{children}</span>
  );
}

function Tag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "watch" | "block";
}) {
  const palette = tone === "block" ? "app-chip-danger" : "app-chip-warning";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${palette}`}>
      {children}
    </span>
  );
}

function labelForAction(action: ControlAction) {
  return controlActions.find((item) => item.action === action)?.label ?? action;
}
