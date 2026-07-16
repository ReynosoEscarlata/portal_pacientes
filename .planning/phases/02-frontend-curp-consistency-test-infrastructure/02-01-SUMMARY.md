---
phase: 02-frontend-curp-consistency-test-infrastructure
plan: 01
subsystem: testing
tags: [vitest, testing-library, happy-dom, react, typescript, mask]

# Dependency graph
requires:
  - phase: 01-backend-curp-regex-fix
    provides: corrected CURP_REGEX and server-side enmascararCurp precedent (server/src/utils/mask.js)
provides:
  - Client's first-ever test runner (Vitest + Testing Library, happy-dom)
  - Fixed enmascararCurp (4 visible chars, matching server) with a locking regression test
affects: [02-02 (PhaseRenderer CURP pattern test infra depends on this Vitest setup)]

# Tech tracking
tech-stack:
  added: [vitest@3.2.7, happy-dom@20.10.6, "@testing-library/react@16.3.2", "@testing-library/user-event@14.6.1", "@testing-library/jest-dom@6.9.1"]
  patterns:
    - "Standalone client/vitest.config.ts (not merged into vite.config.ts), re-declaring plugins: [react()]"
    - "Co-located test files next to source (client/src/**/*.test.ts)"
    - "Explicit vitest imports (globals: false) — no ambient test globals"

key-files:
  created:
    - client/vitest.config.ts
    - client/src/test-utils/setup.ts
    - client/src/utils/mask.test.ts
  modified:
    - client/package.json
    - package.json
    - client/src/utils/mask.ts

key-decisions:
  - "Followed RESEARCH.md pins exactly: vitest@^3.2.7 (not latest 4.x, which requires Vite 6+) and happy-dom@^20.10.6 (D-02, locked)."
  - "Root npm test contract preserved unchanged (D-01); added test:client as the new convenience script."

patterns-established:
  - "TDD gate proven end-to-end for client code: RED commit (test(02-01): ...) then GREEN commit (fix(02-01): ...)."

requirements-completed: [CURP-03, CURP-04, CURP-06]

coverage:
  - id: D1
    description: "Vitest + Testing Library test runner operational via `npm --prefix client test`, discovering co-located client/src/**/*.test.ts(x) files"
    requirement: "CURP-06"
    verification:
      - kind: unit
        ref: "npm --prefix client test (mask.test.ts collected and executed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "enmascararCurp masks all but the first 4 characters (matching server-side enmascararCurp), with an exact-equality regression test that fails against the old slice(0,5) behavior"
    requirement: "CURP-03"
    verification:
      - kind: unit
        ref: "client/src/utils/mask.test.ts#enmascararCurp > enmascara todo excepto los primeros 4 caracteres"
        status: pass
    human_judgment: false
  - id: D3
    description: "Regression test suite covers happy-path anti-regression, empty-string, and documented length<=4 hardening cases"
    requirement: "CURP-04"
    verification:
      - kind: unit
        ref: "client/src/utils/mask.test.ts (4 tests, all passing)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-16
status: complete
---

# Phase 02 Plan 01: Vitest Test Infrastructure & CURP Masking Fix Summary

**Stood up the client's first Vitest + Testing Library runner and fixed `enmascararCurp` to expose 4 characters (not 5), locked in by an exact-equality regression test mirroring the server-side precedent.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-16T19:43:00Z
- **Completed:** 2026-07-16T19:45:34Z
- **Tasks:** 2 completed
- **Files modified:** 6 (2 created config/setup, 1 created test, 3 modified package.json/mask.ts)

## Accomplishments
- `npm --prefix client test` now runs Vitest 3.2.7 against `client/vitest.config.ts` (happy-dom environment, explicit imports, jest-dom matchers wired via `src/test-utils/setup.ts`)
- `client/src/utils/mask.test.ts` added with 4 regression cases (happy-path anti-regression, empty-string, two documented length<=4 hardening cases)
- `enmascararCurp` now returns `curp.slice(0, 4) + '*'.repeat(Math.max(0, curp.length - 4))`, mirroring `server/src/utils/mask.js` exactly — closes the PII over-exposure gap on the confirmation screen (T-02-01)
- TDD RED→GREEN cycle proven: happy-path test failed against the old `slice(0,5)` code, then passed after the one-line fix
- Root `npm test` contract unchanged (still `npm --prefix server test`); new `npm run test:client` convenience script added

## Task Commits

Each task was committed atomically:

1. **Task 1: Stand up Vitest + Testing Library and author the failing enmascararCurp regression test** - `ad8a98c` (test)
2. **Task 2: Fix enmascararCurp to expose 4 characters and turn the regression test GREEN** - `1e5af6b` (fix)

**Plan metadata:** committed after this SUMMARY (docs commit, see below)

_Note: TDD tasks used a test → fix commit pair per the plan's tdd="true" tasks; no separate refactor commit was needed._

## Files Created/Modified
- `client/vitest.config.ts` - Standalone Vitest config: `environment: 'happy-dom'`, `setupFiles: ['./src/test-utils/setup.ts']`, `globals: false`, `plugins: [react()]`
- `client/src/test-utils/setup.ts` - Single-line Vitest setup entry importing `@testing-library/jest-dom/vitest`
- `client/src/utils/mask.test.ts` - `enmascararCurp` regression suite (CURP-04): happy-path anti-regression, empty string, two documented hardening cases
- `client/src/utils/mask.ts` - `enmascararCurp` fixed from `slice(0,5)` to `slice(0,4)` (both the visible-slice count and the asterisk-count subtrahend); `enmascararTelefono`, `enmascararCorreo`, `iniciales` byte-for-byte unchanged
- `client/package.json` - Added `vitest`, `happy-dom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` devDependencies; added `"test": "vitest run"` script
- `package.json` (root) - Added `"test:client": "npm --prefix client test"`; existing `"test"` script left unchanged

## Decisions Made
- Followed RESEARCH.md's version pins exactly (`vitest@^3.2.7`, not registry-latest `4.x`, which requires Vite 6+ and would conflict with the project's pinned `vite@^5.4.8`).
- No new decisions beyond what CONTEXT.md/RESEARCH.md already locked (D-01 through D-06) — plan executed as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The RED verification exactly matched expectations (`'PEGG8*************' ` vs expected `'PEGG**************'`), and GREEN, `npm --prefix client run build` (`tsc --noEmit && vite build`), and the root `npm test` (backend suite, 17/17 passing) all passed on first attempt after the fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Vitest infrastructure is now operational and reusable; Plan 02 (`PhaseRenderer` CURP pattern validation test, `phases.config.json` regex sync) can build directly on `client/vitest.config.ts` and `client/src/test-utils/setup.ts` without further setup.
- `enmascararCurp` over-exposure bug (CURP-03) is fully closed and regression-locked; no residual concern for Plan 02.
- No blockers.

---
*Phase: 02-frontend-curp-consistency-test-infrastructure*
*Completed: 2026-07-16*

## Self-Check: PASSED

All created files verified present on disk; both task commits (`ad8a98c`, `1e5af6b`) verified present in git log.
