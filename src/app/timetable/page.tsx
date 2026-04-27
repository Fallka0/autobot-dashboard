"use client";

import {
  Chip,
  DashboardShell,
  Panel,
  compactPillClasses,
  formatLocalTimestamp,
} from "@/components/dashboard-ui";
import { useDashboardData } from "@/lib/use-dashboard-data";

function slotTone(status: "completed" | "upcoming" | "missed") {
  if (status === "completed") return "app-chip-success";
  if (status === "upcoming") return "app-chip-info";
  return "app-chip-danger";
}

function niceName(value: string) {
  return value.replace("-", " ");
}

export default function TimetablePage() {
  const data = useDashboardData();
  const nextSlot = data.schedule.upcoming[0];

  return (
    <DashboardShell
      title="Timetable"
      subtitle="Live scheduler tracking"
      headerPills={[`Mode: ${data.mode}`, `Benchmark: ${data.benchmark}`, `Sync: ${data.lastSync}`]}
    >
      <section className="app-hero relative overflow-hidden rounded-[32px] px-7 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-700">Timetable</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
              Live routine tracking.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-soft)]">
              Minute-by-minute view of what AutoBot has just done and what it is expected to do next.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <Chip>{data.botStatus}</Chip>
              <Chip>{data.schedule.timezone}</Chip>
              {data.schedule.schedulerUpdatedAtUtc ? (
                <Chip>{`Scheduler ${formatLocalTimestamp(data.schedule.schedulerUpdatedAtUtc)}`}</Chip>
              ) : null}
            </div>
          </div>

          <div className="app-card rounded-[28px] px-5 py-5">
            <div className="text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Next expected slot</div>
            {nextSlot ? (
              <>
                <div className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                  {niceName(nextSlot.name)}
                </div>
                <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {formatLocalTimestamp(nextSlot.scheduledLocal)}
                </div>
                <div className="mt-4">
                  <span className={compactPillClasses(slotTone(nextSlot.status))}>{nextSlot.status}</span>
                </div>
              </>
            ) : (
              <div className="mt-3 text-sm text-[var(--text-secondary)]">No future slot is currently visible.</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel title="Upcoming" meta="Expected future routines">
          <div className="space-y-3">
            {data.schedule.upcoming.map((slot) => (
              <div key={slot.slotId} className="app-card rounded-3xl px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-medium text-[var(--text-primary)]">{niceName(slot.name)}</div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">
                      {formatLocalTimestamp(slot.scheduledLocal)}
                    </div>
                  </div>
                  <span className={compactPillClasses(slotTone(slot.status))}>{slot.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent" meta="Latest completed or missed scheduler slots">
          <div className="space-y-3">
            {[...data.schedule.recent].reverse().map((slot) => (
              <div key={slot.slotId} className="app-card rounded-3xl px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-medium text-[var(--text-primary)]">{niceName(slot.name)}</div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">
                      Planned {formatLocalTimestamp(slot.scheduledLocal)}
                    </div>
                    {slot.completedAtUtc ? (
                      <div className="mt-1 text-sm text-[var(--text-muted)]">
                        Completed {formatLocalTimestamp(slot.completedAtUtc)}
                      </div>
                    ) : null}
                  </div>
                  <span className={compactPillClasses(slotTone(slot.status))}>{slot.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </DashboardShell>
  );
}
