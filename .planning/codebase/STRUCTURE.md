# Codebase Structure

**Analysis Date:** 2026-07-15

## Directory Layout

```
portal_pacientes/                       # Repository root (monorepo)
├── client/                             # React SPA frontend
│   ├── src/
│   │   ├── main.tsx                   # Vite entry point: mounts React app
│   │   ├── App.tsx                    # Root component; page router (Inicio → PreRegistro → ConsultaArco)
│   │   ├── api/
│   │   │   └── client.ts              # Typed fetch wrapper; ApiError class; api methods (obtenerConfig, etc.)
│   │   ├── components/
│   │   │   ├── TopBar.tsx             # Navigation header
│   │   │   ├── Avatar.tsx             # User avatar display (initials-based)
│   │   │   ├── PhaseBadge.tsx         # Phase indicator chip (estado: pendiente/activa/completada)
│   │   │   ├── ProgressBar.tsx        # Visual progress indicator
│   │   │   ├── fields/
│   │   │   │   └── Field.tsx          # Form input wrapper (text, date, select, email, tel, textarea)
│   │   │   └── wizard/
│   │   │       ├── Wizard.tsx         # Main wizard container; renders current phase
│   │   │       ├── PhaseRenderer.tsx  # Renders form-type phases using Field components
│   │   │       └── phases/
│   │   │           ├── AvisoPrivacidad.tsx  # Privacy notice display + consent checkbox
│   │   │           └── Confirmacion.tsx     # Summary review before final submission
│   │   ├── context/
│   │   │   └── WizardContext.tsx      # Global state: config, datos, faseActual, maxFase, draftId, folio
│   │   ├── pages/
│   │   │   ├── Inicio.tsx             # Landing page ("start pre-registration" button)
│   │   │   ├── PreRegistro.tsx        # Main form page (uses Wizard component)
│   │   │   └── ConsultaArco.tsx       # ARCO rights page (access + deletion)
│   │   ├── styles/
│   │   │   └── styles.css             # Global theme (Facebook-style colorimetry)
│   │   └── types.ts                   # TypeScript interfaces (FaseConfig, CampoConfig, ConfigPortal, etc.)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html                     # HTML template
│
├── server/                             # Express backend (Node.js)
│   ├── src/
│   │   ├── index.js                   # Entry point: load env, instantiate repo, mount app
│   │   ├── app.js                     # Express app factory; middleware chain; route registration
│   │   ├── config/
│   │   │   ├── env.js                 # Load .env vars with defaults (PORT, DATA_SOURCE, etc.)
│   │   │   ├── fases.js               # Load phases.config.json; export helpers (obtenerFase, indiceDeFase)
│   │   │   └── phases.config.json     # Dynamic phase definitions (id, titulo, campos, sensible, tipo)
│   │   ├── crypto/
│   │   │   └── cipher.js              # AES-256-GCM encrypt/decrypt for sensible phases
│   │   ├── middleware/
│   │   │   ├── security.js            # Helmet + CORS setup
│   │   │   ├── errorHandler.js        # Centralized error catching; structured JSON responses
│   │   │   └── rateLimit.js           # Rate limit on writes + ARCO endpoints
│   │   ├── repositories/
│   │   │   ├── index.js               # Factory pattern; choose mock or postgres per DATA_SOURCE
│   │   │   ├── memoryRepo.js          # In-memory Map storage (dev/demo)
│   │   │   └── postgresRepo.js        # PostgreSQL client via pg package
│   │   ├── routes/
│   │   │   ├── phases.js              # GET /api/phases (config, catalogs, privacy notice version)
│   │   │   ├── registros.js           # POST/GET/PUT /api/registros/draft* (create, load, update, submit)
│   │   │   └── arco.js                # POST /api/arco/{consulta,eliminar} (ARCO rights)
│   │   ├── seed/
│   │   │   └── sembrar.js             # Insert 3 demo patients (if SEED_MOCK=true)
│   │   ├── utils/
│   │   │   ├── errors.js              # AppError class; UUID_REGEX
│   │   │   ├── folio.js               # Generate unique pre-registration folio (CC-YYYY-XXXXXX format)
│   │   │   └── mask.js                # Mask PII (CURP, phone, email) for ARCO responses
│   │   └── validation/
│   │       ├── schemas.js             # Zod schemas per phase (esquemaPorFase map)
│   │       └── catalogos.js           # RENAPO catalogs (sexo, entidades federativas)
│   ├── db/
│   │   ├── schema.sql                 # PostgreSQL DDL (create tables: drafts, registros)
│   │   └── seed.js                    # CLI script to seed database
│   ├── legacy/
│   │   └── registro_viejo.js          # Brownfield module (bad practices for training)
│   ├── tests/
│   │   ├── arco.test.js               # Tests for ARCO endpoints
│   │   ├── codigoPostal.test.js       # Postal code validation tests
│   │   ├── consentimiento.test.js     # Consent flow tests
│   │   ├── curp.test.js               # CURP validation tests
│   │   └── memoryRepo.test.js         # Repository interface tests
│   ├── package.json
│   └── .env.example                   # Environment variable template
│
├── package.json                        # Monorepo root; script shortcuts (install:all, dev, test, build)
├── README.md                           # Project overview and setup instructions
├── BACKLOG.md                          # 12 prioritized user stories with acceptance criteria
├── CODE_REVIEW.md                      # Code review checklist template
├── LEGACY_MAP.md                       # Blank template for legacy module analysis
├── SOLUCIONES_BUGS.md                  # Spoiler file: 4 intentional bugs for training
├── .gitignore                          # Git exclusions (node_modules, .env, .DS_Store)
└── .planning/                          # GSD planning directory (generated)
    └── codebase/
        ├── ARCHITECTURE.md             # This file: layers, data flow, patterns, constraints
        └── STRUCTURE.md                # Directory layout, naming conventions, placement guide
```

