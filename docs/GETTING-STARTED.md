<!-- generated-by: gsd-doc-writer -->
# Getting Started

This guide gets ClinicConnect running locally: the Express API and the React (Vite) frontend, using the in-memory mock data store (no database required).

## Prerequisites

- **Node.js 20+** (tested with 22). No `.nvmrc` or `engines` field is pinned in the repo; the requirement comes from the project [README](../README.md#setup-rápido).
- **npm** (bundled with Node.js).
- **PostgreSQL** — optional. The backend defaults to an in-memory mock repository (`DATA_SOURCE=mock`); PostgreSQL is only needed if you want to run against a real database (see [Switching to PostgreSQL](#switching-to-postgresql-optional) below and [docs/CONFIGURATION.md](./CONFIGURATION.md)).

The project is a two-package layout (not an npm workspace): [`server/`](../server) (Express API) and [`client/`](../client) (React/Vite SPA), each with its own `package.json` and `node_modules`. The root [`package.json`](../package.json) only holds `concurrently` (to run both dev servers together) and `dotenv`.

## Installation steps

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/ReynosoEscarlata/portal_pacientes.git
   cd portal_pacientes
   ```

2. Install root dependencies:

   ```bash
   npm install
   ```

3. Install the server and client dependencies (this is a separate step — `npm install` at the root does **not** install `server/` or `client/` dependencies):

   ```bash
   npm run install:all
   ```

   This runs `cd server && npm install && cd ../client && npm install` ([`package.json`](../package.json) `scripts.install:all`).

4. Create the backend's environment file from the provided template:

   ```bash
   cp server/.env.example server/.env
   ```

   On Windows (cmd.exe): `copy server\.env.example server\.env`

   The defaults in `server/.env.example` are sufficient to run locally with the mock data store — see [docs/CONFIGURATION.md](./CONFIGURATION.md) for what each variable does.

## First run

Start both the API and the frontend together:

```bash
npm run dev
```

This runs `server` (`node --watch src/index.js`, port `4000`) and `client` (`vite`, port `5173`) concurrently via `concurrently` ([`package.json`](../package.json) `scripts.dev`). To run them separately: `npm run dev:server` or `npm run dev:client`.

Open <http://localhost:5173>. The Vite dev server proxies `/api/*` requests to `http://localhost:4000` (`client/vite.config.ts`), so no client-side environment configuration is needed.

To verify the API directly: `GET http://localhost:4000/api/salud` returns `{ ok: true, fuenteDatos }`.

### Seed demo data (optional)

If `server/.env` has `SEED_MOCK=true` (the value in `.env.example`), three fictitious patients are loaded into memory at startup. Their folios (`CC-2026-DEMO01/02/03`) and birth dates, defined in [`server/src/seed/sembrar.js`](../server/src/seed/sembrar.js), can be used to test the ARCO access/deletion flow at `/consulta-arco` without completing the full wizard first.

### Switching to PostgreSQL (optional)

Set `DATA_SOURCE=postgres` in `server/.env`, then:

```bash
createdb clinicconnect
psql -d clinicconnect -f server/db/schema.sql
```

Configure `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD` in `server/.env`, then optionally run `npm run seed` to load the three fictitious patients into the database. Full variable reference: [docs/CONFIGURATION.md](./CONFIGURATION.md).

## Common setup issues

- **`npm run dev` fails with a module-not-found error** — `npm install` at the root only installs `concurrently` and `dotenv`; it does not install `server/` or `client/` dependencies. Run `npm run install:all` (step 3 above).
- **Port `4000` or `5173` already in use** — Another process is bound to the port. Stop it, or change the backend port via `PORT` in `server/.env` (the frontend port is set by Vite and would require editing `client/vite.config.ts`, which also changes the dev proxy target).
- **Frontend requests are blocked by CORS** — If you change the frontend's dev port away from `5173`, update `CORS_ORIGIN` in `server/.env` to match; it defaults to `http://localhost:5173` and the backend only allows that single origin.
- **`DATA_SOURCE=postgres` but the app still uses mock data, or queries fail** — The PostgreSQL connection pool is created lazily; a missing `server/.env` or unapplied `server/db/schema.sql` will not fail at startup, only when a request actually hits the database. Confirm `DATA_SOURCE=postgres`, the schema is applied, and `PG*` variables are correct.

## Next steps

- [docs/ARCHITECTURE.md](./ARCHITECTURE.md) — system overview, component diagram, and data flow.
- [docs/CONFIGURATION.md](./CONFIGURATION.md) — full environment variable reference and defaults.
- [docs/DEVELOPMENT.md](./DEVELOPMENT.md) — local development workflow, build commands, and code style (if present).
- [docs/TESTING.md](./TESTING.md) — running the backend (`node:test`) and client (Vitest) test suites (if present).
- [docs/API.md](./API.md) — endpoint reference, request/response formats, and error codes (if present).
