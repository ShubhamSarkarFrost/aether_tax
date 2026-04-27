# Aether Tax

A full-stack app for **modeling cross-border and domestic transactions**, **resolving which tax rules apply** by jurisdiction, and **surfacing estimated tax exposure** (VAT, GST, withholding, corporate-style rules, and more) in a single workspace. It helps finance and tax teams **see where obligation may arise**, **work from a shared transaction and rules catalog**, and **track records and filing posture** without replacing professional advice or final returns.

**Technology stack**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/) [![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/) [![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat&logo=mongoose&logoColor=white)](https://mongoosejs.com/) [![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/) [![React](https://img.shields.io/badge/React-20232a?style=flat&logo=react&logoColor=61dafb)](https://react.dev/) [![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/) [![Tailwind%20CSS](https://img.shields.io/badge/Tailwind_CSS-0f172a?style=flat&logo=tailwindcss&logoColor=38bdf8)](https://tailwindcss.com/)

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

Base URL (local): `http://localhost:5000`. Unless noted, responses are JSON with `success: true` on success, or `success: false` and `message` on error.

**Org context (transactions, exposures, orchestrator, dashboard):** resolved as `Authorization: Bearer <JWT>` → `req.user.orgId`, else header `x-org-id`, else body field `org_id`. If missing where required, the handler returns **400** with a message like `org_id is required`.

**IDs:** Replace `:id` and `:transactionId` with real MongoDB `ObjectId` strings from your data.

**Path aliases (same request/response as the primary route in this section):**

| Alias | Primary (see heading below) |
|--------|----------------------------|
| `POST /api/exposures/calculate/:transactionId` | `POST /api/tax-exposures/calculate/:transactionId` |
| `GET /api/exposures` | `GET /api/tax-exposures` |
| `GET /api/exposures/transaction/:transactionId` | `GET /api/transactions/:transactionId/exposures` |

---

### `GET /api/health`

- **Auth:** none  
- **Request:** no body  

**Example response (200):**

```json
{
  "success": true,
  "message": "Backend is running"
}
```

---

### `POST /api/auth/register`

- **Auth:** none  
- **Body (JSON):**

```json
{
  "organization": {
    "legal_name": "Acme Global Ltd",
    "entity_type": "corporation",
    "country_of_incorporation": "US",
    "tax_identification_number": "12-3456789",
    "org_tier": "growth"
  },
  "user": {
    "full_name": "Jane Analyst",
    "email": "jane@example.com",
    "password": "hunter2secret",
    "role": "admin"
  }
}
```

- `organization.org_tier` optional: `starter` | `growth` | `enterprise`  
- `user.role` optional: `admin` | `manager` | `analyst` | `viewer` (defaults to `admin`)

**Example response (201):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "675a1b2c3d4e5f6789abcdef",
      "full_name": "Jane Analyst",
      "email": "jane@example.com",
      "role": "admin",
      "org_id": "675a1b2c3d4e5f6789abcde0"
    },
    "organization": {
      "_id": "675a1b2c3d4e5f6789abcde0",
      "legal_name": "Acme Global Ltd",
      "entity_type": "corporation",
      "country_of_incorporation": "US",
      "org_tier": "growth",
      "is_active": true,
      "createdAt": "2026-04-27T12:00:00.000Z",
      "updatedAt": "2026-04-27T12:00:00.000Z"
    }
  }
}
```

**Errors:** **400** validation; **409** email already in use.

---

### `POST /api/auth/login`

- **Auth:** none  

**Body (JSON):**

```json
{
  "email": "jane@example.com",
  "password": "hunter2secret"
}
```

**Example response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "675a1b2c3d4e5f6789abcdef",
      "full_name": "Jane Analyst",
      "email": "jane@example.com",
      "role": "admin",
      "org_id": "675a1b2c3d4e5f6789abcde0"
    }
  }
}
```

**Errors:** **400** validation; **401** invalid credentials.

---

### `GET /api/auth/me`

- **Auth:** `Authorization: Bearer <JWT>`

