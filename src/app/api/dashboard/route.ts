import { NextResponse } from "next/server";

import { fallbackDashboardData } from "@/lib/dashboard-data";

const snapshotUrl =
  process.env.DASHBOARD_SNAPSHOT_URL ??
  "https://raw.githubusercontent.com/Fallka0/autobot-dashboard/data/public/data/latest.json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(snapshotUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`snapshot fetch failed with ${response.status}`);
    }
    const payload = await response.json();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json(fallbackDashboardData, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
