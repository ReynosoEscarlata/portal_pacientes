<!-- generated-by: gsd-doc-writer -->
# Architecture

## System Overview

ClinicConnect is a patient pre-registration portal built as a two-tier web application: a React (Vite) single-page frontend and an Express (Node.js, ESM) REST API backend. Patients complete a multi-phase wizard (personal data, address, clinical data, privacy consent, confirmation) to obtain a folio before a clinic visit, and can later exercise ARCO rights (access or deletion) using their folio and birth date. Clinical data is treated as sensitive: it is encrypted at rest (AES-256-GCM) and masked in API responses where appropriate. Phase structure, fields, and validation rules are configuration-driven — the backend serves a phase definition that the frontend renders dynamically. Data can be persisted in PostgreSQL or an in-memory mock store, selected via a repository abstraction.

## Component Diagram

```text
┌─────────────────────────────┐        HTTP (fetch, JSON)        ┌──────────────────────────────┐
│  React SPA (client/src)     │  ───────────────────────────▶    │  Express API (server/src)    │
│  Vite dev server :5173      │                                   │  Node.js listener :4000      │
│                              │  ◀───────────────────────────    │                               │
│  App.tsx (router)           │        JSON responses             │  app.js (middleware + routes)│
│   ├─ Inicio                 │                                   │   ├─ security.js (helmet/CORS)│
│   ├─ PreRegistro → Wizard   │                                   │   ├─ rateLimit.js            │
│   └─ ConsultaArco           │                                   │   ├─ routes/phases.js        │
│  WizardProvider (context)   │                                   │   ├─ routes/registros.js     │
│  api/client.ts (fetch)      │                                   │   ├─ routes/arco.js          │
└──────────────────────────────┘                                  │   └─ errorHandler.js          │
                                                                    └───────────────┬───────────────┘
                                                                                    │
                                    ┌───────────────────────────────────────────────┼───────────────────────────┐
                                    ▼                                               ▼                           ▼
                       validation/schemas.js (Zod)                     crypto/cipher.js (AES-256-GCM)   repositories/index.js
                       config/phases.config.json (phase defs)          utils/mask.js, utils/folio.js     (factory: mock ↔ postgres)
                                                                                                                    │
                                                                                            ┌───────────────────────┴────────────────────┐
                                                                                            ▼                                              ▼
                                                                             memoryRepo.js (in-process Map)                 postgresRepo.js (pg Pool → PostgreSQL)
```

## Data Flow

### Primary flow: completing pre-registration

1. On first load, `WizardProvider` (`client/src/context/WizardContext.tsx`) calls `api.obtenerConfig()`, which hits `GET /api/phases` (`server/src/routes/phases.js`). This returns the phase list, field definitions, and catalogs (sexo, entidades) read from `server/src/config/phases.config.json`.
2. When the patient starts the wizard, the client calls `POST /api/registros/draft` (`server/src/routes/registros.js`), creating a draft via the active repository (`obtenerRepositorio().crearDraft()`). The returned draft `id` is stored in `localStorage` (key `cc_draft_id`) so the flow is resumable in the same browser.
3. For each phase (`datos_personales`, `domicilio`, `datos_clinicos`, `consentimiento`), the client submits `PUT /api/registros/draft/:id/fase/:faseId`. The server:
   - Looks up the phase definition and its Zod schema (`esquemasPorFase[faseId]` in `server/src/validation/schemas.js`) and validates the submitted `datos`.
   - For `consentimiento`, verifies the accepted `versionAviso` matches `configFases.versionAviso` (else `409 AVISO_DESACTUALIZADO`) and stamps `timestamp`/`ip` for traceable consent.
   - Encrypts the phase payload with `cifrar()` (`server/src/crypto/cipher.js`) if `fase.sensible` is `true` (currently only `datos_clinicos`).
   - Persists the updated draft via `obtenerRepositorio().actualizarDraft()`.
4. On the confirmation phase, the client calls `POST /api/registros/draft/:id/enviar`. The server verifies all form phases and consent are present, generates a unique folio (`generarFolio()` in `server/src/utils/folio.js`, retried against `repo.existeFolio()`), creates an immutable record via `repo.crearRegistro()`, deletes the draft, and returns `{ folio }`. The client clears `cc_draft_id` from `localStorage`.

### Secondary flow: ARCO right of access

1. The patient submits folio + birth date on the ARCO page (`client/src/pages/ConsultaArco.tsx`) via `api.arcoConsulta()` → `POST /api/arco/consulta` (`server/src/routes/arco.js`).
2. The server validates input with `esquemaArco` (Zod), fetches the record by folio, and confirms `datosPersonales.fechaNacimiento` matches — returning an identical "not found" error for both a missing folio and a mismatched date to prevent enumeration.
3. On success, the response masks CURP, phone, and email (`server/src/utils/mask.js`) and decrypts `datosClinicos` if it is still in encrypted form (`estaCifrado()` / `descifrar()`).

