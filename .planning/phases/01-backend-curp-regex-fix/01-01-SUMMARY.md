---
phase: 01-backend-curp-regex-fix
plan: 01
subsystem: api
tags: [zod, regex, validation, curp, node-test]

# Dependency graph
requires: []
provides:
  - "CURP_REGEX in server/src/validation/schemas.js accepts post-2000 CURPs (letter in position 17)"
  - "Regression test coverage in server/tests/curp.test.js for the post-2000 valid case and its position-17/18 invalid variants"
affects: [02-frontend-curp-consistency, curp-masking-fix]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN cycle for a single-regex character-class bug fix, using node:test + node:assert/strict"

key-files:
  created: []
  modified:
    - server/src/validation/schemas.js
    - server/tests/curp.test.js

key-decisions:
  - "Regex tail changed from [B-DF-HJ-NP-TV-Z]{3}\\d{2}$ to [B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\\d$ — position 17 unrestricted alnum, position 18 stays a single permissive digit (no check-digit algorithm, per D-04)."

patterns-established:
  - "Equivalence-partitioned test coverage for character-class regex fixes: one valid case + one invalid case per changed position, following the file's existing terse hardcoded-array style."

requirements-completed: [CURP-01, CURP-02]

coverage:
  - id: D1
    description: "CURP_REGEX and esquemaDatosPersonales accept a post-2000 CURP with a letter in position 17 (e.g. MAPA000115HDFRRLA1)"
    requirement: "CURP-01"
    verification:
      - kind: unit
        ref: "server/tests/curp.test.js#acepta CURP post-2000 (letra en posición 17)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pre-2000 CURPs (digit in position 17) continue to be accepted — no regression on the 3 pre-existing tests"
    requirement: "CURP-01"
    verification:
      - kind: unit
        ref: "server/tests/curp.test.js#acepta CURP válidas"
        status: pass
      - kind: unit
        ref: "server/tests/curp.test.js#acepta CURP en minúsculas (se normaliza a mayúsculas)"
        status: pass
      - kind: unit
        ref: "server/tests/curp.test.js#rechaza CURP con formato inválido"
        status: pass
    human_judgment: false
  - id: D3
    description: "A CURP with a non-alphanumeric character in position 17, or a non-digit in position 18, is rejected"
    requirement: "CURP-02"
    verification:
      - kind: unit
        ref: "server/tests/curp.test.js#rechaza CURP con diferenciador o dígito verificador inválido"
        status: pass
    human_judgment: false

# Metrics
duration: 5min
completed: 2026-07-16
status: complete
---

# Phase 01 Plan 01: Backend CURP Regex Fix Summary

**Fixed CURP_REGEX position-17 tail (`[A-Z0-9]\d$` instead of `\d{2}$`) so post-2000 patients with a letter homoclave differentiator pass backend Zod validation, with new node:test regression coverage for both the fix and its invalid variants.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-16T03:29:21Z
- **Completed:** 2026-07-16T03:33:57Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Post-2000 CURPs (letter in position 17, e.g. `MAPA000115HDFRRLA1`) are now accepted by both `CURP_REGEX` and `esquemaDatosPersonales` — the blocking bug preventing these patients from completing pre-registration is fixed.
- Pre-2000 CURPs (digit in position 17) continue to be accepted — verified no regression via the 3 pre-existing tests.
- Added regression coverage: one new test for the valid post-2000 case (proven RED before the fix, GREEN after) and one new test for the two invalid variants (bad position-17 character, bad position-18 character).

## Task Commits

Each task was committed atomically:

1. **Task 1: Add failing regression test for the post-2000 CURP (RED)** - `1352c80` (test)
2. **Task 2: Fix CURP_REGEX position-17/18 tail (GREEN)** - `bc74a0c` (fix)
3. **Task 3: Add invalid-variant regression tests (position 17 and 18)** - `a3ace6e` (test)

**Plan metadata:** _pending — recorded in final commit step_

## Files Created/Modified
- `server/src/validation/schemas.js` - `CURP_REGEX` tail changed from `[B-DF-HJ-NP-TV-Z]{3}\d{2}$` to `[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$`; every other segment (century/year/month/day, sex, entity alternation, positions 14-16) preserved character-for-character.
- `server/tests/curp.test.js` - Added `acepta CURP post-2000 (letra en posición 17)` and `rechaza CURP con diferenciador o dígito verificador inválido` test blocks; the 3 pre-existing blocks are unchanged.

## Decisions Made
- Followed CONTEXT.md decisions exactly: position 17 unrestricted `[A-Z0-9]` (no consonant/vowel/blocklist restriction, D-02/D-03), position 18 stays a permissive single digit with no check-digit algorithm (D-04), and no expansion into a full boundary matrix beyond the equivalence-partitioned set (D-05).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CURP-01 and CURP-02 are complete; the backend now correctly validates post-2000 CURPs.
- `server/src/config/phases.config.json` (frontend CURP pattern) was intentionally left untouched — Phase 2 (CURP-05) is scoped to align it with this corrected backend regex.
- No blockers for Phase 2 (frontend consistency, CURP masking fix, client test infra).

---
*Phase: 01-backend-curp-regex-fix*
*Completed: 2026-07-16*

## Self-Check: PASSED

- FOUND: server/src/validation/schemas.js
- FOUND: server/tests/curp.test.js
- FOUND: .planning/phases/01-backend-curp-regex-fix/01-01-SUMMARY.md
- FOUND: commit 1352c80 (Task 1)
- FOUND: commit bc74a0c (Task 2)
- FOUND: commit a3ace6e (Task 3)
