import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import { answerAutobotQuestion, autobotAiContext } from "@/lib/autobot-qa";
import type { DashboardData } from "@/lib/dashboard-data";

export type AskMessage = {
  role: "user" | "assistant";
  text: string;
};

export async function answerAutobotQuestionWithAi({
  question,
  messages,
  data,
}: {
  question: string;
  messages: AskMessage[];
  data: DashboardData;
}) {
  const model = resolveAutobotModel();
  if (!model) {
    return answerAutobotQuestion(question, data);
  }

  const context = JSON.stringify(autobotAiContext(data), null, 2);
  const trimmedMessages = messages.slice(-8).map((message) => ({
    role: message.role,
    content: message.text,
  }));

  try {
    const result = await generateText({
      model,
      temperature: 0.3,
      maxOutputTokens: 500,
      system: [
        "You are AutoBot's operator-facing AI explainer.",
        "Answer the user's question using only the provided live dashboard snapshot context and recent chat history.",
        "Be thoughtful, direct, and specific.",
        "Do not invent prices, orders, decisions, or risks that are not present in the context.",
        "If the snapshot does not support a strong conclusion, say that clearly.",
        "Prefer concise, natural prose over bullet lists unless a list is genuinely clearer.",
        "When relevant, explain not just what the bot did, but why the current logic would hesitate, wait, or prefer another setup.",
        "Treat SPY as the benchmark and remember the strategy is long-only paper trading.",
        "",
        "Live snapshot context:",
        context,
      ].join("\n"),
      messages: [
        ...trimmedMessages,
        {
          role: "user",
          content: question,
        },
      ],
    });

    const answer = result.text.trim();
    if (!answer) {
      return answerAutobotQuestion(question, data);
    }

    return {
      title: inferTitle(question),
      answer,
      mode: "ai" as const,
    };
  } catch {
    return answerAutobotQuestion(question, data);
  }
}

function resolveAutobotModel() {
  const configuredModel = process.env.AUTOBOT_ASK_MODEL?.trim();
  if (process.env.OPENAI_API_KEY) {
    return openai(configuredModel || "gpt-4o-mini");
  }
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    return configuredModel || "openai/gpt-4o-mini";
  }
  return null;
}

function inferTitle(question: string) {
  const cleaned = question.trim();
  if (!cleaned) {
    return "Ask AutoBot";
  }
  if (cleaned.length <= 64) {
    return cleaned;
  }
  return `${cleaned.slice(0, 61).trimEnd()}...`;
}
