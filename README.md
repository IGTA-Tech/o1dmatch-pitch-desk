# O1DMatch Pitch Desk

Internal AI outreach generator for the O1DMatch sales/recruiting team. Replaces the original Google Apps Script + Sheets handoff with a modern Next.js stack while keeping the same prompt library, banned-phrase guardrails, and Google Sheet mirror.

## Stack

Next.js 15 (App Router) + TypeScript - Tailwind v4 + shadcn/ui - Clerk auth - Neon Postgres + Drizzle - OpenRouter via Vercel AI SDK - googleapis (Sheets mirror).

## Quick start

```bash
cp .env.example .env.local      # fill in real values - see SETUP.md
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

## Documentation

- **CLAUDE.md** - full project knowledge, data model, generation pipeline, UI rules. Read this first.
- **SETUP.md** - step-by-step account creation (Neon, Clerk, Google Cloud).

## AI model routing

| Slot | Model | When it runs |
| --- | --- | --- |
| Primary | GLM-5.1 (`z-ai/glm-4.6`) | Default. IFBench leader; the strongest open-weights model for our strict-instruction task. |
| Bulk | DeepSeek V3.2 (`deepseek/deepseek-chat`) | "Generate for All Contacts" button. |
| Fallback | OpenAI gpt-4.1-mini | Auto-retry if primary returns invalid JSON or errors. |

Runtime cost at internal-team volume: under $15/month.
