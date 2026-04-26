# Aether Tax

A full-stack app for **modeling cross-border and domestic transactions**, **resolving which tax rules apply** by jurisdiction, and **surfacing estimated tax exposure** (VAT, GST, withholding, corporate-style rules, and more) in a single workspace. It helps finance and tax teams **see where obligation may arise**, **work from a shared transaction and rules catalog**, and **track records and filing posture** without replacing professional advice or final returns.

**Stack:** Node.js, Express, Mongoose, MongoDB · React, Vite, Tailwind CSS.

---

## The problem (and what this solves)

**Real-world need:** As companies sell or move value across countries, they must juggle many regimes (e.g. indirect tax, WHT, corporate allocation). Spreadsheets and ad hoc emails are hard to audit; teams need a **system of record** for **transactions**, **jurisdictions and rules as of a date**, and **calculated lines of exposure** per deal, with **tenant-scoped** data and optional **LLM-backed reference** hints—not legal or filing automation, but a **clearer operational picture** for review.

**Aether Tax** provides: user/org auth, a **jurisdiction and rule catalog**, a **transaction pipeline** (create, list, classify), a **tax orchestration engine** that matches active rules to transactions and **persists multiple exposure lines**, **tax records and filing status**, a **dashboard** aggregating volume and exposure, and **admin-style CRUD** where roles allow—so the same app supports **exposure review**, **governance of master data**, and **reporting** in one place.

---

## Functionality (at a glance)

| Area | What it does |
|------|----------------|
| **Auth** | Register (org + user), login (JWT), current user. |
| **Organizations** | Read/update your org; admin can create orgs. |
| **Jurisdictions & rules** | CRUD (role-gated) for countries/regions and jurisdictional tax rules; public read lists for many flows. |
| **Transactions** | Create with validation; list with pagination; get by id; **classify** (classified / rejected) with org isolation. |
| **Tax orchestration** | For a transaction, find destination jurisdiction, **active rules as of a date**, compute **multiple** exposure lines (rates, basis text, confidence), replace or append persisted exposures. |
| **Tax exposures** | Calculate via orchestration; list exposures; get by id; list by transaction. Legacy paths under `/exposures/*` and newer `/tax-exposures/*` both exist. |
| **Tax records** | Paginated list, create, bulk upload, patch filing status. |
| **Dashboard** | Summary: counts, cross-border, classification mix, **exposure and confidence aggregates**, **breakdowns by jurisdiction and tax type**, tax record rollups. |
| **Insights (optional AI)** | Reference tax rate hints and suggested rule rates via **Gemini** (requires `GEMINI_API_KEY`)—**not** legal or compliance advice. |
| **Health** | Liveness for ops and load balancers. |

---

## API endpoints

Base URL (local): `http://localhost:5000` — all API routes below are prefixed with `/api` unless stated.

### Health

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/health` | Returns `{ success, message }` — no auth. |

### Auth (`/api/auth`)

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| `POST` | `/api/auth/register` | — | Register organization + first user. |
| `POST` | `/api/auth/login` | — | Returns token + user payload. |
| `GET` | `/api/auth/me` | **Bearer JWT** | Current user. |

### Organizations (`/api/organizations`)

| Method | Path | Auth / roles | Notes |
|--------|------|----------------|--------|
| `POST` | `/api/organizations/` | JWT, **admin** | Create organization. |
| `GET` | `/api/organizations/me` | JWT | Current org. |
| `PATCH` | `/api/organizations/me` | JWT, **admin** or **manager** | Update org. |

### Jurisdictions (`/api/jurisdictions`)

| Method | Path | Auth / roles | Notes |
|--------|------|----------------|--------|
| `POST` | `/api/jurisdictions` | JWT, **admin** or **manager** | Create. |
| `GET` | `/api/jurisdictions` | — | List (catalog). |
| `GET` | `/api/jurisdictions/:id` | — | Get one. |
| `PATCH` | `/api/jurisdictions/:id` | JWT, **admin** or **manager** | Update. |

### Jurisdictional rules (`/api/jurisdictional-rules`)

| Method | Path | Auth / roles | Notes |
|--------|------|----------------|--------|
| `POST` | `/api/jurisdictional-rules` | JWT, **admin** or **manager** | Create rule. |
| `GET` | `/api/jurisdictional-rules` | — | List. |
| `GET` | `/api/jurisdictional-rules/:id` | — | Get one. |
| `PATCH` | `/api/jurisdictional-rules/:id` | JWT, **admin** or **manager** | Update. |

### Tax records

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/tax-records` | Query: pagination, filters. |
| `POST` | `/api/tax-records` | Create record. |
| `POST` | `/api/tax-records/upload` | Body: `records` array — bulk insert. |
| `PATCH` | `/api/tax-records/:id/filing-status` | Update filing status. |

