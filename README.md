# Plain Language Layer

A responsive university project for **Designing the User Experience — Deliverable 2**. Plain Language Layer places a plain-language explanation beside an administrative or legal document and makes uncertainty visible.

## Stack

- React + Vite in `client`
- Node.js + Express in `server`
- SQLite with `better-sqlite3`
- React Router and `react-i18next` with English, Spanish, and Croatian locales

## Setup

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm install --prefix client
npm install --prefix server
copy .env.example .env
npm run db:init
npm run db:seed
npm run dev
```

The client runs at `http://localhost:5173` and the API runs at `http://localhost:3001`. The health check is available at `GET /api/health`.

The SQLite database is created under `server/data/` and is ignored by git. Never commit `.env` or database files.

## Phase 1 status

The foundation includes the Express health route, database schema and seed, translated React shell, required document routes, accessible layout, and shared UI primitives. Document CRUD and the wireframe-specific screens are planned for later phases.