## Directory Purposes

**`client/`**
- Purpose: React single-page application built with Vite and TypeScript
- Contains: Components (UI widgets, wizard pages), context (global state), pages (routing targets), utilities (API client, type definitions), styles
- Key files: `src/App.tsx` (root), `src/context/WizardContext.tsx` (state), `src/api/client.ts` (backend communication)

**`client/src/components/`**
- Purpose: Reusable React components and wizard pages
- Contains: Form field renderers, phase templates, UI chrome (header, avatar, progress bar, phase badges)
- Layout: `components/fields/` for form inputs, `components/wizard/` for multi-step logic, root level for layout components

**`client/src/pages/`**
- Purpose: Top-level page components mapped by App.tsx router
- Contains: Inicio (landing), PreRegistro (main form), ConsultaArco (ARCO rights)
- Pattern: Each page is a view; state management delegated to WizardContext

**`server/src/`**
- Purpose: Express backend API and business logic
- Contains: HTTP route handlers, data validation, data access (repository), middleware, encryption, utilities
- Key files: `app.js` (HTTP setup), `index.js` (startup), `repositories/index.js` (data access factory)

**`server/src/config/`**
- Purpose: Configuration management and dynamic phase definitions
- Contains: Environment variables loader (`env.js`), phase config parser (`fases.js`), phase definitions (JSON)
- Pattern: `fases.js` exports config as parsed JSON; routes read via `configFases` global; no runtime schema generation

**`server/src/middleware/`**
- Purpose: Express middleware for cross-cutting concerns
- Contains: HTTP security (Helmet, CORS), rate limiting, centralized error handling
- Chain order: security → json → rate limit → routes → 404 handler → error handler

**`server/src/repositories/`**
- Purpose: Data access abstraction with pluggable implementations
- Contains: Factory function, memory-based storage, PostgreSQL storage
- Pattern: Same interface (`crearDraft`, `obtenerDraft`, `actualizarDraft`, `crearRegistro`, etc.); swappable via `DATA_SOURCE` env var

**`server/src/routes/`**
- Purpose: HTTP endpoint implementations
- Contains: GET /api/phases, POST/GET/PUT /api/registros/draft, POST /api/arco/{consulta,eliminar}
- Pattern: Each file is a Router; handlers validate input, call repo, return JSON

**`server/src/validation/`**
- Purpose: Data shape and catalog definitions
- Contains: Zod schema objects (per phase), RENAPO catalogs (sexo, entidades federativas)
- Reuse: Backend applies schemas; frontend fetches via API and mirrors constraints for UX

**`server/src/crypto/`**
- Purpose: Encryption/decryption for sensible data
- Contains: AES-256-GCM cipher with IV/auth tag
- Use: Called in routes when saving/loading phases marked `sensible: true`

**`server/src/seed/`**
- Purpose: Database seeding for demos
- Contains: SQL for demo patient records
- Trigger: Runs at startup if `SEED_MOCK=true` and `DATA_SOURCE=mock`