**Example response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "675a1b2c3d4e5f6789abcdef",
    "full_name": "Jane Analyst",
    "email": "jane@example.com",
    "role": "admin",
    "org_id": "675a1b2c3d4e5f6789abcde0",
    "is_active": true,
    "createdAt": "2026-04-27T12:00:00.000Z",
    "updatedAt": "2026-04-27T12:00:00.000Z"
  }
}
```

**Errors:** **401** missing/invalid token; **404** user not found.

---

### `POST /api/organizations/`

- **Auth:** JWT with role **admin**

**Body (JSON)** — fields match the `Organization` model (see register example); e.g.:

```json
{
  "legal_name": "Subsidiary B.V.",
  "entity_type": "private_limited",
  "country_of_incorporation": "NL",
  "tax_identification_number": "NL123456789B01",
  "org_tier": "enterprise",
  "is_active": true
}
```

**Example response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "675a1b2c3d4e5f6789abcde1",
    "legal_name": "Subsidiary B.V.",
    "entity_type": "private_limited",
    "country_of_incorporation": "NL",
    "tax_identification_number": "NL123456789B01",
    "org_tier": "enterprise",
    "is_active": true,
    "createdAt": "2026-04-27T12:05:00.000Z",
    "updatedAt": "2026-04-27T12:05:00.000Z"
  }
}
```

---

### `GET /api/organizations/me`

- **Auth:** JWT (any authenticated user)

**Example response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "675a1b2c3d4e5f6789abcde0",
    "legal_name": "Acme Global Ltd",
    "entity_type": "corporation",
    "country_of_incorporation": "US",
    "org_tier": "growth",
    "is_active": true
  }
}
```

**Errors:** **404** organization not found.

---

### `PATCH /api/organizations/me`

- **Auth:** JWT; role **admin** or **manager**

**Body (JSON)** — partial update, e.g.:

```json
{
  "legal_name": "Acme Global Holdings Ltd",
  "org_tier": "enterprise"
}
```

**Example response (200):** same shape as `GET /api/organizations/me` with updated fields.

---

### `POST /api/jurisdictions`

- **Auth:** JWT; role **admin** or **manager**

**Body (JSON):**

```json
{
  "country_code": "in",
  "region_code": "ka",
  "name": "Karnataka",
  "currency": "inr",
  "tax_authority_name": "Commercial Taxes Department",
  "active": true
}
```

(`country_code`, `region_code`, `currency` are normalized to uppercase by the API.)

**Example response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "675a1b2c3d4e5f6789abcde2",
    "country_code": "IN",
    "region_code": "KA",
    "name": "Karnataka",
    "currency": "INR",
    "tax_authority_name": "Commercial Taxes Department",
    "active": true,
    "createdAt": "2026-04-27T12:10:00.000Z",
    "updatedAt": "2026-04-27T12:10:00.000Z"
  }
}
```

---

### `GET /api/jurisdictions`

- **Auth:** none  

**Example response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "675a1b2c3d4e5f6789abcde2",
      "country_code": "IN",
      "name": "Karnataka",
      "currency": "INR",
      "active": true
    }
  ]
}
```

---

### `GET /api/jurisdictions/:id`

- **Auth:** none  

**Example response (200):** `{ "success": true, "data": { ... same document as create ... } }`  

**Errors:** **404** / **500** with `message` if not found.

---

### `PATCH /api/jurisdictions/:id`

- **Auth:** JWT; role **admin** or **manager**

**Body (JSON):**

```json
{
  "active": false,
  "name": "Karnataka (updated)"
}
```

**Example response (200):** `{ "success": true, "data": { ... updated jurisdiction ... } }`

---

### `POST /api/jurisdictional-rules`

- **Auth:** JWT; role **admin** or **manager**

**Body (JSON):**

```json
{
  "jurisdiction_id": "675a1b2c3d4e5f6789abcde2",
  "rule_type": "indirect_tax",
  "tax_category": "GST",
  "standard_rate": 0.18,
  "rule_logic": "Standard supply",
  "valid_from": "2026-01-01T00:00:00.000Z",
  "valid_to": null,
  "applies_to_transaction_types": ["sale", "service"],
  "source_reference": "CGST Act",
  "active": true
}
```

**Example response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "675a1b2c3d4e5f6789abcde3",
    "jurisdiction_id": "675a1b2c3d4e5f6789abcde2",
    "rule_type": "indirect_tax",
    "tax_category": "GST",
    "standard_rate": 0.18,
    "valid_from": "2026-01-01T00:00:00.000Z",
    "valid_to": null,
    "applies_to_transaction_types": ["sale", "service"],
    "active": true,
    "createdAt": "2026-04-27T12:15:00.000Z",
    "updatedAt": "2026-04-27T12:15:00.000Z"
  }
}
```

---

### `GET /api/jurisdictional-rules`

- **Auth:** none  