### Secondary flow: ARCO right to be forgotten

1. Same authentication as above via `POST /api/arco/eliminar`.
2. On success, the server calls `repo.eliminarRegistroPorFolio()` to permanently delete the record and its encrypted clinical data.

## Key Abstractions

| Abstraction | Location | Purpose |
|---|---|---|
| `AppError` | `server/src/utils/errors.js` | Custom error type carrying an HTTP `status` and machine-readable `codigo`, thrown by route handlers and caught by the central error middleware. |
| Repository interface (`crearDraft`, `obtenerDraft`, `actualizarDraft`, `eliminarDraft`, `crearRegistro`, `obtenerRegistroPorFolio`, `eliminarRegistroPorFolio`, `existeFolio`, `cerrar`) | `server/src/repositories/memoryRepo.js`, `server/src/repositories/postgresRepo.js` | Identical async interface implemented by both the in-memory mock and the PostgreSQL-backed store, selected once via `obtenerRepositorio()` (`server/src/repositories/index.js`) based on `DATA_SOURCE`. |
| `configFases` / phase definition | `server/src/config/phases.config.json`, loaded by `server/src/config/fases.js` | Single source of truth for the wizard: phase id, title, type (`form` / `aviso_privacidad` / `confirmacion`), field list, and `sensible` flag. Drives both backend validation selection and frontend rendering. |
| `esquemasPorFase` (Zod schemas) | `server/src/validation/schemas.js` | Per-phase `.strict()` validation schemas enforced on every write; the same field constraints are surfaced to the client via `/api/phases` for UX-level validation. |
| `cifrar` / `descifrar` / `estaCifrado` | `server/src/crypto/cipher.js` | AES-256-GCM encryption helpers used for any phase marked `sensible: true`; encrypted values are tagged with a `v1.` prefix so `estaCifrado()` can detect them on read. |
| `ApiError` | `client/src/api/client.ts` | Frontend wrapper around non-OK fetch responses, carrying `status`, `codigo`, and field-level `detalles` for UI error display. |
| `WizardContext` / `useWizard` | `client/src/context/WizardContext.tsx` | Central React context holding phase config, draft data, current/max reachable phase, folio, and loading/error state; exposes `iniciar`, `guardarFase`, `irAFase`, `enviar`, `reiniciar`. |

## Directory Structure Rationale

```text
client/src/
  api/          # Typed fetch wrapper (client.ts) and ApiError
  components/   # Presentational + wizard components (TopBar, Avatar, ProgressBar, PhaseBadge)
    wizard/     # Wizard shell, PhaseRenderer (form fields), phases/ (AvisoPrivacidad, Confirmacion)
    fields/     # Generic Field component driven by phase config
  context/      # WizardContext: global form/draft state
  pages/        # Top-level routed pages: Inicio, PreRegistro, ConsultaArco
  styles/       # CSS
  test-utils/   # Vitest helpers
  types.ts      # Shared frontend types (ConfigPortal, DatosFases, ValoresFase, EstadoFase)

server/src/
  config/       # env.js (env vars), fases.js + phases.config.json (wizard definition)
  crypto/       # cipher.js: AES-256-GCM helpers for sensitive phases
  middleware/   # security.js (Helmet/CORS), rateLimit.js, errorHandler.js
  repositories/ # index.js (factory/singleton), memoryRepo.js, postgresRepo.js
  routes/       # phases.js, registros.js, arco.js — one file per resource
  seed/         # sembrar.js: seeds mock repository with fictitious patients (SEED_MOCK=true)
  utils/        # errors.js (AppError), folio.js (folio generation), mask.js (CURP/phone/email masking)
  validation/   # schemas.js (Zod per-phase schemas), catalogos.js (sexo, entidades)
  app.js        # Express app factory (crearApp)
  index.js      # Process entry point: loads env, repository, optional legacy route, starts listener

server/db/      # schema.sql (PostgreSQL schema, pgcrypto extension), seed.js
server/legacy/  # registro_viejo.js: optional legacy endpoint (LEGACY_ENABLED=true)
```

This separation keeps route handlers thin (validation, encryption, and persistence are delegated to `validation/`, `crypto/`, and `repositories/`), and keeps the wizard's shape entirely data-driven: adding or reordering a phase is a change to `phases.config.json` plus a matching Zod schema, not a change to route or component code.
