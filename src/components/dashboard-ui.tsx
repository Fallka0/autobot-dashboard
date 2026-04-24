"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function pct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function confidenceTone(value: number) {
  if (value >= 0.8) return "app-chip-success";
  if (value >= 0.7) return "app-chip-info";
  if (value >= 0.62) return "app-chip-warning";
  return "app-chip-danger";
}

export function orderTone(status: string) {
  if (status === "filled") return "app-chip-success";
  if (status === "submitted") return "app-chip-info";
  if (status === "blocked") return "app-chip-warning";
  return "app-chip-danger";
}

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/research", label: "News & Thoughts" },
  { href: "/operations", label: "Operations" },
];

export function DashboardShell({
  title,
  subtitle,
  headerPills,
  children,
}: {
  title: string;
  subtitle: string;
  headerPills: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="app-shell">
      <header className="app-header sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-[var(--header-text)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--header-border)] bg-[var(--header-pill)] text-lg">
                A
              </div>
              <div className="leading-tight">
                <span className="block text-lg font-semibold tracking-tight">AutoBot</span>
                <span className="block text-xs text-[var(--header-subtext)]">{subtitle}</span>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              {headerPills.map((pill) => (
                <HeaderPill key={pill} label={pill} />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-white text-slate-950"
                      : "border border-[color:var(--header-border)] bg-[var(--header-pill)] text-[var(--header-text-muted)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <span className="ml-auto hidden text-sm text-[var(--header-text-muted)] md:block">
              {title}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">{children}</div>
    </main>
  );
}

export function HeaderPill({ label }: { label: string }) {
  const renderedLabel = label.startsWith("Sync: ")
    ? `Sync: ${formatLocalTimestamp(label.slice("Sync: ".length))}`
    : label;
  return (
    <div className="rounded-full border border-[color:var(--header-border)] bg-[var(--header-pill)] px-4 py-2 text-sm text-[var(--header-text-muted)]">
      {renderedLabel}
    </div>
  );
}

export function Panel({
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
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--text-soft)]">{meta}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-hero-stat rounded-2xl px-4 py-5 text-center">
      <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

export function Kpi({
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
      <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--text-muted)]">{detail}</div>
    </div>
  );
}

export function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="app-chip rounded-full px-3 py-1 font-medium">{children}</span>;
}

export function Tag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "watch" | "block";
}) {
  const palette = tone === "block" ? "app-chip-danger" : "app-chip-warning";
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${palette}`}>{children}</span>;
}

function formatLocalTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(parsed);
}