**`server/src/utils/`**
- Purpose: Shared utility functions
- Contains: Custom error class (AppError), folio generator, PII masking, regex constants
- Pattern: Each util is a standalone module; no interdependencies

**`server/db/`**
- Purpose: Database schema and seeding scripts
- Contains: PostgreSQL DDL (`schema.sql`), Node.js seeding script (`seed.js`)
- Maintenance: Run `psql -f schema.sql` once after `createdb`; run `npm run seed` to populate demo data

**`server/legacy/`**
- Purpose: Intentionally-messy code for training purposes
- Contains: `registro_viejo.js` with hard-coded logic, poor structure, undocumented behavior
- Note: Mounted as `POST /api/legacy/registro` only if `LEGACY_ENABLED=true`; not used in normal flow

**`server/tests/`**
- Purpose: Backend test suites
- Contains: Node.js `test` module tests; uses Supertest for HTTP assertions
- Run: `npm test` (server root) or `npm test --prefix server` (monorepo root)

## Key File Locations

**Entry Points:**
- `client/src/main.tsx`: Vite entry point; mounts React to DOM
- `server/src/index.js`: Node.js entry point; loads env, instantiates repo, starts Express
- `client/src/App.tsx`: React root; page router (Inicio → PreRegistro → ConsultaArco)
- `server/src/app.js`: Express app factory; middleware setup

**Configuration:**
- `client/tsconfig.json`: TypeScript compiler options; strict mode
- `server/src/config/env.js`: Environment variable loader (defaults + validation)
- `server/src/config/phases.config.json`: Phase and field definitions (JSON schema-driven)

**Core Logic:**
- `server/src/routes/registros.js`: Draft lifecycle (create, update, submit) + validation
- `server/src/validation/schemas.js`: Zod schemas (single source of truth for data validation)
- `server/src/crypto/cipher.js`: Encryption for sensible phases (AES-256-GCM)
- `client/src/context/WizardContext.tsx`: Global state and business logic (draft management, phase progression)

**Testing:**
- `server/tests/curp.test.js`: CURP format and validation tests
- `server/tests/consentimiento.test.js`: Consent handling tests
- `server/tests/memoryRepo.test.js`: Repository interface contract tests

**Data Persistence:**
- `server/src/repositories/memoryRepo.js`: In-memory storage (Maps)
- `server/src/repositories/postgresRepo.js`: PostgreSQL storage (via pg package)
- `server/db/schema.sql`: PostgreSQL table definitions

**Documentation:**
- `README.md`: Quick start, stack overview, API reference, setup instructions
- `BACKLOG.md`: 12 user stories with acceptance criteria
- `CODE_REVIEW.md`: Review checklist
- `SOLUCIONES_BUGS.md`: Bug explanations (spoiler file)

## Naming Conventions

**Files:**
- `.js` for backend (Node.js ES modules)
- `.ts`, `.tsx` for frontend (TypeScript/JSX)
- `camelCase` for filenames (e.g., `errorHandler.js`, `WizardContext.tsx`)
- Exceptions: index files, config files (e.g., `phases.config.json`)

**Directories:**
- Lowercase plural for feature areas (e.g., `components/`, `routes/`, `repositories/`)
- Lowercase singular for logical groupings (e.g., `config/`, `crypto/`, `utils/`)
- Hierarchical (e.g., `components/wizard/`, `components/fields/`)

**Functions:**
- Backend: `camelCase` verb-first (e.g., `crearDraft()`, `obtenerRepositorio()`, `validarId()`, `generarFolio()`)
- Frontend: `camelCase` or `PascalCase` for React components (e.g., `useWizard()`, `Wizard`, `PhaseRenderer`)

**Variables:**
- Backend: `camelCase` (e.g., `faseActual`, `datosValidados`, `draftId`)
- Frontend: `camelCase` (e.g., `fase`, `config`, `maxFase`)
- TypeScript interfaces: `PascalCase` (e.g., `FaseConfig`, `ConfigPortal`, `ValoresFase`)

**Types:**
- Interfaces: `PascalCase` ending with type name (e.g., `FaseConfig`, `WizardContextValor`, `ApiError`)
- Type aliases: `PascalCase` descriptive (e.g., `ValoresFase`, `DatosFases`, `TipoCampo`)
- Enums: Not used; literal types preferred (e.g., `type TipoFase = 'form' | 'aviso_privacidad' | 'confirmacion'`)

