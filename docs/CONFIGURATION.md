<!-- generated-by: gsd-doc-writer -->
# Configuration

ClinicConnect's backend (`server/`) is configured entirely through environment
variables, loaded from a `.env` file at the root of `server/` via `dotenv`.
The single source of truth for all variables, their parsing, and their
defaults is [`server/src/config/env.js`](../server/src/config/env.js).

The frontend (`client/`) has no environment-variable configuration of its
own — it talks to the backend through Vite's dev-server proxy (see
[Config file format](#config-file-format)).

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|--------------|
| `NODE_ENV` | Optional | `development` | Runtime mode. Set to `production` to enforce the `ENCRYPTION_KEY` check (see [Required vs optional settings](#required-vs-optional-settings)) and `test` to suppress dev-key warnings and skip rate limiting. |
| `PORT` | Optional | `4000` | Port the Express server listens on. |
| `DATA_SOURCE` | Optional | `mock` | Storage backend: `postgres` selects the PostgreSQL repository; any other value (including unset) falls back to the in-memory mock repository. |
| `CORS_ORIGIN` | Optional | `http://localhost:5173` | Single allowed origin for CORS (passed directly to the `cors` middleware's `origin` option). |
| `ENCRYPTION_KEY` | Required in production | `''` (empty) | 64-character hex string (32 bytes) used as the AES-256-GCM key for encrypting the sensitive `datos_clinicos` phase. |
| `SEED_MOCK` | Optional | `false` | When `true` (and `DATA_SOURCE=mock`), seeds 3 fictitious patients into memory at startup. Parsed as the literal string `'true'`. |
| `LEGACY_ENABLED` | Optional | `false` | When `true`, mounts the legacy training endpoint `POST /api/legacy/registro`. Parsed as the literal string `'true'`. |
| `PGHOST` | Required when `DATA_SOURCE=postgres` | `localhost` | PostgreSQL host. |
| `PGPORT` | Required when `DATA_SOURCE=postgres` | `5432` | PostgreSQL port. |
| `PGDATABASE` | Required when `DATA_SOURCE=postgres` | `clinicconnect` | PostgreSQL database name. |
| `PGUSER` | Required when `DATA_SOURCE=postgres` | `postgres` | PostgreSQL user. |
| `PGPASSWORD` | Required when `DATA_SOURCE=postgres` | `''` (empty) | PostgreSQL password. |

A template with all variables is provided at `server/.env.example`; copy it
to `server/.env` before running the server (see project README "Setup
rápido").

## Config file format

Beyond environment variables, the backend reads one JSON configuration file
that defines the wizard's phases, fields, and catalogs:
[`server/src/config/phases.config.json`](../server/src/config/phases.config.json).
This file is loaded at request time by
[`server/src/routes/phases.js`](../server/src/routes/phases.js) and served to
the frontend via `GET /api/phases`; the frontend renders the wizard entirely
from this response (no hardcoded phase list on the client).

Top-level keys:

```json
{
  "versionAviso": "1.0-2026-07",
  "fases": [
    {
      "id": "datos_personales",
      "titulo": "Datos personales",
      "tipo": "form",
      "sensible": false,
      "campos": [ { "nombre": "nombre", "tipo": "text", "requerido": true } ]
    }
  ]
}
```

- `versionAviso` — current privacy-notice version string; recorded with each
  patient's consent for traceability.
- `fases` — ordered array of wizard phases. Each phase has an `id`, `titulo`,
  `tipo` (`form`, `aviso_privacidad`, or `confirmacion`), a `sensible` flag
  (marks the phase for AES-256-GCM encryption at rest — see
  [`server/src/crypto/cipher.js`](../server/src/crypto/cipher.js)), and, for
  `form`-type phases, a `campos` array describing each field (name, label,
  type, required flag, and optional `pattern`/`maxLength`/`catalogo`
  constraints).

Adding, removing, or reordering phases/fields only requires editing this
JSON file. Any phase that needs backend validation must also have a
matching Zod schema registered in
[`server/src/validation/schemas.js`](../server/src/validation/schemas.js)
(`esquemasPorFase`).

The frontend dev server (`client/vite.config.ts`) proxies all `/api/*`
requests to `http://localhost:4000`, so no client-side environment
variable is needed to reach the backend during development.

## Required vs optional settings

Only one setting can cause a runtime failure, and it is enforced lazily
rather than at startup:

- **`ENCRYPTION_KEY`** — When `NODE_ENV=production` and `ENCRYPTION_KEY` is
  not a 64-character hex string, the first call to encrypt or decrypt data
  (in [`server/src/crypto/cipher.js`](../server/src/crypto/cipher.js))
  throws `Error('ENCRYPTION_KEY debe ser una cadena hex de 64 caracteres en
  producción')`. This is not checked until a sensitive phase (`datos_clinicos`)
  is actually saved or read, not when the server boots.
- In any other `NODE_ENV`, a missing or invalid `ENCRYPTION_KEY` falls back
  to a key derived via `scryptSync` from a hardcoded development passphrase,
  with a `[cipher]` console warning (suppressed when `NODE_ENV=test`).

Everything else has a usable default and the server will start without it.
`DATA_SOURCE=postgres` without valid `PGHOST`/`PGDATABASE`/`PGUSER`/
`PGPASSWORD` values will not fail at startup either — the connection pool is
created lazily and queries will fail only when the repository is actually
used.

## Defaults

All defaults are defined inline in
[`server/src/config/env.js`](../server/src/config/env.js) using the
nullish-coalescing (`??`) operator, except for the three boolean flags
(`DATA_SOURCE`, `SEED_MOCK`, `LEGACY_ENABLED`), which default via strict
string equality checks (`=== 'true'` / `=== 'postgres'`):

| Variable | Default value | Set in |
|----------|----------------|--------|
| `NODE_ENV` | `'development'` | `env.js:4` |
| `PORT` | `4000` | `env.js:5` |
| `DATA_SOURCE` | `'mock'` | `env.js:6` |
| `CORS_ORIGIN` | `'http://localhost:5173'` | `env.js:7` |
| `ENCRYPTION_KEY` | `''` (dev key derived at first use) | `env.js:8`, `cipher.js:18` |
| `SEED_MOCK` | `false` | `env.js:9` |
| `LEGACY_ENABLED` | `false` | `env.js:10` |
| `PGHOST` | `'localhost'` | `env.js:12` |
| `PGPORT` | `5432` | `env.js:13` |
| `PGDATABASE` | `'clinicconnect'` | `env.js:14` |
| `PGUSER` | `'postgres'` | `env.js:15` |
| `PGPASSWORD` | `''` | `env.js:16` |

Two additional non-environment defaults are worth noting:

- Request body size is capped at `100kb` (`express.json({ limit: '100kb'
  })` in `server/src/app.js`) — not configurable via environment variable.
- The PostgreSQL connection pool caps at `max: 10` connections
  (`server/src/repositories/postgresRepo.js`) — not configurable via
  environment variable.

## Per-environment overrides

There is a single `.env` file (`server/.env`, loaded by `dotenv/config`) —
the codebase does not read separate `.env.development` / `.env.production`
files. Per-environment behavior is instead driven by the value of
`NODE_ENV` inside the application code:

- `NODE_ENV=production` — enforces the strict `ENCRYPTION_KEY` hex-format
  check described above (throws instead of falling back to a dev key).
- `NODE_ENV=test` — rate limiting middleware
  ([`server/src/middleware/rateLimit.js`](../server/src/middleware/rateLimit.js))
  is skipped entirely (`skip: () => env.NODE_ENV === 'test'`), and the
  `[cipher]` dev-key warning is suppressed.
- Any other value (including the `development` default) — uses the
  derived development encryption key and logs a warning on first use.

<!-- VERIFY: production hosting platform, its environment/secret manager, and the actual production values for CORS_ORIGIN, ENCRYPTION_KEY, and PG* are not present in this repository -->