### Transactions (optional auth: JWT decorates `req.user` if present; org often via `x-org-id` or body)

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/transactions` | Create; requires org context. |
| `GET` | `/api/transactions` | List with pagination/sort. |
| `GET` | `/api/transactions/:id` | Get one; **403** if wrong org. |
| `POST` | `/api/transactions/:id/classify` | Body: `{ "status": "classified" \| "rejected" }`. |

### Tax exposures & orchestration (org via JWT / `x-org-id`)

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/tax-exposures/calculate/:transactionId` | Run orchestration; body optional `asOf`. **Alias:** `POST /api/exposures/calculate/:transactionId`. |
| `GET` | `/api/tax-exposures` | List exposures for org. |
| `GET` | `/api/tax-exposures/:id` | Get one. |
| `GET` | `/api/transactions/:transactionId/exposures` | Exposures for a transaction. |
| `GET` | `/api/exposures/transaction/:transactionId` | **Backward compatible** list. |
| `GET` | `/api/exposures` | **Backward compatible** list. |
| `POST` | `/api/tax-orchestrator/run/:transactionId` | Full run; body optional `asOf` (ISO date). |

### Dashboard

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/dashboard/summary` | Aggregated KPIs, exposure by type/jurisdiction, tax record totals. |

### Insights (Gemini — optional; requires API key in env)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/insights/tax-rates` | Query: `countries` (comma ISO), optional `asOf`. |
| `GET` | `/api/insights/suggested-rule-rate` | Query: `country`, `taxCategory`, optional `ruleType`. |

---

## Frontend routes (protected unless noted)

| Path | Purpose |
|------|---------|
| `/login`, `/register` | Auth. |
| `/` → redirects to `/tax-records` | Home when logged in. |
| `/tax-records` | Tax records list, filters, upload, create. |
| `/dashboard` | Executive exposure dashboard, metrics, recent transactions. |
| `/transactions/new` | New transaction form + post-submit **exposure / orchestrator** modal. |
| `/jurisdictions` | Jurisdiction catalog UI. |
| `/rules` | Jurisdictional rules UI. |
| `/profile` | Settings. |
| `*` | Redirects to `/dashboard` (unmatched paths). |

---

## Project structure (abbrev.)

```text
.
├── backend/          # Express API, services, models, tests
├── frontend/         # Vite + React + Tailwind
├── test-reports/     # Generated HTML test reports (see scripts)
└── package.json      # Root scripts (dev, test, test:html)
```

---

## Setup

1. Copy env and configure MongoDB (and optional `GEMINI_API_KEY`, `JWT_SECRET`):

   ```bash
   cp backend/.env.example backend/.env
   ```

2. From repository root, install and run:

   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   npm run dev
   ```

3. **URLs:** frontend `http://localhost:5173` · API `http://localhost:5000` · health: `GET /api/health`

---

## Scripts (root `package.json`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Backend + frontend concurrently. |
| `npm run dev:backend` / `dev:frontend` | Single app. |
| `npm run build` | Production build of the frontend. |
| `npm test` | Jest (backend) then Vitest (frontend), non-watch. |
| `npm run test:html` | HTML reports under `test-reports/` (open `test-reports/index.html`). |
| `npm run test:backend` / `test:frontend` | One side only. |

Backend-only: `npm run test:html --prefix backend` (Jest HTML). Frontend: `npm run test:html --prefix frontend` (Vitest HTML).

---

## Disclaimer

Tax outputs are **illustrative** and depend on your **rule data** and **configuration**. They are **not** legal, accounting, or filing advice. Use licensed professionals for compliance decisions.