**Example response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "675a1b2c3d4e5f6789abcde3",
      "jurisdiction_id": "675a1b2c3d4e5f6789abcde2",
      "rule_type": "indirect_tax",
      "tax_category": "GST",
      "standard_rate": 0.18,
      "active": true
    }
  ]
}
```

---

### `GET /api/jurisdictional-rules/:id`

- **Auth:** none  

**Example response (200):** `{ "success": true, "data": { ... rule document ... } }`

---

### `PATCH /api/jurisdictional-rules/:id`

- **Auth:** JWT; role **admin** or **manager**

**Body (JSON):**

```json
{
  "standard_rate": 0.19,
  "active": true
}
```

**Example response (200):** `{ "success": true, "data": { ... updated rule ... } }`

---

### `GET /api/tax-records`

- **Auth:** none  

**Query (all optional):** `page`, `limit` (max 100, default 20), `sortBy` (default `taxYear`), `sortOrder` (`asc` | `desc`), `taxYear`, `entityName` (regex), `filingStatus` (`filed` | `pending` | `amended` | `unfiled`), `jurisdiction` (regex on text field), `jurisdictionId` (ObjectId)

**Example:** `GET /api/tax-records?page=1&limit=10&sortBy=taxYear&sortOrder=desc&filingStatus=pending`

**Example response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "675a1b2c3d4e5f6789abcde4",
      "taxYear": 2025,
      "entityName": "Acme US LLC",
      "filingStatus": "pending",
      "taxAmount": 150000,
      "jurisdiction_id": {
        "_id": "675a1b2c3d4e5f6789abcde2",
        "country_code": "IN",
        "name": "Karnataka",
        "region_code": "KA"
      },
      "jurisdiction": "IN — Karnataka"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### `POST /api/tax-records`

- **Auth:** none  

**Body (JSON):** `taxYear`, `entityName`, and `taxAmount` are required; other fields optional.

```json
{
  "taxYear": 2025,
  "entityName": "Acme US LLC",
  "entityId": "E-1001",
  "jurisdiction_id": "675a1b2c3d4e5f6789abcde2",
  "filingStatus": "pending",
  "totalIncome": 5000000,
  "taxableIncome": 4500000,
  "taxAmount": 150000,
  "taxPaid": 0,
  "filingDate": "2026-04-15T00:00:00.000Z",
  "notes": "Q1 estimate"
}
```

**Example response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "675a1b2c3d4e5f6789abcde4",
    "taxYear": 2025,
    "entityName": "Acme US LLC",
    "taxAmount": 150000,
    "filingStatus": "pending",
    "jurisdiction": "IN — Karnataka",
    "createdAt": "2026-04-27T12:20:00.000Z",
    "updatedAt": "2026-04-27T12:20:00.000Z"
  }
}
```

**Errors:** **400** if required fields missing or `jurisdiction_id` not found.

---

### `POST /api/tax-records/upload`

- **Auth:** none  

**Body (JSON):**

```json
{
  "records": [
    {
      "taxYear": 2024,
      "entityName": "Acme UK Ltd",
      "taxAmount": 50000
    },
    {
      "taxYear": 2024,
      "entityName": "Acme DE GmbH",
      "entityId": "DE-1",
      "jurisdiction_id": "675a1b2c3d4e5f6789abcde2",
      "taxAmount": 120000
    }
  ]
}
```

**Example response (201):**

```json
{
  "success": true,
  "message": "2 records uploaded",
  "count": 2,
  "data": [ { "...": "inserted documents" } ]
}
```

**Errors:** **400** if `records` is missing, empty, or any row invalid.

---

### `PATCH /api/tax-records/:id/filing-status`

- **Auth:** none  

**Body (JSON):**

```json
{
  "filingStatus": "filed"
}
```

Allowed: `filed` | `pending` | `amended` | `unfiled`

**Example response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "675a1b2c3d4e5f6789abcde4",
    "filingStatus": "filed",
    "updatedAt": "2026-04-27T12:25:00.000Z"
  }
}
```

**Errors:** **400** invalid status; **404** record not found.

---

### `POST /api/transactions`

- **Auth:** optional JWT; **org** required via JWT, `x-org-id`, or `org_id` in body

**Body (JSON):**

```json
{
  "org_id": "675a1b2c3d4e5f6789abcde0",
  "transaction_type": "sale",
  "amount": 10000,
  "currency": "USD",
  "originating_country": "us",
  "destination_country": "in",
  "is_intercompany": false,
  "transaction_date": "2026-04-27T00:00:00.000Z",
  "notes": "SaaS renewal",
  "source_system": "manual"
}
```

`transaction_type`: `sale` | `purchase` | `service` | `royalty` | `dividend` | `interest`

**Example response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "675a1b2c3d4e5f6789abcde5",
    "org_id": "675a1b2c3d4e5f6789abcde0",
    "transaction_type": "sale",
    "amount": 10000,
    "currency": "USD",
    "originating_country": "US",
    "destination_country": "IN",
    "is_cross_border": true,
    "cross_border": true,
    "is_intercompany": false,
    "classification_status": "pending",
    "transaction_date": "2026-04-27T00:00:00.000Z",
    "createdAt": "2026-04-27T12:30:00.000Z",
    "updatedAt": "2026-04-27T12:30:00.000Z"
  }
}
```

