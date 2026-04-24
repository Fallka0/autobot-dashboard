export type Position = {
  symbol: string;
  sizePct: number;
  marketValue: number;
  unrealizedPnlPct: number;
  thesis: string;
  status: "holding" | "watching";
};

export type DecisionEvent = {
  time: string;
  symbol: string;
  action: "BUY" | "HOLD" | "TRIM" | "CLOSE" | "SELL";
  summary: string;
  confidence: number;
};

export type OrderEvent = {
  time: string;
  symbol: string;
  status: "filled" | "submitted" | "canceled" | "blocked";
  detail: string;
};

export type ThoughtEvent = {
  time: string;
  symbol: string;
  action: "BUY" | "HOLD" | "TRIM" | "CLOSE" | "SELL";
  headline: string;
  thesis: string;
  whyItCanWork: string;
  whatCanBreakIt: string;
  whatWouldChangeMind: string;
};

export type NewsItem = {
  title: string;
  summary: string;
  url: string;
  kind: "headline" | "memory";
};

export type DashboardData = {
  botStatus: string;
  mode: string;
  benchmark: string;
  marketRegime: string;
  lastSync: string;
  equity: number;
  cash: number;
  exposurePct: number;
  weeklyPnlPct: number;
  openPositions: number;
  closedOutcomes: number;
  watchlist: Array<{ symbol: string; setup: string; confidence: number; relativeStrengthPct: number }>;
  positions: Position[];
  decisions: DecisionEvent[];
  orders: OrderEvent[];
  thoughts: ThoughtEvent[];
  marketNews: {
    headline: string;
    watching: string[];
    blocking: string[];
    items: NewsItem[];
  };
  learning: {
    openTrackedOutcomes: number;
    closedWithPnl: number;
    note: string;
  };
};

export const fallbackDashboardData: DashboardData = {
  botStatus: "Running",
  mode: "Paper",
  benchmark: "SPY",
  marketRegime: "Bullish",
  lastSync: "2026-04-23 17:29 UTC",
  equity: 99980.92,
  cash: 92975.0,
  exposurePct: 7.02,
  weeklyPnlPct: -0.0,
  openPositions: 2,
  closedOutcomes: 0,
  watchlist: [
    { symbol: "QQQ", setup: "pullback", confidence: 0.8, relativeStrengthPct: 1.42 },
    { symbol: "SPY", setup: "pullback", confidence: 0.8, relativeStrengthPct: 0.0 },
    { symbol: "AAPL", setup: "watch", confidence: 0.72, relativeStrengthPct: 0.54 },
  ],
  positions: [
    {
      symbol: "SPY",
      sizePct: 7.0,
      marketValue: 6981.11,
      unrealizedPnlPct: -0.27,
      thesis: "Holding broad-market pullback exposure while trend and liquidity stay aligned.",
      status: "holding" as const,
    },
    {
      symbol: "QQQ",
      sizePct: 0.02,
      marketValue: 24.9,
      unrealizedPnlPct: -0.41,
      thesis: "Tiny sample position remains open while the bot watches follow-through.",
      status: "watching" as const,
    },
  ],
  decisions: [
    {
      time: "17:15",
      symbol: "SPY",
      action: "HOLD" as const,
      summary: "Existing long position is already open; duplicate BUY/add is blocked.",
      confidence: 0.8,
    },
    {
      time: "17:15",
      symbol: "QQQ",
      action: "HOLD" as const,
      summary: "Existing long position is already open; duplicate BUY/add is blocked.",
      confidence: 0.8,
    },
    {
      time: "17:12",
      symbol: "SPY",
      action: "BUY" as const,
      summary: "Setup passed trend, liquidity, reward/risk, and research checks.",
      confidence: 0.8,
    },
  ],
  orders: [
    {
      time: "17:12",
      symbol: "SPY",
      status: "filled" as const,
      detail: "Filled $7,000 paper BUY at 707.96.",
    },
    {
      time: "17:08",
      symbol: "QQQ",
      status: "filled" as const,
      detail: "Filled $25 sample BUY at 652.77.",
    },
    {
      time: "16:58",
      symbol: "SPY",
      status: "canceled" as const,
      detail: "Earlier pre-open test order canceled unfilled by broker.",
    },
  ],
  thoughts: [
    {
      time: "17:15",
      symbol: "SPY",
      action: "HOLD",
      headline: "Existing long position is already open; duplicate BUY/add is blocked.",
      thesis: "AutoBot still likes the broad-market backdrop, but it does not want to hide in more SPY just because it is familiar.",
      whyItCanWork:
        "AutoBot still thinks this can work because the broader trend is intact, liquidity is easy to manage, and the position already has a valid reason to exist. Right now it is treating SPY as acceptable exposure, not as a place to get lazy.",
      whatCanBreakIt:
        "What worries AutoBot most is that SPY can become a comfort trade. If stronger names start showing better relative strength and the bot keeps defaulting to the benchmark, this position stops being useful alpha and starts becoming benchmark hugging.",
      whatWouldChangeMind:
        "AutoBot would change its mind if trend support breaks, if the macro backdrop turns materially worse, or if the original pullback thesis stops matching what price is actually doing.",
    },
  ],
  marketNews: {
    headline: "Markets are leaning back toward earnings strength while still watching Fed and inflation risk.",
    watching: ["fed", "inflation", "war"],
    blocking: [],
    items: [
      {
        title: "Markets are leaning back toward earnings strength",
        summary: "The bot sees a constructive tape, but it is still tracking macro risks that could interrupt follow-through.",
        url: "",
        kind: "headline",
      },
    ],
  },
  learning: {
    openTrackedOutcomes: 8,
    closedWithPnl: 0,
    note: "The bot is still collecting completed trade cycles before changing sizing or blocking setups.",
  },
};

export const dashboardSnapshotEndpoint = "/api/dashboard";
