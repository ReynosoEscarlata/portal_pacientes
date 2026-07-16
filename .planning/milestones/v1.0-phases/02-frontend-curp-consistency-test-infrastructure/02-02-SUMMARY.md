---
phase: 02-frontend-curp-consistency-test-infrastructure
plan: 02
subsystem: frontend-validation-testing
tags: [curp, phases-config, react-testing-library, vitest, component-test]

# Dependency graph
requires:
  - phase: 01-backend-curp-regex-fix
    provides: corrected CURP_REGEX in server/src/validation/schemas.js
  - plan: 02-01
    provides: Vitest + Testing Library infrastructure (client/vitest.config.ts, client/src/test-utils/setup.ts)
provides:
  - Frontend curp.pattern in phases.config.json byte-for-byte synced with backend CURP_REGEX
  - Reusable renderConWizard test harness (mocks useWizard hook)
  - PhaseRenderer component test proving client-side CURP format validation
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vi.mock('../context/WizardContext') declared once in the shared renderConWizard.tsx harness applies across every *.test.tsx file that imports renderConWizard (confirmed live by a smoke test, RESEARCH Open Question 1)"
    - "Explicit afterEach(cleanup) registered in src/test-utils/setup.ts — required because globals: false disables @testing-library/react's automatic afterEach-based cleanup"
    - "Isolated single-field FaseConfig fixtures for component tests, avoiding the need to satisfy unrelated required fields of the full datos_personales fase"

key-files:
  created:
    - client/src/test-utils/renderConWizard.tsx
    - client/src/test-utils/renderConWizard.test.tsx
    - client/src/components/wizard/PhaseRenderer.test.tsx
  modified:
    - server/src/config/phases.config.json
    - client/src/test-utils/setup.ts

key-decisions:
  - "Fixed the RTL cleanup gap in the shared setup.ts (Rule 3 blocking fix) rather than adding per-file afterEach(cleanup) calls — keeps the fix in one place for all future test files that render more than once per file."

requirements-completed: [CURP-05, CURP-06]

coverage:
  - id: D1
    description: "phases.config.json curp.pattern equals the corrected backend CURP_REGEX source exactly (byte-for-byte, JSON double-escaped)"
    requirement: "CURP-05"
    verification:
      - kind: unit
        ref: "node equality check comparing parsed JSON pattern to CURP_REGEX.source"
        status: pass
    human_judgment: false
  - id: D2
    description: "renderConWizard harness mocks useWizard (not the private WizardContext object); a smoke test proves the shared vi.mock applies across importing test files"
    requirement: "CURP-06"
    verification:
      - kind: unit
        ref: "client/src/test-utils/renderConWizard.test.tsx (1 test, passing)"
        status: pass
    human_judgment: false
  - id: D3
    description: "PhaseRenderer form accepts a valid post-2000 CURP, rejects a malformed CURP (role=alert), and documents the lowercase A2 edge case as intended behavior"
    requirement: "CURP-05"
    verification:
      - kind: unit
        ref: "client/src/components/wizard/PhaseRenderer.test.tsx (3 tests, passing)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-07-16
status: complete
---

# Phase 02 Plan 02: Frontend CURP Pattern Consistency & Component Test Summary

**Synced `phases.config.json`'s curp pattern byte-for-byte with the corrected backend `CURP_REGEX`, and proved client-side rejection/acceptance through the actual rendered `PhaseRenderer` form using a new reusable `renderConWizard` test harness that mocks `useWizard` instead of exporting `WizardContext`.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-16T19:49:00Z
- **Completed:** 2026-07-16T19:51:38Z
- **Tasks:** 3 completed
- **Files modified:** 5 (1 config fix, 3 new test files, 1 setup.ts fix)

## Accomplishments

- `server/src/config/phases.config.json`'s `curp.pattern` now equals `CURP_REGEX.source` from `server/src/validation/schemas.js` exactly — verified via a node equality check, plus manual match checks (`MAPA000115HDFRRLA1` matches, `NOVALIDA123` does not) and full backend suite (17/17 passing, config still valid JSON).
- `client/src/test-utils/renderConWizard.tsx` — the repo's first reusable RTL harness. Mocks `useWizard` (typed via `ReturnType<typeof useWizard>`, no need to export the private `WizardContextValor` interface) rather than trying to render a literal `<WizardContext.Provider>`, which is impossible since only `WizardProvider`/`useWizard` are exported.
- `client/src/test-utils/renderConWizard.test.tsx` — smoke test confirming the shared-file `vi.mock('../context/WizardContext')` declared inside `renderConWizard.tsx` applies to any test file that only imports the harness (RESEARCH Open Question 1, confirmed live before building further assertions on it).
- `client/src/components/wizard/PhaseRenderer.test.tsx` — three tests against an isolated single-field `curp` `FaseConfig` fixture, exercising the actual rendered form:
  1. Valid post-2000 CURP (`MAPA000115HDFRRLA1`) → `guardarFase('datos_personales', { curp: 'MAPA000115HDFRRLA1' })` is called.
  2. Malformed CURP (`NOVALIDA123`) → `role="alert"` shows "CURP no tiene un formato válido"; `guardarFase` is NOT called.
  3. Lowercase but structurally-valid CURP (`mapa000115hdfrrla1`) → same alert/no-call behavior, explicitly documented as accepted RESEARCH A2 behavior (client `validarCampo` does not uppercase before testing; backend does), not a regression.