**Constants:**
- Uppercase with underscores (e.g., `CURP_REGEX`, `CLAVES_SEXO`, `CLAVES_ENTIDADES`, `UUID_REGEX`)
- File-level (module scope); not exported unless shared

**Database/API:**
- Snake case for column names and JSON response keys (e.g., `datos_personales`, `datos_clinicos`, `fecha_nacimiento`)
- Camel case for URL segments and route parameters (e.g., `/api/registros/draft`, `/draft/:id/fase/:faseId`)

## Where to Add New Code

**New Feature or Form Phase:**
1. **Phase definition:** Add entry to `server/src/config/phases.config.json` (id, titulo, campos, sensible, tipo)
2. **Validation schema:** Register Zod schema in `server/src/validation/schemas.js` under `esquemasPorFase` map
3. **Frontend component** (if custom type): Create in `client/src/components/wizard/phases/` (e.g., `NuevaFase.tsx`)
4. **Route handler:** Already generic in `server/src/routes/registros.js`; no changes needed (unless special logic required)
5. **Type definitions:** Update `client/src/types.ts` if adding new `TipoFase` or field type

**New API Endpoint:**
1. Create file in `server/src/routes/` (e.g., `miRuta.js`) as Express Router
2. Register in `server/src/app.js`: `app.use('/api/mi-ruta', miRuta)`
3. If writing to database: use `obtenerRepositorio()` to access data layer
4. Add error handling (wrap handlers in try/catch, call `next(err)`)
5. Add rate limiting if needed: `limiteEscritura` middleware from `server/src/middleware/rateLimit.js`
6. Frontend: Add method to `client/src/api/client.ts` (fetch wrapper)

**New Utility Function:**
- Backend: Create in `server/src/utils/` (e.g., `utils/nuevoUtil.js`); export named function; no default exports unless singleton
- Frontend: Create in `client/src/utils/` or inline if one-off; import as needed

**New Component (Frontend):**
- Reusable widget: `client/src/components/` (e.g., `components/MiWidget.tsx`)
- Wizard phase: `client/src/components/wizard/phases/` (e.g., `phases/MiFase.tsx`)
- Use `client/src/context/WizardContext.tsx` for global state; prop-drill only if necessary
- Follow existing style (functional components with hooks, TypeScript interfaces)

**New Test:**
- Backend: `server/tests/miModulo.test.js` (uses Node.js `test` module + Supertest for HTTP)
- Frontend: Not currently set up; would use Vitest or Jest

**Database Changes (PostgreSQL):**
1. Update `server/db/schema.sql` with new table/column DDL
2. Run `psql -d clinicconnect -f server/db/schema.sql` to apply
3. Update repository implementations if schema changes affect queries

**Configuration Changes:**
1. Environment variables: Add to `server/src/config/env.js` with defaults and documentation
2. Phase definitions: Edit `server/src/config/phases.config.json` (JSON, not code)
3. Catalogs: Add to `server/src/validation/catalogos.js` (export constant arrays)

**Security-related Changes:**
- Middleware: Add to `server/src/middleware/` (apply in `app.js`)
- Validation: Update schemas in `server/src/validation/schemas.js`
- Error handling: Extend `server/src/middleware/errorHandler.js` if new error types

## Special Directories

**`server/db/`**
- Purpose: Database initialization and data seeding
- Generated: No; manually maintained
- Committed: Yes; schema.sql is source control
- Maintenance: Run schema migrations manually; seed script is CLI utility

**`.planning/codebase/`**
- Purpose: GSD (Get Stuff Done) planning documents
- Generated: Yes; created by `/gsd-map-codebase` and related skills
- Committed: Yes; documents versioned
- Update: Re-run mapping to sync if architecture changes significantly

**`server/legacy/`**
- Purpose: Training material (intentionally bad code)
- Generated: No; handwritten for educational value
- Committed: Yes; part of training curriculum
- Use: Optional; mount only if `LEGACY_ENABLED=true`

**`node_modules/`**
- Purpose: Installed dependencies
- Generated: Yes; `npm install` creates
- Committed: No; gitignored
- Maintenance: Run `npm install:all` from root to update both client and server

**`.env`**
- Purpose: Environment configuration (secrets, feature flags)
- Generated: No; user creates from `.env.example`
- Committed: No; gitignored (security)
- Template: `server/.env.example` documents all required vars

---

*Structure analysis: 2026-07-15*
