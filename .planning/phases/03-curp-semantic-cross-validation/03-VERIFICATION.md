---
phase: 03-curp-semantic-cross-validation
verified: 2026-07-17T16:40:00Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 3: CURP Semantic Cross-Validation Verification Report

**Phase Goal:** The backend rejects a pre-registration whose CURP silently contradicts the birthdate or sex the patient entered — cross-field `.superRefine()` on `esquemaDatosPersonales`, no Fase/Draft/Record or API-contract changes.

**Verified:** 2026-07-17T16:40:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CURP birthdate mismatch (positions 5-10 vs `fechaNacimiento`) is rejected, field-level | ✓ VERIFIED | `schemas.js:61-70`; test `rechaza CURP cuya fecha codificada no coincide con fechaNacimiento` passes; live exercise confirms `success:false`, `path[0]:'curp'` |
| 2 | CURP sex letter (position 11) contradicting `sexo` is rejected, field-level | ✓ VERIFIED | `schemas.js:72-79`; test `rechaza CURP cuyo sexo codificado no coincide con sexo` passes and asserts `r.error.issues[0].path[0] === 'curp'` |
| 3 | `sexo: 'NE'` skips sex cross-check, birthdate cross-check still applies | ✓ VERIFIED | `schemas.js:73` (`data.sexo !== 'NE'` guard); test `sexo NE omite la verificación de sexo pero conserva la de fecha` asserts both the accept (NE + matching date) and reject (NE + mismatched date) branches |
| 4 | Consistent CURP/birthdate/sex payload continues to pass (no regression) | ✓ VERIFIED | Test `acepta payload con CURP semánticamente consistente (sin regresión)` passes on `safeParse(base)` |
| 5 | Pre-existing post-2000 fixture made semantically consistent (`fechaNacimiento: 2000-01-15`, `sexo: 'H'`) | ✓ VERIFIED | `curp.test.js:26-35` — fixture now overrides `fechaNacimiento`/`sexo` to match `MAPA000115HDFRRLA1`; test passes |
| 6 | Backend `node:test` coverage locks each case (mismatched birthdate, mismatched sex, NE-skip, consistent-accept) | ✓ VERIFIED | All 4 dedicated tests present in `curp.test.js` and pass (`node --test tests/curp.test.js` — 10/10 pass) |
| 7 | Semantic-rejection test asserts `path[0] === 'curp'` (review Concern 1 lock) | ✓ VERIFIED | `curp.test.js:80` — `assert.equal(r.error.issues[0].path[0], 'curp')` present and passing |
| 8 | Format-invalid CURP produces exactly one issue (`issues.length === 1`), regression-locking the early-return guard (review Concern 2 lock) | ✓ VERIFIED | `curp.test.js:99-106` — `assert.equal(r.error.issues.length, 1)` present and passing |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `server/src/validation/schemas.js` | `.superRefine()` chained after `.strict()` on `esquemaDatosPersonales`, substring comparison, `path:['curp']`, NE-skip, early-return guard | ✓ VERIFIED | Lines 56-80; no `new Date`/`getFullYear`/`getMonth`/`charAt(16)` present in the refinement; only `esquemaDatosPersonales` modified — `esquemaDomicilio`, `esquemaDatosClinicos`, `esquemaConsentimiento` untouched |
| `server/tests/curp.test.js` | 5 new test blocks + fixed post-2000 fixture | ✓ VERIFIED | All 5 new tests present with exact Spanish titles from the plan; `base` fixture (lines 9-18) byte-unchanged |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `superRefine` guard | `CURP_REGEX` / fechaNacimiento format regex | early-return before `.slice`/`.charAt` | ✓ WIRED | `schemas.js:57-59`; regression-locked by `issues.length === 1` test |
| `ctx.addIssue({path:['curp']})` | `manejadorErrores` -> `422 {campo,mensaje}` | unchanged ZodError pipeline | ✓ WIRED | No changes to `errorHandler.js`; `path[0]==='curp'` assertion confirms attribution reaches the issues array `manejadorErrores` reads |
| Birthdate comparison | substring slicing only | `curp.slice(4,10)` vs `fechaNacimiento` slices | ✓ WIRED | `schemas.js:61-63` — no `Date` parsing used |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `node --test tests/curp.test.js` (all 10 cases) | `cd server && node --test tests/curp.test.js` | 10/10 pass | ✓ PASS |
| Full backend suite | `npm test` (repo root) | 23/23 pass (arco, consentimiento, memoryRepo, phases-config-consistency, curp) | ✓ PASS |
| Client typecheck + build | `npm run build` (repo root) | `tsc --noEmit && vite build` exits 0, `dist/` produced | ✓ PASS |
| Live schema exercise: post-2000 consistent CURP accepted | inline ESM import + `safeParse` | `success: true` | ✓ PASS |
| Live schema exercise: birthdate mismatch rejected on `path:['curp']` | inline ESM import + `safeParse` | `success: false`, `path[0]: 'curp'` | ✓ PASS |
| Live schema exercise: `sexo:'NE'` with matching birthdate accepted | inline ESM import + `safeParse` | `success: true` | ✓ PASS |

### Scope Check (Commits)

| Commit | Type | Files touched | Status |
|--------|------|----------------|--------|
| `a6132f3` | feat | `server/src/validation/schemas.js`, `server/tests/curp.test.js` | ✓ IN SCOPE |
| `7b0eee9` | test | `server/tests/curp.test.js` only | ✓ IN SCOPE |
| `96bdf4b` | docs | `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/phases/.../03-01-SUMMARY.md` | ✓ IN SCOPE (planning-only) |
| `17a6710` | fix(ui) | client CSS | N/A — unrelated debug-session fix, not part of this phase (confirmed excluded per task scope) |

No Fase/Draft/Record structure or API-contract file was touched by the in-scope commits.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| CURP-07 | 03-01-PLAN.md | Backend rejects CURP↔birthdate/sex mismatch, field-level error; NE skips sex check | ✓ SATISFIED | `schemas.js:56-80` + 10 passing tests in `curp.test.js`; REQUIREMENTS.md traceability marks CURP-07 Complete for Phase 3 |

No orphaned requirements — REQUIREMENTS.md maps only CURP-07 to Phase 3, and it is claimed and satisfied.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | none found (`TODO\|FIXME\|XXX\|HACK\|PLACEHOLDER` scan on both modified files) | — | — |

### Human Verification Required

None — all must-haves are programmatically verifiable and were verified against the live codebase.

### Gaps Summary

No gaps. All 8 plan must-haves and all 6 roadmap success criteria are verified against the live code and passing tests, including both review-added regression locks (`path[0]==='curp'` attribution, single-issue guard). Full backend suite and client build are green. Commit scope is clean — the two code commits touch only the two files declared in the plan; the docs commit touches only `.planning/` files. No debt markers, no stubs, no orphaned requirements.

---

_Verified: 2026-07-17T16:40:00Z_
_Verifier: Claude (gsd-verifier)_
