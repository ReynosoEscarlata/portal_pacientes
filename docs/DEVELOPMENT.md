<!-- generated-by: gsd-doc-writer -->
# Development

This guide covers local development setup, build/test commands, code style, and the
git workflow contributors are expected to follow. For first-run instructions aimed at
new users, see the project [README](../README.md); for environment variables and
config file format, see [CONFIGURATION.md](CONFIGURATION.md).

## Local setup

The project is a two-package workspace (`server/` for the Express API, `client/` for
the React/Vite frontend) with a thin root `package.json` that wires them together.

1. **Install dependencies** — installs the root, server, and client packages:

   ```bash
   npm install
   npm run install:all
   ```

2. **Configure the backend** — copy the example env file and adjust as needed
   (see [CONFIGURATION.md](CONFIGURATION.md) for the full variable reference):

   ```bash
   cp server/.env.example server/.env
   # on Windows: copy server\.env.example server\.env
   ```

   The default configuration uses `DATA_SOURCE=mock` (in-memory repository), so no
   database is required to start developing. `SEED_MOCK=true` in the example file
   seeds 3 fictitious patients at boot (`server/src/seed/sembrar.js`), useful for
   exercising the ARCO (access/deletion) flow.

3. **(Optional) Use PostgreSQL instead of the mock repository** — set
   `DATA_SOURCE=postgres` in `server/.env`, then create the database and apply the
   schema before starting the server:

   ```bash
   createdb clinicconnect
   psql -d clinicconnect -f server/db/schema.sql
   npm run seed   # optional: load the 3 fictitious patients
   ```

4. **Run the dev servers** — starts the API (`:4000`) and the Vite dev server
   (`:5173`) together via `concurrently`:

   ```bash
   npm run dev
   ```

   The client dev server proxies `/api/*` requests to `http://localhost:4000`
   (`client/vite.config.ts`), so no client-side environment variables are needed to
   reach the backend. Each half can also be started independently with
   `npm run dev:server` or `npm run dev:client`.

## Build commands

All commands below are run from the project root unless noted otherwise.

| Command | Description |
|---------|-------------|
| `npm run dev` | Runs the Express API (`--watch` mode) and the Vite dev server in parallel, via `concurrently`. |
| `npm run dev:server` | Runs only the backend, with `node --watch src/index.js` (auto-restarts on file changes). |
| `npm run dev:client` | Runs only the frontend, with `vite`. |
| `npm run build` | Type-checks and builds the client for production: `tsc --noEmit && vite build` (defined in `client/package.json`). No build step is needed for the server — it runs directly from `server/src/`. |
| `npm test` | Runs the backend test suite: `node --test` (Node's built-in test runner), executed inside `server/`. |
| `npm run test:client` | Runs the client test suite once: `vitest run`, executed inside `client/`. |
| `npm run seed` | Seeds fictitious patients into whichever repository is active (`DATA_SOURCE`), via `server/db/seed.js`. |

See [TESTING.md](TESTING.md) for details on running subsets of tests and writing new
ones.

## Code style

There is no ESLint, Prettier, Biome, or `.editorconfig` configuration in this
repository — no lint or format script exists in any of the three `package.json`
files (root, `server/`, `client/`), and CI does not enforce a style check. Style
consistency instead follows the conventions already present in the codebase:

- **2-space indentation**, required semicolons, single quotes for
  imports/strings — consistent across the server (JavaScript/ESM) and client
  (TypeScript/TSX).
- **ES Modules only**: the server declares `"type": "module"` in
  `server/package.json` and uses `import`/`export` exclusively (no CommonJS,
  no `require`).
- **TypeScript strict mode** on the client (`client/tsconfig.json`): `strict: true`,
  `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` are all
  enabled. `npm run build` (`tsc --noEmit && vite build`) is the closest thing to a
  lint gate for the client — it fails on type errors, unused locals/parameters, and
  missing `break` statements in `switch` blocks.
- **Naming**: Spanish, verb+noun function names (`crearApp()`, `guardarFase()`,
  `validarId()`), camelCase for variables/modules, PascalCase for React components
  and TypeScript interfaces/types, UPPER_SNAKE_CASE for regex patterns and catalog
  constants. See the codebase conventions section of the project's `.claude/CLAUDE.md`
  for the full pattern reference used across this repo.

When contributing, match the style of the file you are editing rather than
introducing a new formatting convention.

## Branch conventions

There is no branch-naming convention enforced by tooling (no CI check, no git hook).
The project rule is:

- Always work on a branch separate from `master` — never commit or push directly to
  `master`. Create a descriptive branch before starting work (e.g.
  `fix/curp-regex`, `feat/arco-rate-limit`).
- Keep changes scoped to what was requested; avoid mixing unrelated changes into the
  same branch.

Commit messages in this repository loosely follow the
[Conventional Commits](https://www.conventionalcommits.org/) format —
`type(scope): description`, with types such as `feat`, `fix`, `docs`, `test`, and
`chore` — as seen in the existing git history (`git log --oneline`).

## PR process

There is no `.github/PULL_REQUEST_TEMPLATE.md`, `CONTRIBUTING.md`, or CI workflow
(`.github/workflows/`) in this repository, so there is no automated PR checklist or
required status check. Based on the project's own development rules:

- Verify the change before opening a PR: run `npm test` (backend suite via
  `node:test`) and `npm run build` (client type-check + production build via
  `tsc --noEmit && vite build`). Both must pass.
- Keep the PR scoped to the change requested — do not fold in unrelated
  refactors, dependency bumps, or "drive-by" improvements without calling them out
  separately.
- Confirm the change does not alter the `Fase`/`Draft`/`Record` data contracts
  (phase config shape, draft structure, submitted-record shape) unless that is
  explicitly the point of the change, since other code (frontend rendering,
  validation schemas, ARCO responses) depends on those shapes staying stable.
- Describe what changed and why in the PR description; link to any related issue or
  planning document if one exists.
