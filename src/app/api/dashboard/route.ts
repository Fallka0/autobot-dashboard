import { NextResponse } from "next/server";

import { loadDashboardSnapshot } from "@/lib/dashboard-snapshot";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const snapshot = await loadDashboardSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
