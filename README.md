# VoteLens 🗳️

> Federal election political intelligence — candidate finance, voting records, and policy in one modern UI.

![VoteLens](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![NestJS](https://img.shields.io/badge/NestJS-10-red)

## What is VoteLens?

VoteLens centralizes everything voters need to make informed decisions about federal candidates:

- 💰 **Campaign Finance** — Total raised, top donors, industry breakdown (via FEC API)
- 🗳️ **Voting Records** — Full vote history, party loyalty score, bipartisan index (via Congress.gov + ProPublica)
- 📋 **Policy Positions** — AI-summarized from official campaign websites
- 🔗 **Campaign Links** — Direct links to every candidate's official site

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, SCSS + Tailwind |
| Backend API | NestJS 10, TypeScript, Prisma |
| Database | PostgreSQL |
| Cache | Redis |
| Search | Meilisearch |
| Data Ingestion | Python (httpx, SQLAlchemy, APScheduler) |
| AI | OpenAI GPT-4o (policy summarization) |
| Animations | Framer Motion |
| Charts | Recharts + Nivo |

## Project Structure

```
votelens/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # NestJS backend
├── services/
│   └── ingestion/    # Python data ingestion (FEC, Congress, ProPublica)
├── packages/
│   └── types/        # Shared TypeScript types
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker + Docker Compose

### 1. Clone & install
```bash
git clone https://github.com/Chippa88/votelens.git
cd votelens
npm install
```

### 2. Environment setup
```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp services/ingestion/.env.example services/ingestion/.env
```
Fill in your API keys (see Environment Variables section below).

### 3. Start infrastructure
```bash
docker-compose up -d
```

### 4. Database setup
```bash
cd apps/api
npx prisma migrate dev --name init
```

### 5. Run data ingestion
```bash
cd services/ingestion
pip install -r requirements.txt
python ingest_fec.py
python ingest_congress.py
```

### 6. Start development servers
```bash
# From root
npm run dev
```

This starts both the Next.js frontend (port 3000) and NestJS API (port 3001).

## Environment Variables

### API Keys to Register
| Service | URL | Cost |
|---------|-----|------|
| FEC API | https://api.data.gov/signup/ | Free |
| Congress.gov | https://api.congress.gov/sign-up/ | Free |
| ProPublica | Email api@propublica.org | Free |
| Google Civic | console.cloud.google.com | Free |
| OpenAI | platform.openai.com | Pay-per-use |

## Data Sources

- **[OpenFEC API](https://api.open.fec.gov/developers/)** — Campaign finance (FEC public data)
- **[Congress.gov API](https://api.congress.gov/)** — Voting records, bill sponsorship
- **[ProPublica Congress API](https://projects.propublica.org/api-docs/congress-api/)** — Member stats
- **[Google Civic Information API](https://developers.google.com/civic-information)** — Districts, officials

All government data is public domain. See [LEGAL.md](LEGAL.md) for attribution and compliance details.

## License

MIT — free to use, modify, and distribute. Attribution appreciated.

---

Built with ❤️ for a more informed electorate.