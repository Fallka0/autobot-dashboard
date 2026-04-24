"use client";

import { FormEvent, useState } from "react";

import { DashboardShell, Panel, formatLocalTimestamp } from "@/components/dashboard-ui";
import { useDashboardData } from "@/lib/use-dashboard-data";

type ChatTurn = {
  role: "user" | "bot";
  text: string;
  title?: string;
  time?: string;
};

const starterQuestions = [
  "Why not buy more QQQ right now?",
  "What does AutoBot think about SPY?",
  "What risks is the bot watching?",
  "Summarize the current portfolio.",
];

export default function AskPage() {
  const data = useDashboardData();
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: "bot",
      title: "Ask AutoBot",
      text: "You can ask about a symbol, the portfolio, or the market context. Try something like “Why not buy more QQQ right now?”",
    },
  ]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    setTurns((current) => [...current, { role: "user", text: trimmed }]);
    setQuestion("");
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmed }),
      });
      const payload = (await response.json()) as { answer?: string; title?: string; answeredAt?: string };
      setTurns((current) => [
        ...current,
        {
          role: "bot",
          title: payload.title ?? "AutoBot answer",
          text: payload.answer ?? "I could not build a useful answer from the current snapshot.",
          time: payload.answeredAt,
        },
      ]);
    } catch {
      setTurns((current) => [
        ...current,
        {
          role: "bot",
          title: "AutoBot answer",
          text: "I could not reach the dashboard snapshot just now. Try again in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardShell
      title="Ask AutoBot"
      subtitle="Question the bot about current decisions and exposures"
      headerPills={[`Mode: ${data.mode}`, `Benchmark: ${data.benchmark}`, `Sync: ${data.lastSync}`]}
    >
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Panel title="Chat" meta="Ask why the bot is holding, skipping, or worrying">
          <div className="space-y-4">
            <div className="space-y-3">
              {turns.map((turn, index) => (
                <div
                  key={`${turn.role}-${index}`}
                  className={`rounded-3xl px-4 py-4 ${turn.role === "bot" ? "app-card" : "border border-[color:var(--border-subtle)] bg-[var(--surface-muted)]"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {turn.role === "bot" ? turn.title ?? "AutoBot" : "You"}
                    </div>
                    {turn.time ? (
                      <div className="text-xs text-[var(--text-muted)]">{formatLocalTimestamp(turn.time)}</div>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{turn.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-3">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={4}
                placeholder="Why not buy more QQQ right now?"
                className="w-full rounded-3xl border border-[color:var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-[var(--text-muted)]">Answers come from the latest live dashboard snapshot.</div>
                <button
                  type="submit"
                  disabled={busy || !question.trim()}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Thinking..." : "Ask"}
                </button>
              </div>
            </form>
          </div>
        </Panel>

        <Panel title="Good Prompts" meta="A few useful ways to question the bot">
          <div className="space-y-3">
            {starterQuestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuestion(item)}
                className="app-card block w-full rounded-3xl px-4 py-4 text-left text-sm leading-6 text-[var(--text-secondary)]"
              >
                {item}
              </button>
            ))}
          </div>
        </Panel>
      </section>
    </DashboardShell>
  );
}
