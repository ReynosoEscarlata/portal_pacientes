# Architecture

**Analysis Date:** 2026-07-15

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        React Frontend (SPA)                                  │
│                   `client/src/` — TypeScript + Vite                          │
├──────────────────────────┬───────────────────────────┬──────────────────────┤
│  Pages & Navigation      │   Wizard UI Layer         │  Context State       │
│  `pages/`                │   `components/wizard/`    │  `context/`          │
│  - Inicio, PreRegistro   │   - Wizard, PhaseRenderer │  - WizardContext     │
│  - ConsultaArco          │   - AvisoPrivacidad,      │  - State mgmt        │
│                          │     Confirmacion          │  - Data persistence  │
└──────────────────────────┴───────────────────────────┴──────────────────────┘
         │                              │                         │
         └──────────────┬───────────────┴─────────────┬───────────┘
                        │ FETCH /api/* (JSON)        │
                        ▼                            ▼
         ┌────────────────────────────────────────────────────────┐
         │            Express API Layer                            │
         │          `server/src/app.js`                            │
         │  Middleware: Security (Helmet, CORS), Rate Limit       │
         └────────────────────────────────────────────────────────┘
                  │         │         │         │
         ┌────────▼──┐  ┌──▼────┐  ┌─▼──────┐  └─┐
         │  Health   │  │Phases │  │Registry│    │ ARCO
         │   Route   │  │Routes │  │Routes  │    │Rights
         │ GET /api/ │  │GET /  │  │POST /  │    │POST /
         │salud      │  │api/   │  │api/    │    │api/
         │           │  │phases │  │registros│    │arco
         └────────────┘  └──────┘  └────────┘  └──┘
                │
         ┌──────▼────────────────────────────────┐
         │   Business Logic & Validation         │
         ├──────────────────────────────────────┤
         │ • Zod Schemas  (validation/)          │
         │ • Service Logic (routes/)             │
         │ • Encryption   (crypto/)              │
         │ • Utilities    (utils/)               │
         └──────────────────────────────────────┘
                │
         ┌──────▼────────────────────────────────┐
         │   Repository Pattern (Data Access)    │
         ├──────────────────────────────────────┤
         │ Interface: repositories/index.js      │
         │ • Mock impl    (memoryRepo.js)        │
         │ • Postgres impl (postgresRepo.js)     │
         │ (Selected by DATA_SOURCE env var)     │
         └──────────────────────────────────────┘
                │
         ┌──────▼────────────────────────────────┐
         │   Data Storage                        │
         │ • In-memory Map (dev/testing)         │
         │ • PostgreSQL (production)             │
         └──────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Frontend Router** | Page navigation: Inicio, PreRegistro, ConsultaArco | `client/src/App.tsx` |
| **WizardProvider** | Global state for multi-phase form: draft management, phase progression, localStorage persistence | `client/src/context/WizardContext.tsx` |
| **Wizard Component** | Dynamic phase rendering based on config, progress tracking, navigation between phases | `client/src/components/wizard/Wizard.tsx` |
| **PhaseRenderer** | Renders form-type phases using Field components, handles per-phase validation messages | `client/src/components/wizard/PhaseRenderer.tsx` |
| **Phase Custom Types** | Privacy notice (AvisoPrivacidad) and confirmation (Confirmacion) — non-form phase types | `client/src/components/wizard/phases/` |
| **API Client** | Typed fetch wrapper, error handling (ApiError with code/status/details) | `client/src/api/client.ts` |
| **Express App** | Middleware setup (security, rate limit, error handler), route registration | `server/src/app.js` |
| **Phase Routes** | GET /api/phases — serves config, phase definitions, and catalogs | `server/src/routes/phases.js` |
| **Registry Routes** | Draft CRUD, phase validation/save, final submission with folio generation | `server/src/routes/registros.js` |
| **ARCO Routes** | Right of Access and Right to be Forgotten — consult and delete with rate limiting | `server/src/routes/arco.js` |
| **Validation Schemas** | Zod `.strict()` schemas per phase; applied both frontend (UI) and backend (API) | `server/src/validation/schemas.js` |
| **Encryption** | AES-256-GCM encryption/decryption for sensitive phases (`datos_clinicos`) | `server/src/crypto/cipher.js` |
| **Repository Factory** | Singleton pattern; chooses Mock or Postgres repo based on DATA_SOURCE | `server/src/repositories/index.js` |
| **Mock Repository** | In-memory Map storage for drafts and records; used in dev/demo with SEED_MOCK | `server/src/repositories/memoryRepo.js` |
| **Postgres Repository** | `pg` client wrapper with connection pooling; production data layer | `server/src/repositories/postgresRepo.js` |
| **Rate Limiter** | Express-rate-limit middleware on write endpoints and ARCO queries | `server/src/middleware/rateLimit.js` |
| **Error Handler** | Centralized error catching (ZodError, AppError, generic); never leaks stack or PII to client | `server/src/middleware/errorHandler.js` |
| **Security Middleware** | Helmet (CSP, X-Frame-Options, etc.), CORS (origin-restricted), body size limit | `server/src/middleware/security.js` |

## Pattern Overview

**Overall:** Repository + Service-oriented multi-tier architecture with dynamic form configuration.

**Key Characteristics:**
- **Configuration-driven:** Phase structure, fields, and validation rules in `server/src/config/phases.config.json`; frontend reads via API and renders dynamically
- **Repository Pattern:** Data access abstraction allows switching between memory (dev) and PostgreSQL (prod) without touching business logic
- **Dual-layer validation:** Schemas defined once in backend; frontend reads via API and applies same rules for UX; backend re-validates all input
- **Stateless API:** Each request carries full context (draft ID, phase ID, data); no session state on server
- **Local-first draft storage:** Browser localStorage persists draft ID for resumability; server stores the actual draft
- **Encryption at rest:** Clinical data (marked `sensible: true`) encrypted with AES-256-GCM before storage
- **Privacy by design:** Minimal data collection; ARCO rights (access, deletion) baked into API; versioned consent tracking with IP/timestamp

## Layers

**Presentation Layer (Client):**
- Purpose: React SPA rendering multi-step form; single-page navigation between Inicio → PreRegistro → ConsultaArco
- Location: `client/src/`
- Contains: Pages, components (wizard, fields, UI), context for state, API client
- Depends on: `/api/*` endpoints (read config, create/update drafts, submit, ARCO queries)
- Used by: Browser (Vite dev server on :5173, built SPA in production)

**API Layer (Server):**
- Purpose: Express routes handling all business logic: phase validation, draft persistence, encryption, ARCO rights, rate limiting
- Location: `server/src/app.js` and `server/src/routes/`
- Contains: Route handlers, middleware (security, rate limit, error), validation schemas
- Depends on: Repository interface (abstracted data access)
- Used by: Frontend fetch calls

**Data Access Layer (Repository):**
- Purpose: Provide unified interface for draft and record storage; swap implementations (mock ↔ Postgres) via configuration
- Location: `server/src/repositories/`
- Contains: Factory function, mock in-memory implementation, Postgres implementation
- Depends on: `pg` client (Postgres) or native JS Map (mock)
- Used by: All route handlers via `obtenerRepositorio()` singleton

**Persistent Storage:**
- Purpose: Store application state (drafts, submitted records, consents, encrypted clinical data)
- Location: In-process memory (mock mode) or PostgreSQL database (production)
- Contains: Drafts (in-progress forms), Records (submitted pre-registrations with folio), Registros (final records)

## Data Flow

### Primary Request Path: Submit a Pre-Registration

1. **Frontend initiation** (`client/src/pages/PreRegistro.tsx`): `useWizard().iniciar()` creates or resumes draft
2. **Create draft** (`POST /api/registros/draft`): Backend calls `repo.crearDraft()`, returns draft ID
3. **Save to localStorage** (`client/src/context/WizardContext.tsx`): Draft ID persisted for resumability
4. **User fills phase** (`client/src/components/wizard/PhaseRenderer.tsx`): Component validates locally using schema rules
5. **Save phase** (`PUT /api/registros/draft/:id/fase/:faseId`):
   - Backend fetches draft: `repo.obtenerDraft(id)`
   - Validates input against `esquemasPorFase[faseId]` (Zod schema)
   - If sensible phase: encrypts data with `cifrar()`
   - Updates draft: `repo.actualizarDraft(id, { datos, faseActual })`
   - Returns updated `faseActual` index
6. **Repeat for all phases** (personal → address → clinical → consent → review)
7. **Final submission** (`POST /api/registros/draft/:id/enviar`):
   - Validates all required phases present
   - Checks `consentimiento.aceptado === true`
   - Generates unique folio: `generarFolio()`
   - Creates record: `repo.crearRegistro({ folio, datosPersonales, domicilio, datosClinicos, consentimiento, creadoEn })`
   - Deletes draft: `repo.eliminarDraft(id)`
   - Returns folio
8. **Display confirmation** (`client/src/components/wizard/Wizard.tsx`): Folio shown; localStorage cleared

### Secondary Flow: ARCO Right of Access

1. User enters folio + birth date in `client/src/pages/ConsultaArco.tsx`
2. Calls `POST /api/arco/consulta`
3. Backend queries `repo.obtenerRegistroPorFolio(folio)`
4. If found AND birth date matches: decrypts clinical data, masks PII (CURP, phone, email), returns partial record
5. If not found OR date mismatch: returns 404 with generic message (prevents folio enumeration)
6. Rate limit enforced (e.g., 5 req/15min per IP)

### Secondary Flow: ARCO Right to be Forgotten

1. User submits folio + birth date in `client/src/pages/ConsultaArco.tsx` to delete section
2. Calls `POST /api/arco/eliminar`
3. Backend validates folio + birth date (same logic as access)
4. Calls `repo.eliminarRegistroPorFolio(folio)` if valid
5. Returns success or 404

**State Management:**
- **Client state:** WizardContext holds config, draft data, current phase index, max reachable phase, folio (once submitted)
- **Server state:** Drafts in repository (Map or PostgreSQL); Records (immutable once created)
- **Browser storage:** Draft ID in localStorage for resumability across sessions
- **Database:** PostgreSQL stores all drafts and records; in-memory mode used for dev/testing

## Key Abstractions

**Draft (Work-in-Progress Form):**
- Purpose: Represents an incomplete pre-registration; retomable if closed mid-flow
- Examples: `server/src/repositories/memoryRepo.js` lines 15–38 (crearDraft, obtenerDraft, actualizarDraft)
- Pattern: Lazy load on `/registros/draft/:id`, update incrementally per phase, persist to localStorage for resumability
- Structure: `{ id (UUID), faseActual (index), datos (Map<faseId, faseData>), creadoEn, actualizadoEn }`

**Record (Submitted Pre-Registration):**
- Purpose: Immutable snapshot of a completed pre-registration with assigned folio
- Examples: `server/src/routes/registros.js` lines 117–124 (crearRegistro)
- Pattern: Created only after final validation; cannot be modified (only deleted via ARCO)
- Structure: `{ folio (unique ID), datosPersonales, domicilio, datosClinicos (encrypted), consentimiento (versioned), creadoEn }`

**Fase (Form Phase/Step):**
- Purpose: Represents one step in the multi-step wizard
- Examples: `server/src/config/phases.config.json` (5 phases defined)
- Pattern: Each phase has a Zod schema (`server/src/validation/schemas.js`) and frontend renderer type (form, aviso_privacidad, confirmacion)
- Structure: `{ id, titulo, descripcion, icono, tipo, sensible, campos[] }`

**Validation Schema:**
- Purpose: Single source of truth for data rules; enforced frontend (UX) and backend (security)
- Examples: `server/src/validation/schemas.js` lines 33–55 (esquemaDatosPersonales)
- Pattern: Zod schema with `.strict()` to reject unknown fields; regex patterns for CURP, phone, postal code
- Reuse: Frontend reads schema rules via `/api/phases` response and applies UI constraints

## Entry Points

**Frontend:**
- Location: `client/src/main.tsx` (Vite entry point)
- Triggers: `npm run dev:client` or `npm run build`
- Responsibilities: Mount React app, set up WizardProvider context, render App component

**Backend:**
- Location: `server/src/index.js`
- Triggers: `npm run dev:server` or `npm start`
- Responsibilities: Load env config, instantiate repository (mock or Postgres), optionally load legacy route, mount Express app, listen on PORT

**API Entry Points:**
- `GET /api/salud`: Health check (no-op, returns `{ ok: true, fuenteDatos }`)
- `GET /api/phases`: Dynamic config (phases, fields, catalogs, privacy notice version)
- `POST /api/registros/draft`: Create new draft
- `GET /api/registros/draft/:id`: Fetch draft (decrypts sensible phases)
- `PUT /api/registros/draft/:id/fase/:faseId`: Save single phase
- `POST /api/registros/draft/:id/enviar`: Final submission (validates all, generates folio, creates record)
- `POST /api/arco/consulta`: ARCO Access request
- `POST /api/arco/eliminar`: ARCO Deletion request
- `POST /api/legacy/registro`: Legacy brownfield endpoint (optional, if `LEGACY_ENABLED=true`)

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop; async/await for I/O-bound operations (DB, FS, crypto); no worker threads
- **Global state:** Repository singleton in `server/src/repositories/index.js` (initialized once at startup); no mutable global config after app launch (phases config read from file at boot)
- **Circular imports:** None detected; acyclic dependency graph (routes → config/validation/crypto/utils, never reverse)
- **Draft resumability:** Limited to same browser (localStorage); no server-side session tracking; draftId is the only session identifier
- **Encryption key rotation:** Not supported (keys come from `ENCRYPTION_KEY` env var, fixed per deployment); decrypting old data requires same key
- **Database schema:** Must exist before server start (no auto-migration); schema provided in `server/db/schema.sql`

## Anti-Patterns

### Hard-coded Phase Logic in Routes

**What happens:** Phases are read dynamically from `server/src/config/phases.config.json`, but validation schemas are hard-coded in `server/src/validation/schemas.js` as a Map (`esquemasPorFase`).

**Why it's wrong:** Adding a new phase requires hand-editing two places (config JSON + schemas.js), increasing risk of mismatch and forgotten validation.

**Do this instead:** Define phase metadata and schemas in the JSON config, then generate Zod schemas at runtime (or use a schema registry pattern). Example reference: `server/src/config/fases.js` already loads the JSON; extend it to also load or generate schemas.

### Missing Validation on Non-Sensible Data

**What happens:** Personal and address data (`sensible: false`) are stored as plain JSON without any encryption or extra scrutiny.

**Why it's wrong:** In production, even "non-sensitive" PII (name, address) should be protected; plain storage is a data protection liability.

**Do this instead:** Consider encrypting all data at rest (not just `datos_clinicos`), or at minimum add row-level encryption in PostgreSQL. See `server/src/crypto/cipher.js` for the encryption pattern.

### No Input Sanitization on Free-Text Fields

**What happens:** Motivo de consulta, alergias, antecedentes (text fields) are validated only for length and type, not for injection attacks.

**Why it's wrong:** Even though Zod validates, and data is stored in a structured format (not SQL strings due to parameterized queries), free text could contain script-like content if later rendered unsafely.

**Do this instead:** Apply additional validation (e.g., reject control characters, HTML tags) or ensure all output is escaped when displayed. See `server/src/utils/errors.js` for error handling pattern; extend to include sanitization utilities.

## Error Handling

**Strategy:** Centralized error handler middleware (`server/src/middleware/errorHandler.js`) catches all errors and returns structured JSON responses. Never leaks stack traces to client; always logs error ID server-side for tracing.

**Patterns:**
- **Validation errors (Zod):** 422 Unprocessable Entity with field-level error details
- **Application errors (AppError):** Custom HTTP status + error code (e.g., 404 NO_ENCONTRADO, 409 AVISO_DESACTUALIZADO)
- **Unexpected errors:** 500 Internal Server Error with random error ID for tracing; message never exposes implementation details
- **Rate limit exceeded:** 429 Too Many Requests (via express-rate-limit)
- **Client-side error handling:** `client/src/api/client.ts` wraps fetch in ApiError class; routes and context handlers use try/catch to set `errorGeneral` state for UI display

## Cross-Cutting Concerns

**Logging:** Currently console.log for startup messages, seeding, and error tracking (per error ID). No structured logging library. Enhancement: add winston or pino for production-grade logging.

**Validation:** Dual-layer (frontend UX + backend security). Zod schemas in `server/src/validation/schemas.js` are the source of truth; frontend fetches via `/api/phases` and replicates constraints (HTML5 type/pattern/maxLength, no actual re-validation).

**Authentication:** None. Portal is public; identity verified only at ARCO query time (folio + birth date). No JWT, session tokens, or user accounts.

**Authorization:** None. All endpoints are open. Rate limiting is the only throttle (registered in `server/src/middleware/rateLimit.js`).

**Security Headers:** Helmet configured in `server/src/middleware/security.js` (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, etc.).

**CORS:** Restricted to `CORS_ORIGIN` env var; defaults to localhost in dev, must be explicitly set in production.

---

*Architecture analysis: 2026-07-15*
