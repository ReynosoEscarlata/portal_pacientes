---
phase: 03-curp-semantic-cross-validation
plan: 01
subsystem: api
tags: [zod, validation, curp, backend]

# Dependency graph
requires: []
provides:
  - "esquemaDatosPersonales.superRefine() cross-field check: CURP birthdate (yymmdd) and sex letter must agree with fechaNacimiento/sexo"
  - "First object-level Zod .superRefine() pattern in the codebase, reusable as a reference for future cross-field checks"
affects: [04-rfc-capture-and-masking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Object-level Zod .superRefine() chained after .strict() for cross-field validation, with an early-return guard re-testing sibling fields' own format checks before comparing"

key-files:
  created: []
  modified:
    - server/src/validation/schemas.js
    - server/tests/curp.test.js

key-decisions:
  - "Both mismatch issues attach to path: ['curp'] (not fechaNacimiento/sexo), matching RESEARCH.md recommendation and the phase success criteria's field-level wording"
  - "Guard clause re-tests CURP_REGEX and the fechaNacimiento format regex before running the semantic comparison, preventing duplicate/confusing curp issues on already-format-invalid input (regression-locked by an issue-count assertion)"

patterns-established:
  - "Cross-field validation stays in the schema layer (schemas.js) via .superRefine(), never in route handlers — reuses the existing ZodError -> manejadorErrores -> 422 {campo, mensaje} pipeline with zero middleware changes"

requirements-completed: [CURP-07]

coverage:
  - id: D1
    description: "Backend rejects a datos_personales payload whose CURP-encoded birthdate (positions 5-10) contradicts fechaNacimiento, with a field-level 422 error"
    requirement: "CURP-07"
    verification:
      - kind: unit
        ref: "server/tests/curp.test.js#rechaza CURP cuya fecha codificada no coincide con fechaNacimiento"
        status: pass
    human_judgment: false
  - id: D2
    description: "Backend rejects a payload whose CURP sex letter (position 11) contradicts sexo, with the raised issue on path: ['curp'] (field-level campo attribution)"
    requirement: "CURP-07"
    verification:
      - kind: unit
        ref: "server/tests/curp.test.js#rechaza CURP cuyo sexo codificado no coincide con sexo"
        status: pass
    human_judgment: false
  - id: D3
    description: "sexo: 'NE' skips the sex cross-check but the birthdate cross-check still applies"
    requirement: "CURP-07"
    verification:
      - kind: unit
        ref: "server/tests/curp.test.js#sexo NE omite la verificación de sexo pero conserva la de fecha"
        status: pass
    human_judgment: false
  - id: D4
    description: "A CURP-consistent payload continues to pass validation (no regression), including the fixed post-2000 fixture"
    requirement: "CURP-07"
    verification:
      - kind: unit
        ref: "server/tests/curp.test.js#acepta payload con CURP semánticamente consistente (sin regresión)"
        status: pass
      - kind: unit
        ref: "server/tests/curp.test.js#acepta CURP post-2000 (letra en posición 17)"
        status: pass
    human_judgment: false
  - id: D5
    description: "superRefine early-return guard prevents duplicate curp issues for format-invalid CURP input (exactly one issue raised, not up to three)"
    requirement: "CURP-07"
    verification:
      - kind: unit
        ref: "server/tests/curp.test.js#CURP con formato inválido produce un solo issue (guard de superRefine)"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-07-17
status: complete
---

# Phase 3 Plan 1: CURP Semantic Cross-Validation Summary

**Added a `.superRefine()` cross-field check to `esquemaDatosPersonales` that rejects any `datos_personales` payload whose CURP-encoded birthdate (positions 5-10) or sex letter (position 11) contradicts the separately captured `fechaNacimiento`/`sexo`, with `sexo: 'NE'` skipping only the sex check.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `esquemaDatosPersonales` now has the codebase's first object-level `.superRefine()` cross-field validation, chained after `.strict()`, comparing CURP-embedded birthdate/sex against `fechaNacimiento`/`sexo` via pure substring slicing (no `Date` parsing)
- Both mismatch issues attach to `path: ['curp']`, flowing unchanged through the existing `manejadorErrores` -> 422 `{ campo: 'curp', mensaje }` pipeline
- An early-return guard re-tests `CURP_REGEX` and the `fechaNacimiento` format regex before comparing, preventing duplicate/confusing `curp` issues when a sibling field is already format-invalid
- Fixed a pre-existing test fixture (`acepta CURP post-2000 (letra en posición 17)`) that would have flipped to failing once the semantic check landed, by giving it a matching `fechaNacimiento`/`sexo`
- Ten `node:test` cases in `curp.test.js` now cover the five phase success criteria plus the two review-flagged regression locks (field-level `path[0] === 'curp'` attribution, single-issue guard count)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CURP semantic cross-check to esquemaDatosPersonales and keep the existing suite green** - `a6132f3` (feat)
2. **Task 2: Lock CURP-07 behavior — rejection outcomes, curp-path attribution, and the single-issue guard** - `7b0eee9` (test)

**Plan metadata:** (this commit) `docs(03-01): complete CURP semantic cross-validation plan`

## Files Created/Modified
- `server/src/validation/schemas.js` - Added `.superRefine((data, ctx) => { ... })` to `esquemaDatosPersonales`, chained after `.strict()`; compares CURP positions 5-10/11 against `fechaNacimiento`/`sexo`
- `server/tests/curp.test.js` - Fixed the pre-existing post-2000 fixture (added matching `fechaNacimiento: '2000-01-15'`, `sexo: 'H'`); added five new semantic/guard test cases

## Decisions Made
- Both `ctx.addIssue` calls use `path: ['curp']` (not `fechaNacimiento`/`sexo`) — matches RESEARCH.md's verified recommendation and keeps error attribution on the field most likely to be re-typed by the patient
- Guard clause returns early rather than relying on Zod to skip `.superRefine()` when a sibling field already failed its own format check (confirmed live in RESEARCH.md that Zod does not auto-skip)

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched the plan's `<action>` blocks verbatim (verified against `03-PATTERNS.md`'s pre-validated code excerpts), and no Rule 1-4 auto-fixes were needed.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 (CURP-07) is complete; `esquemaDatosPersonales` now enforces the CURP↔birthdate/sex invariant at phase-save time in the standard patient flow
- Phase 4 (RFC-01/RFC-02) sequences after this phase since both edit `esquemaDatosPersonales` — no conflicts expected, the new `.superRefine()` is additive and does not touch the `curp`/`fechaNacimiento`/`sexo` field definitions themselves
- No blockers

---
*Phase: 03-curp-semantic-cross-validation*
*Completed: 2026-07-17*

## Self-Check: PASSED

- FOUND: server/src/validation/schemas.js
- FOUND: server/tests/curp.test.js
- FOUND: a6132f3 (Task 1 commit)
- FOUND: 7b0eee9 (Task 2 commit)