**Errors:** **400** validation / missing org; field errors from service.

---

### `GET /api/transactions`

- **Auth:** optional JWT; **org** required (same as above)

**Query (optional):** `page`, `limit`, `sortBy` (default `createdAt`), `sortOrder` (`asc` | `desc`)

**Example response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "675a1b2c3d4e5f6789abcde5",
      "org_id": "675a1b2c3d4e5f6789abcde0",
      "amount": 10000,
      "classification_status": "pending"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### `GET /api/transactions/:id`

- **Auth:** optional JWT; org must match transaction when `org_id` is present

**Example response (200):** `{ "success": true, "data": { ... transaction ... } }`  

**Errors:** **404** not found; **403** `Access denied` if org context is present and does not match the transaction’s `org_id`.

---

### `POST /api/transactions/:id/classify`

- **Auth:** optional JWT; org must match

**Body (JSON):**

```json
{
  "status": "classified"
}
```

`status` must be `classified` or `rejected`

**Example response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "675a1b2c3d4e5f6789abcde5",
    "classification_status": "classified",
    "classified_at": "2026-04-27T12:35:00.000Z"
  }
}
```

**Errors:** **400** invalid `status`; **404**; **403** wrong org.

---

### `POST /api/tax-exposures/calculate/:transactionId`

Same behavior as `POST /api/exposures/calculate/:transactionId` (alias).

- **Auth:** optional JWT; org must match the transaction
- **Body (optional):**

```json
{
  "asOf": "2026-04-27T00:00:00.000Z"
}
```

Runs orchestration: finds destination jurisdiction, active rules, inserts `TaxExposure` rows (replacing prior rows for that transaction by default).

**Example response (201):** first persisted exposure in `data`, full detail under `meta.orchestration`.

```json
{
  "success": true,
  "data": {
    "transaction_id": "675a1b2c3d4e5f6789abcde5",
    "org_id": "675a1b2c3d4e5f6789abcde0",
    "jurisdiction_id": "675a1b2c3d4e5f6789abcde2",
    "rule_id": "675a1b2c3d4e5f6789abcde3",
    "tax_type": "GST",
    "taxable_amount": 10000,
    "tax_rate": 0.18,
    "tax_due": 1800,
    "calculation_basis": "tax_due = taxable_amount * tax_rate; asOf=2026-04-27T00:00:00.000Z",
    "confidence_score": 0.9,
    "calculated_at": "2026-04-27T12:40:00.000Z"
  },
  "meta": {
    "orchestration": {
      "transaction_id": "675a1b2c3d4e5f6789abcde5",
      "summary": {
        "total_tax_due": 1800,
        "rule_count": 1,
        "as_of": "2026-04-27T00:00:00.000Z"
      },
      "jurisdiction": {
        "_id": "675a1b2c3d4e5f6789abcde2",
        "country_code": "IN"
      },
      "exposures": [ { "...": "all created exposure documents" } ]
    }
  }
}
```

If no exposures are created, `data` may be `null` while `meta` still contains arrays/summary. **Errors:** **404** transaction; **403** org; **422** no active jurisdiction or no matching rules for `asOf`.

---

### `GET /api/tax-exposures`

Same data as `GET /api/exposures` (alias).

- **Auth:** optional JWT; org from JWT / `x-org-id` / body

**Example response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "675a1b2c3d4e5f6789abcde6",
      "transaction_id": "675a1b2c3d4e5f6789abcde5",
      "org_id": "675a1b2c3d4e5f6789abcde0",
      "tax_type": "GST",
      "tax_due": 1800,
      "confidence_score": 0.9
    }
  ]
}
```

---

### `GET /api/tax-exposures/:id`

- **Auth:** optional JWT; exposure must belong to org

**Example response (200):** `{ "success": true, "data": { ... exposure ... } }`  

**Errors:** **404** / **500** with message if not found or wrong org (service-dependent).

---

### `GET /api/transactions/:transactionId/exposures`

Same as `GET /api/exposures/transaction/:transactionId` (alias).

- **Auth:** optional JWT; org scoping

**Example response (200):**

