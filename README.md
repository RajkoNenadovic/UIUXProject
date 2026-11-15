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

Open the client and choose **Create account**. The seed data does not contain any user (no password is stored in the repository). If you had a database before accounts were added, run `npm run db:init` again: it only adds the new `users` and `sessions` tables.

## Accounts and sign-in (screens 01 and 02)

- **Sign in / create account** (`/login`, `/register`) and **role selection** (`/onboarding`, two steps: role, then reading level).
- Passwords are hashed with scrypt (a random salt per user, parameters stored with the hash). Plain passwords are never stored or logged.
- A signed-in browser holds a random session token in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` when `NODE_ENV=production`). The database stores only a SHA-256 hash of the token.
- Sign-in is limited to 5 failed attempts per 15 minutes for each email (in memory, so it resets when the server restarts).
- Language, reading level and reading-comfort settings belong to each user.
- Every `/api` route except `/api/health` and `/api/auth/*` answers `401 UNAUTHENTICATED` when nobody is signed in.

Known limits: documents and the saved glossary are shared by everyone who can sign in to the same server; "Continue with Google" and school/work SSO are shown as *coming soon*; there is no password reset by email.

## Tests

```bash
npm test --prefix server     # starts the API on a throw-away database and a fake dictionary service, runs every check
npm test --prefix client     # component tests (vitest + Testing Library); run `npm install --prefix client` first
npm run check:i18n --prefix client   # en / es / hr have the same keys, variables and plural forms
```

## Third-party services and libraries

- Dictionary lookups use the free [Free Dictionary API](https://dictionaryapi.dev) (no key), whose data comes from Wiktionary under CC BY-SA 3.0. Results are cached in the `term_cache` table. See `server/src/services/dictionary.js`.
- Libraries: React, React Router, i18next / react-i18next, Vite, Express, better-sqlite3, cors, dotenv. Test-only: vitest, jsdom, Testing Library.
- Parts of the server and client code were written with AI assistance (Claude by Anthropic); the use is declared in the deliverable document.

## Status

Phase 1 foundation (health route, schema and seed, translated shell, routes, accessible layout, shared UI primitives) plus the Core Architecture, Onboarding and User Management feature area: accounts, role selection, documents list and upload, glossary with dictionary API, settings, help, and loading / empty / error / offline states.
