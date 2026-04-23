# AutoBot Dashboard

Next.js dashboard app for monitoring AutoBot paper trading on Vercel.

## Current Scope

- portfolio overview
- position monitoring
- decision feed
- broker order lifecycle
- market context
- learning status

The current app is a live-ready shell with mocked AutoBot data so the UI can be built and deployed before wiring a real backend.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Planned Live Data Flow

The intended next step is to connect this dashboard to AutoBot runtime data:

- `broker_snapshot.json`
- `paper_portfolio.json`
- `decision_journal.jsonl`
- `order_events.jsonl`
- `trade_outcomes.jsonl`
- `strategy_metrics.json`

For Vercel, the cleanest production path is to expose a small authenticated API or webhook feed from the bot runtime rather than trying to read local files directly.

## Deploy on Vercel

This repo is structured as a standard Next.js app and is ready for Vercel once pushed to GitHub.