- Full client suite: 8/8 tests passing (4 mask tests from Plan 01 + 1 harness smoke test + 3 PhaseRenderer tests).

## Task Commits

Each task was committed atomically:

1. **Task 1: Sync phases.config.json curp.pattern to the corrected backend CURP_REGEX** - `b46fb1d` (fix)
2. **Task 2: Build the reusable renderConWizard harness and a smoke test proving the shared mock applies** - `83ffdbe` (test)
3. **Task 3: Component test — PhaseRenderer accepts valid CURP, rejects malformed, and documents the lowercase edge** - `0cbee3a` (test, includes the setup.ts cleanup fix — see Deviations)

**Plan metadata:** committed after this SUMMARY (docs commit, see below)

## Files Created/Modified

- `server/src/config/phases.config.json` — `datos_personales.campos[curp].pattern` replaced with the corrected backend `CURP_REGEX` source, JSON double-escaped (mirrors the existing `telefono`/`cp` field escaping convention). No other field/fase touched.
- `client/src/test-utils/renderConWizard.tsx` — exports `renderConWizard(ui, overrides)`; mocks `useWizard` at module scope via `vi.mock`, provides a `contextoBase(overrides)` factory covering the full `useWizard` return shape.
- `client/src/test-utils/renderConWizard.test.tsx` — one smoke test rendering `PhaseRenderer` with an isolated fixture, asserting the submit button is present.
- `client/src/components/wizard/PhaseRenderer.test.tsx` — three component tests (accept/reject/lowercase-edge) described above.
- `client/src/test-utils/setup.ts` — added explicit `afterEach(cleanup)` registration (see Deviations below).

## Decisions Made

- Fixed the RTL auto-cleanup gap centrally in the shared `setup.ts` (applies to every current and future test file) rather than adding a per-file `afterEach(cleanup)` — smaller footprint, single source of truth for test hygiene.
- No new decisions beyond RESEARCH.md/PATTERNS.md's already-specified harness pattern, fixture values, and CURP-05 pattern string — plan executed as specified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `@testing-library/react` renders leaked across tests within the same file**
- **Found during:** Task 3, running the full `PhaseRenderer.test.tsx` suite (3 tests in one file)
- **Issue:** `client/vitest.config.ts` sets `globals: false` (per D-01/existing project convention of explicit imports, established in Plan 01). `@testing-library/react`'s automatic `afterEach(cleanup)` registration only fires when it detects a global `afterEach`; with `globals: false`, that auto-registration never happens. As a result, DOM nodes from earlier tests in the same file were never unmounted, and `screen.getByLabelText(/curp/i)` / `screen.getByRole('alert')` started matching multiple elements once the file had more than one `render()` call, failing tests 2 and 3 with "Found multiple elements" errors.
- **Fix:** Added an explicit `afterEach(() => cleanup())` (importing `afterEach` from `vitest` and `cleanup` from `@testing-library/react`) to the shared `client/src/test-utils/setup.ts`, which already runs before every test file via `vitest.config.ts`'s `setupFiles`.
- **Files modified:** `client/src/test-utils/setup.ts`
- **Commit:** `0cbee3a`

No other deviations — plan executed as specified otherwise.

## Issues Encountered

The RTL cleanup gap above was the only blocker; it was diagnosed via the exact "Found multiple elements" error output pointing at duplicate `<form>` trees in the rendered DOM, and resolved on the first fix attempt (no further build/test failures).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- CURP-05 and CURP-06 requirements are both closed for this plan's scope.
- `renderConWizard` is now reusable for any future component test that consumes `useWizard()`.
- No blockers for future phases.

---
*Phase: 02-frontend-curp-consistency-test-infrastructure*
*Completed: 2026-07-16*

## Self-Check: PASSED

All created files verified present on disk; all three task commits (`b46fb1d`, `83ffdbe`, `0cbee3a`) verified present in git log.
