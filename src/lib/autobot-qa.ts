import type { DashboardData, DecisionEvent, Position, ThoughtEvent } from "@/lib/dashboard-data";

export function answerAutobotQuestion(question: string, data: DashboardData) {
  const normalized = question.trim();
  const lowered = normalized.toLowerCase();
  const symbol = detectSymbol(normalized, data);
  const latestDecision = symbol ? latestDecisionFor(symbol, data.decisions) : undefined;
  const position = symbol ? data.positions.find((item) => item.symbol === symbol) : undefined;
  const thought = symbol ? data.thoughts.find((item) => item.symbol === symbol) : undefined;

  if (!normalized) {
    return {
      answer:
        "Ask me about a symbol, a position, or the market context. Good examples are: why not buy more QQQ, what does AutoBot think about SPY, or what risks is the bot watching right now?",
      title: "Ask AutoBot",
    };
  }

  if (symbol && asksWhyNoAdd(lowered)) {
    return {
      title: `Why not more ${symbol}?`,
      answer: explainWhyNoAdd(symbol, latestDecision, position, thought),
    };
  }

  if (symbol && asksAboutCurrentView(lowered)) {
    return {
      title: `Current view on ${symbol}`,
      answer: explainSymbolView(symbol, latestDecision, position, thought),
    };
  }

  if (lowered.includes("risk") || lowered.includes("news") || lowered.includes("watching")) {
    return {
      title: "Market risks",
      answer: explainMarketContext(data),
    };
  }

  if (lowered.includes("position") || lowered.includes("holding") || lowered.includes("portfolio")) {
    return {
      title: "Portfolio view",
      answer: explainPortfolio(data),
    };
  }

  if (lowered.includes("learn")) {
    return {
      title: "Learning status",
      answer: `AutoBot is still early in its learning cycle. It currently has ${data.learning.openTrackedOutcomes} open tracked outcomes and ${data.learning.closedWithPnl} closed outcomes with realized PnL, so it is mostly collecting evidence rather than making aggressive rule changes. ${data.learning.note}`,
    };
  }

  if (symbol) {
    return {
      title: `${symbol} overview`,
      answer: explainSymbolView(symbol, latestDecision, position, thought),
    };
  }

  return {
    title: "AutoBot answer",
    answer: explainGeneralState(data),
  };
}

function detectSymbol(question: string, data: DashboardData) {
  const universe = new Set<string>();
  data.positions.forEach((item) => universe.add(item.symbol));
  data.watchlist.forEach((item) => universe.add(item.symbol));
  data.decisions.forEach((item) => universe.add(item.symbol));
  data.thoughts.forEach((item) => universe.add(item.symbol));
  return [...universe].find((symbol) => new RegExp(`\\b${escapeRegex(symbol)}\\b`, "i").test(question));
}

function latestDecisionFor(symbol: string, decisions: DecisionEvent[]) {
  return decisions.find((item) => item.symbol === symbol);
}

function asksWhyNoAdd(lowered: string) {
  return (
    lowered.includes("why not") ||
    lowered.includes("why doesnt") ||
    lowered.includes("why doesn't") ||
    lowered.includes("more") ||
    lowered.includes("add") ||
    lowered.includes("buy more")
  );
}

function asksAboutCurrentView(lowered: string) {
  return lowered.includes("think") || lowered.includes("view") || lowered.includes("opinion") || lowered.includes("why") || lowered.includes("status");
}

function explainWhyNoAdd(
  symbol: string,
  decision: DecisionEvent | undefined,
  position: Position | undefined,
  thought: ThoughtEvent | undefined,
) {
  const parts: string[] = [];
  if (decision) {
    parts.push(`Right now AutoBot's latest ${symbol} decision is ${decision.action} with confidence ${decision.confidence.toFixed(2)}.`);
    parts.push(`The immediate reason is: ${decision.summary}.`);
  }
  if (position) {
    parts.push(
      `${symbol} is already an open position at about ${position.sizePct.toFixed(2)}% of equity, so the bot is treating it as something to manage rather than a fresh entry.`
    );
  }
  if (thought) {
    parts.push(thought.whatCanBreakIt);
  }
  parts.push(
    `In plain English: the current logic is conservative about adding to names it already owns. It wants a clean new reason to increase exposure, not just “we already like this one.”`
  );
  return parts.join(" ");
}

function explainSymbolView(
  symbol: string,
  decision: DecisionEvent | undefined,
  position: Position | undefined,
  thought: ThoughtEvent | undefined,
) {
  const parts: string[] = [];
  if (decision) {
    parts.push(`AutoBot's latest decision on ${symbol} is ${decision.action} with confidence ${decision.confidence.toFixed(2)}.`);
    parts.push(`The short reason logged was: ${decision.summary}.`);
  }
  if (position) {
    parts.push(`${symbol} is currently held at roughly ${position.sizePct.toFixed(2)}% of equity and the live thesis is: ${position.thesis}`);
  }
  if (thought) {
    parts.push(thought.whyItCanWork);
    parts.push(thought.whatWouldChangeMind);
  }
  return parts.join(" ");
}

function explainMarketContext(data: DashboardData) {
  const watching = data.marketNews.watching.length
    ? `The bot is actively watching ${data.marketNews.watching.join(", ")}.`
    : "The bot is not highlighting any specific macro keywords right now.";
  const blocking = data.marketNews.blocking.length
    ? `These are serious enough to block new entries: ${data.marketNews.blocking.join(", ")}.`
    : "Nothing in the current market memory is marked as a hard block on new entries.";
  return `${data.marketNews.headline} ${watching} ${blocking}`;
}

function explainPortfolio(data: DashboardData) {
  if (!data.positions.length) {
    return "AutoBot has no open positions right now, so it is waiting for setups rather than managing exposure.";
  }
  const summary = data.positions
    .map((item) => `${item.symbol} at ${item.sizePct.toFixed(2)}% of equity`)
    .join(", ");
  return `AutoBot currently has ${data.positions.length} open positions: ${summary}. Total gross exposure is about ${data.exposurePct.toFixed(2)}%, so the portfolio is still relatively lightly deployed.`;
}

function explainGeneralState(data: DashboardData) {
  const leadDecision = data.decisions[0];
  const lead = leadDecision
    ? `The latest logged decision is ${leadDecision.symbol} ${leadDecision.action} with confidence ${leadDecision.confidence.toFixed(2)} because ${leadDecision.summary}.`
    : "There is no fresh decision in the snapshot yet.";
  return `${lead} AutoBot is ${data.botStatus.toLowerCase()} in ${data.mode.toLowerCase()} mode, tracking ${data.openPositions} open positions, with ${data.exposurePct.toFixed(2)}% exposure against ${data.benchmark} as the benchmark.`;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
