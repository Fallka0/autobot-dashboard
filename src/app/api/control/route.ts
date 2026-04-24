import { NextRequest, NextResponse } from "next/server";

const githubApiBase = "https://api.github.com";
const githubOwner = process.env.DASHBOARD_CONTROL_GITHUB_OWNER ?? "Fallka0";
const githubRepo = process.env.DASHBOARD_CONTROL_GITHUB_REPO ?? "autobot-dashboard";
const githubBranch = process.env.DASHBOARD_CONTROL_GITHUB_BRANCH ?? "data";
const githubPath = process.env.DASHBOARD_CONTROL_GITHUB_PATH ?? "public/data/control_queue.json";
const controlToken = process.env.AUTOBOT_CONTROL_TOKEN;
const githubWriteToken =
  process.env.AUTOBOT_CONTROL_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;

const allowedActions = new Set([
  "start_bot",
  "stop_bot",
  "run_premarket",
  "run_open",
  "run_midday",
  "run_position_watch",
  "run_eod",
  "sync_dashboard",
]);

type ControlQueue = {
  commands: Array<Record<string, unknown>>;
  updatedAtUtc: string | null;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(request: NextRequest) {
  if (!controlToken || !githubWriteToken) {
    return NextResponse.json(
      { status: "unavailable", reason: "dashboard_control_not_configured" },
      { status: 503 },
    );
  }

  const providedToken = request.headers.get("x-autobot-control-token");
  if (!providedToken || providedToken !== controlToken) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  const action = body?.action?.trim();
  if (!action || !allowedActions.has(action)) {
    return NextResponse.json({ status: "invalid_action" }, { status: 400 });
  }

  const existing = await readQueue();
  const queuedCommand = {
    id: crypto.randomUUID().replaceAll("-", ""),
    action,
    status: "queued",
    requestedAtUtc: new Date().toISOString(),
    requester: "dashboard-web",
  };
  const queue: ControlQueue = {
    commands: [...existing.queue.commands, queuedCommand].slice(-50),
    updatedAtUtc: new Date().toISOString(),
  };

  await writeQueue(queue, existing.sha, `Queue ${action} command`);
  return NextResponse.json({ status: "queued", command: queuedCommand }, { status: 200 });
}

async function readQueue(): Promise<{ queue: ControlQueue; sha: string | null }> {
  const response = await fetch(
    `${githubApiBase}/repos/${githubOwner}/${githubRepo}/contents/${encodeURIComponent(githubPath)}?ref=${encodeURIComponent(githubBranch)}`,
    {
      cache: "no-store",
      headers: githubHeaders(),
    },
  );
  if (response.status === 404) {
    return { queue: { commands: [], updatedAtUtc: null }, sha: null };
  }
  if (!response.ok) {
    throw new Error(`queue fetch failed: ${response.status}`);
  }
  const payload = (await response.json()) as { content?: string; sha?: string };
  const content = payload.content?.replace(/\n/g, "");
  if (!content) {
    return { queue: { commands: [], updatedAtUtc: null }, sha: payload.sha ?? null };
  }
  const parsed = JSON.parse(Buffer.from(content, "base64").toString("utf-8")) as ControlQueue;
  return {
    queue: {
      commands: Array.isArray(parsed.commands) ? parsed.commands : [],
      updatedAtUtc: typeof parsed.updatedAtUtc === "string" ? parsed.updatedAtUtc : null,
    },
    sha: payload.sha ?? null,
  };
}

async function writeQueue(queue: ControlQueue, sha: string | null, message: string) {
  let currentQueue = queue;
  let currentSha = sha;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(
      `${githubApiBase}/repos/${githubOwner}/${githubRepo}/contents/${encodeURIComponent(githubPath)}`,
      {
        method: "PUT",
        headers: githubHeaders(),
        body: JSON.stringify({
          message,
          branch: githubBranch,
          content: Buffer.from(`${JSON.stringify(currentQueue, null, 2)}\n`, "utf-8").toString("base64"),
          ...(currentSha ? { sha: currentSha } : {}),
        }),
      },
    );
    if (response.ok) {
      return;
    }
    if (response.status !== 409 || attempt === 1) {
      throw new Error(`queue write failed: ${response.status}`);
    }
    const latest = await readQueue();
    currentQueue = mergeQueues(latest.queue, currentQueue);
    currentSha = latest.sha;
  }
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${githubWriteToken}`,
    "User-Agent": "autobot-dashboard-control",
    "Content-Type": "application/json",
  };
}

function mergeQueues(base: ControlQueue, updated: ControlQueue): ControlQueue {
  const merged = new Map<string, Record<string, unknown>>();
  for (const entry of base.commands) {
    const id = typeof entry.id === "string" ? entry.id : null;
    if (id) {
      merged.set(id, { ...entry });
    }
  }
  for (const entry of updated.commands) {
    const id = typeof entry.id === "string" ? entry.id : null;
    if (id) {
      merged.set(id, { ...entry });
    }
  }
  return {
    commands: Array.from(merged.values()).slice(-50),
    updatedAtUtc: updated.updatedAtUtc ?? base.updatedAtUtc,
  };
}
