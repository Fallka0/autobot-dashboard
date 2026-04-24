import { NextRequest, NextResponse } from "next/server";

import { answerAutobotQuestion } from "@/lib/autobot-qa";
import { loadDashboardSnapshot } from "@/lib/dashboard-snapshot";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as { question?: string };
  const question = String(payload.question ?? "").trim();
  const data = await loadDashboardSnapshot();
  const answer = answerAutobotQuestion(question, data);
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