```json
{
  "success": true,
  "data": [
    {
      "transaction_id": "675a1b2c3d4e5f6789abcde5",
      "tax_due": 1800
    }
  ]
}
```

---

### `POST /api/tax-orchestrator/run/:transactionId`

- **Auth:** optional JWT; org must match transaction

**Body (optional):**

```json
{
  "asOf": "2026-01-15"
}
```

Invalid date string → **400** `{ "success": false, "message": "Invalid asOf date" }`

**Example response (201):** full orchestration payload in `data` (not split like calculate).

```json
{
  "success": true,
  "data": {
    "transaction_id": "675a1b2c3d4e5f6789abcde5",
    "jurisdiction": {
      "_id": "675a1b2c3d4e5f6789abcde2",
      "country_code": "IN"
    },
    "exposures": [ { "tax_due": 1800, "tax_type": "GST" } ],
    "summary": {
      "total_tax_due": 1800,
      "rule_count": 1,
      "as_of": "2026-01-15T00:00:00.000Z"
    }
  }
}
```

**Errors:** same family as calculate (**404** / **403** / **422**).

---

### `GET /api/dashboard/summary`

- **Auth:** optional JWT; if JWT / `x-org-id` / `org_id` is set, metrics filter to that org; if omitted, aggregates are global (see `dashboard.service`).

**Example response (200):**

```json
{
  "success": true,
  "data": {
    "total_transactions": 42,
    "total_exposure": 250000.5,
    "cross_border_count": 18,
    "classified_count": 30,
    "pending_count": 12,
    "jurisdiction_breakdown": [
      { "jurisdiction_id": "675a1b2c3d4e5f6789abcde2", "tax_due": 100000, "count": 5 }
    ],
    "jurisdiction_labeled": [
      {
        "jurisdiction_id": "675a1b2c3d4e5f6789abcde2",
        "country_code": "IN",
        "name": "Karnataka",
        "tax_due": 100000,
        "count": 5
      }
    ],
    "exposure_by_tax_type": [
      { "tax_type": "GST", "tax_due": 200000, "count": 8 }
    ],
    "avg_confidence_score": 0.85,
    "total_tax_records": 10,
    "filing_status_counts": {
      "filed": 4,
      "pending": 3,
      "amended": 1,
      "unfiled": 2,
      "unknown": 0
    },
    "total_tax_amount": 500000,
    "total_tax_paid": 400000,
    "total_outstanding_liability": 100000
  }
}
```

`TaxRecord` currently has no `org_id` in the schema, so `total_tax_records` and filing/tax rollups in code treat org filter as empty — counts may include all records. Exposure/transaction parts respect `org_id` when provided.

---

### `GET /api/insights/tax-rates`

- **Auth:** none  
- **Requires** `GEMINI_API_KEY` on the server (else **503**)

**Query:** `countries` — required, comma- or semicolon-separated ISO codes, e.g. `US,DE,IN`  
**Query:** `asOf` — optional date string, e.g. `2026-01-01`

**Example:** `GET /api/insights/tax-rates?countries=US,IN&asOf=2026-01-01`

**Example response (200):**

```json
{
  "success": true,
  "data": {
    "model": "gemini-2.0-flash",
    "retrievedAt": "2026-04-27T12:45:00.000Z",
    "disclaimer": "Reference only — verify with a qualified tax advisor and official sources.",
    "items": [
      {
        "countryCode": "US",
        "taxType": "corporate",
        "label": "US federal corporate (headline rate)",
        "ratePercent": 21,
        "notes": "Illustrative",
        "sourceHint": "OECD / IRS"
      }
    ]
  }
}
```

**Errors:** **400** missing `countries`; **503** no API key; **502** Gemini errors.

---

### `GET /api/insights/suggested-rule-rate`

- **Auth:** none  
- **Requires** `GEMINI_API_KEY` (**503** if missing)

**Query:** `country` — required, 2-letter ISO, e.g. `IN`  
**Query:** `taxCategory` — required, e.g. `GST`  
**Query:** `ruleType` — optional (defaults to `general` server-side)

**Example:** `GET /api/insights/suggested-rule-rate?country=IN&taxCategory=GST&ruleType=indirect_tax`

**Example response (200):**

```json
{
  "success": true,
  "data": {
    "model": "gemini-2.0-flash",
    "standardRate": 0.18,
    "label": "Standard GST in India (illustrative)",
    "notes": "Verify with official notifications."
  }
}
```

`standardRate` is a decimal for use in `JurisdictionRule.standard_rate` (e.g. `0.18` = 18%).

**Errors:** **400** missing params or invalid `country`; **502**/ **503** as above.

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
