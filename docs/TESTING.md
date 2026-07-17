<!-- generated-by: gsd-doc-writer -->
# Testing

ClinicConnect has two independent test suites: a backend suite (`server/`) using Node's built-in test runner with Supertest, and a frontend suite (`client/`) using Vitest with Testing Library. There is no shared test runner across the two — each is invoked separately.

## Test Framework and Setup

### Backend (`server/`)

- **Framework:** [`node:test`](https://nodejs.org/api/test.html), Node's built-in test runner (no external test framework dependency). Verified with Node.js `v22.22.2`.
- **HTTP assertions:** [`supertest`](https://www.npmjs.com/package/supertest) `^7.0.0` (declared in `server/package.json` `devDependencies`) drives requests against the Express app in-process, without opening a real network port.
- **Setup required:** Run `npm install` in `server/` (or `npm run install:all` from the repo root) before running tests. No database is required — every test file sets:
  ```js
  process.env.NODE_ENV = 'test';
  process.env.DATA_SOURCE = 'mock';
  ```
  at the top of the file, which forces the app to use the in-memory repository (`server/src/repositories/memoryRepo.js`) instead of PostgreSQL.

### Frontend (`client/`)

- **Framework:** [Vitest](https://vitest.dev/) `^3.2.7`, configured in `client/vitest.config.ts`.
- **DOM environment:** `happy-dom` (`^20.10.6`), configured via `test.environment: 'happy-dom'`.
- **Component testing:** `@testing-library/react` `^16.3.2`, `@testing-library/user-event` `^14.6.1`, and `@testing-library/jest-dom` `^6.9.1` (loaded in the setup file for custom matchers like `toBeInTheDocument`).
- **Setup file:** `client/src/test-utils/setup.ts`, referenced by `vitest.config.ts` via `setupFiles: ['./src/test-utils/setup.ts']`. Because the config sets `globals: false`, Testing Library's automatic `afterEach(cleanup)` registration does not fire on its own — the setup file registers `afterEach(cleanup)` explicitly so each test starts with an empty DOM.
- **Setup required:** Run `npm install` in `client/` (or `npm run install:all` from the repo root) before running tests.

## Running Tests

From the repository root (`package.json` scripts delegate via `npm --prefix`):

```bash
# Backend suite
npm test

# Frontend suite
npm run test:client
```

Equivalent direct invocations from each package directory:

```bash
# server/
npm test          # runs: node --test

# client/
npm test          # runs: vitest run
```

There is no configured watch-mode script in either `package.json`. To run Vitest in watch mode manually from `client/`, use `npx vitest` (without the `run` flag).

To run a single backend test file, pass the path directly to the Node test runner:

```bash
cd server
node --test tests/arco.test.js
```

To run a single frontend test file:

```bash
cd client
npx vitest run src/utils/mask.test.ts
```

## Writing New Tests

### Backend conventions

- **File naming:** `*.test.js` inside `server/tests/`, flat directory (no nested subfolders currently).
- **Pattern:** Each file imports `test` and `assert` from `node:test` / `node:assert/strict`, sets `NODE_ENV=test` and `DATA_SOURCE=mock` at the top, then dynamically imports the module(s) under test with `await import(...)` — this ensures the env vars are set before the module (and its dependencies, like the repository singleton) are loaded.
- **Integration-style tests** (e.g. `arco.test.js`, `consentimiento.test.js`) build a full Express app via `crearApp()` from `server/src/app.js` and drive it with `supertest`'s `request(app)`, asserting on HTTP status codes and response bodies.
- **Unit-style tests** (e.g. `codigoPostal.test.js`, `curp.test.js`) import Zod schemas directly from `server/src/validation/schemas.js` and call `.safeParse()` to assert acceptance/rejection of specific inputs.
- **Config-consistency tests** (`phases-config-consistency.test.js`) read `server/src/config/phases.config.json` directly with `node:fs` and cross-check it against the regex/schema constants in `server/src/validation/schemas.js`, catching drift between the dynamic phase config and the hardcoded validation rules.
- Existing test files: `arco.test.js`, `codigoPostal.test.js`, `consentimiento.test.js`, `curp.test.js`, `memoryRepo.test.js`, `phases-config-consistency.test.js`.

### Frontend conventions

- **File naming:** `*.test.ts` for plain TypeScript utilities (e.g. `src/utils/mask.test.ts`), `*.test.tsx` for React components (e.g. `src/components/wizard/PhaseRenderer.test.tsx`). Test files live alongside the source file they cover, not in a separate `__tests__/` directory.
- **Shared test helper:** `client/src/test-utils/renderConWizard.tsx` wraps a component under test so it can render `PhaseRenderer` (and similar wizard-dependent components) without a real `WizardProvider` or network fetch — it mocks `../context/WizardContext` and accepts overrides (e.g. a `guardarFase` spy) per test. `client/src/test-utils/renderConWizard.test.tsx` is a smoke test that verifies the harness itself.
- **Setup file:** `client/src/test-utils/setup.ts` (see Test Framework and Setup above) — imported automatically by Vitest for every test file, do not import it manually.
- **Pattern:** Use `describe`/`it`/`expect` from `vitest`, `screen` and `userEvent` from Testing Library to interact with rendered components, and `vi.fn()` / `vi.mock()` for spies and mocks (imported from `vitest`, not `jest`).

## Coverage Requirements

No coverage tool or threshold is configured in this project. Neither `server/package.json` nor `client/package.json` declares a coverage script, and there is no `.nycrc`, `c8` configuration, or Vitest `coverage` block in `client/vitest.config.ts`. Test completeness is currently enforced through code review rather than an automated coverage gate.

## CI Integration

No CI/CD workflow is configured in this repository — there is no `.github/workflows/` directory. Tests must be run manually before merging changes:

```bash
npm test          # backend (from repo root)
npm run test:client   # frontend (from repo root)
npm run build      # client typecheck + build (tsc --noEmit && vite build)
```
