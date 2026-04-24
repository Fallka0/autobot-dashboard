"use client";

import { useEffect, useState } from "react";

import {
  dashboardSnapshotEndpoint,
  fallbackDashboardData,
  type DashboardData,
} from "@/lib/dashboard-data";

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(fallbackDashboardData);

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
    const intervalId = window.setInterval(load, 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return data;
}
