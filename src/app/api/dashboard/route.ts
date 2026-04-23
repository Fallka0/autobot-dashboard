import { NextResponse } from "next/server";

import { fallbackDashboardData } from "@/lib/dashboard-data";

const snapshotApiUrl =
  process.env.DASHBOARD_SNAPSHOT_API_URL ??
  "https://api.github.com/repos/Fallka0/autobot-dashboard/contents/public/data/latest.json?ref=data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const response = await fetch(snapshotApiUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "autobot-dashboard",
      },
    });
    if (!response.ok) {
      throw new Error(`snapshot fetch failed with ${response.status}`);
    }
    const payload = (await response.json()) as { content?: string };
    const content = payload.content?.replace(/\n/g, "");
    if (!content) {
      throw new Error("snapshot payload missing content");
    }
    const decoded = Buffer.from(content, "base64").toString("utf-8");
    return NextResponse.json(JSON.parse(decoded), {
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
