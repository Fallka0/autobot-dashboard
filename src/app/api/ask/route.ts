import { NextRequest, NextResponse } from "next/server";

import { answerAutobotQuestionWithAi, type AskMessage } from "@/lib/autobot-ai";
import { loadDashboardSnapshot } from "@/lib/dashboard-snapshot";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    question?: string;
    messages?: Array<{ role?: string; text?: string }>;
  };
  const question = String(payload.question ?? "").trim();
  const messages: AskMessage[] = Array.isArray(payload.messages)
    ? payload.messages
        .map(
          (item): AskMessage => ({
            role: item.role === "assistant" ? "assistant" : "user",
            text: String(item.text ?? "").trim(),
          }),
        )
        .filter((item) => item.text.length > 0)
    : [];
  const data = await loadDashboardSnapshot();
  const answer = await answerAutobotQuestionWithAi({ question, messages, data });
  return NextResponse.json(
    {
      ...answer,
      question,
      answeredAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
