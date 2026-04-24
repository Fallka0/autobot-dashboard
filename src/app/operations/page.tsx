"use client";

import { useState } from "react";

import { DashboardShell, MetricRow, Panel, formatLocalTimestamp, orderTone } from "@/components/dashboard-ui";
import { useDashboardData } from "@/lib/use-dashboard-data";

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

export default function OperationsPage() {
  const data = useDashboardData();
  const [controlToken, setControlToken] = useState(
    () => (typeof window === "undefined" ? "" : window.localStorage.getItem("autobot-control-token") ?? ""),
  );
  const [controlBusy, setControlBusy] = useState<ControlAction | null>(null);
  const [controlMessage, setControlMessage] = useState("No manual command queued yet.");

  const saveControlToken = (value: string) => {
    setControlToken(value);
    window.localStorage.setItem("autobot-control-token", value);
  };

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
      const queuedAt = payload.command?.requestedAtUtc
        ? formatLocalTimestamp(payload.command.requestedAtUtc)
        : "just now";
      setControlMessage(`${labelForAction(action)} queued at ${queuedAt}. The laptop will pick it up on the next minute tick.`);
    } catch (error) {
      setControlMessage(`Could not queue ${labelForAction(action)}. ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setControlBusy(null);
    }
  };

  return (
    <DashboardShell
      title="Operations"
      subtitle="Controls, orders, and adaptation"
      headerPills={[`Mode: ${data.mode}`, `Benchmark: ${data.benchmark}`, `Sync: ${data.lastSync}`]}
    >
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
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

        <div className="space-y-6">
          <Panel title="Learning Status" meta="How the bot is adapting">
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <MetricRow label="Open tracked outcomes" value={String(data.learning.openTrackedOutcomes)} />
              <MetricRow label="Closed outcomes with PnL" value={String(data.learning.closedWithPnl)} />
              <p className="border-t border-[color:var(--border-subtle)] pt-3 leading-6 text-[var(--text-soft)]">{data.learning.note}</p>
            </div>
          </Panel>

          <Panel title="Operator Note" meta="What the website can and cannot do">
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              The dashboard can queue commands, but your laptop still has to be awake and the local LaunchAgent has to be running to execute them.
            </p>
          </Panel>
        </div>
      </section>

      <Panel title="Order Lifecycle" meta="Submission and broker state">
        <div className="grid gap-3 md:grid-cols-2">
          {data.orders.map((order) => (
            <div key={`${order.time}-${order.symbol}-${order.status}`} className="app-card rounded-3xl px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-[var(--text-primary)]">{order.symbol}</div>
                <span className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${orderTone(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="mt-1 text-sm text-[var(--text-muted)]">{order.time} UTC</div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{order.detail}</div>
            </div>
          ))}
        </div>
      </Panel>
    </DashboardShell>
  );
}

function labelForAction(action: ControlAction) {
  return controlActions.find((item) => item.action === action)?.label ?? action;
}
