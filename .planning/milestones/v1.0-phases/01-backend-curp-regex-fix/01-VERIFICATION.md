---
phase: 01-backend-curp-regex-fix
verified: 2026-07-16T04:13:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 01: Backend CURP Regex Fix Verification Report

**Phase Goal:** Patients born in 2000 or later can complete pre-registration; backend CURP validation matches the official 18-character CURP format, with regression coverage so the bug can't silently return.
**Verified:** 2026-07-16T04:13:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

All truths verified directly against the running code (not SUMMARY.md claims) via a standalone Node import of `server/src/validation/schemas.js`.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `CURP_REGEX` and `esquemaDatosPersonales` accept a post-2000 CURP with an uppercase letter in position 17 (`MAPA000115HDFRRLA1`) via tail change `[B-DF-HJ-NP-TV-Z]{3}\d{2}$` → `[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$` | ✓ VERIFIED | Live regex test: `CURP_REGEX.test('MAPA000115HDFRRLA1') === true`. `schemas.js:5` tail is exactly `[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$`. |
| 2 | A pre-2000 CURP with a digit in position 17 continues to be accepted — no regression | ✓ VERIFIED | Live regex test: `CURP_REGEX.test('PEGG850312MDFRRR04') === true`. `node --test server/tests/curp.test.js` — all 3 pre-existing test blocks (`acepta CURP válidas`, `acepta CURP en minúsculas`, `rechaza CURP con formato inválido`) pass unchanged. |
| 3 | A CURP with a non-alphanumeric character in position 17, or a non-digit in position 18, is rejected by `CURP_REGEX` and `esquemaDatosPersonales` | ✓ VERIFIED | Live test: `CURP_REGEX.test('MAPA000115HDFRRL#1') === false`, `CURP_REGEX.test('MAPA000115HDFRRLAX') === false`. New test block `rechaza CURP con diferenciador o dígito verificador inválido` asserts both via `esquemaDatosPersonales.safeParse` and passes. |
| 4 | An empty or missing CURP is rejected by `esquemaDatosPersonales` as a required field (existing behavior, unchanged) | ✓ VERIFIED | Live schema test: `safeParse({ ...base, curp: '' }).success === false` and `safeParse(baseWithoutCurp).success === false`. No changes to the `required_error` config on the `curp` field. |
| 5 | `server/tests/curp.test.js` contains new passing test cases for the post-2000 differentiator and its invalid variants, runnable via `node --test` | ✓ VERIFIED | `node --test server/tests/curp.test.js` → 5/5 tests pass, 0 fail (2 new blocks + 3 pre-existing, all unchanged in title/body per `git diff`). |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `server/src/validation/schemas.js` | `CURP_REGEX` tail changed to `[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$`; all other segments byte-identical | ✓ VERIFIED | `git diff 04915a7 HEAD -- server/src/validation/schemas.js` shows a single-line change, only the final two atoms of the regex differ. Prefix (`^[A-Z][AEIOUX][A-Z]{2}\d{2}...` through entity alternation) is untouched. |
| `server/tests/curp.test.js` | New `test()` blocks for post-2000 valid case and position-17/18 invalid variants | ✓ VERIFIED | `git diff` shows 17 lines added (2 new `test()` blocks), 0 lines removed — 3 pre-existing blocks are byte-identical. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `CURP_REGEX` | `esquemaDatosPersonales` | Zod `.pipe(z.string().regex(CURP_REGEX, ...))` on the `curp` field | ✓ WIRED | `schemas.js:40-44` unchanged — `curp` field still normalizes to uppercase then pipes through `CURP_REGEX`. Confirmed live: both raw-regex (`CURP_REGEX.test`) and full-schema (`esquemaDatosPersonales.safeParse`) paths accept/reject identically for all test fixtures. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| New phase test file passes standalone | `node --test server/tests/curp.test.js` | 5/5 pass, 0 fail | ✓ PASS |
| Full backend suite has no regression | `npm test` | 17/17 pass, 0 fail | ✓ PASS |
| Post-2000 CURP accepted at runtime (not just via SUMMARY claim) | Standalone `node --input-type=module` import + live `.test()`/`.safeParse()` calls | All 7 assertions true (post-2000 accept, pre-2000 accept, pos-17 reject, pos-18 reject, empty reject, missing reject, vowel-at-17 accept per D-02) | ✓ PASS |
| `phases.config.json` untouched (out of scope for this phase) | `git diff 04915a7 HEAD -- server/src/config/phases.config.json` | Empty diff | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| CURP-01 | 01-01-PLAN.md | `CURP_REGEX` accepts CURPs for patients born in 2000+ (letter in position 17) as well as pre-2000 (digit); position 18 remains a digit | ✓ SATISFIED | Truths 1, 2, 4 above; regex tail verified in `schemas.js:5`. |
| CURP-02 | 01-01-PLAN.md | `server/tests/curp.test.js` covers valid post-2000 CURPs and corresponding invalid cases (out-of-range char, malformed check digit) | ✓ SATISFIED | Truths 3, 5 above; new test block with both invalid fixtures, passing. |

No orphaned requirements — REQUIREMENTS.md traceability table maps only CURP-01 and CURP-02 to Phase 1, and both appear in the plan's `requirements` frontmatter.

### Prohibitions (judgment-tier, from PLAN frontmatter)

All 6 listed as `verification: unverified` in the plan frontmatter (specless-fallback flag, not a claim of failure). Verified here by direct code inspection:

| Prohibition | Status | Evidence |
|-------------|--------|----------|
| Position 17 NOT restricted to consonant subset — accepts any `[A-Z0-9]` including vowels/digits (D-02) | ✓ RESOLVED | Live test: `CURP_REGEX.test('MAPA000115HDFRRLE1')` (vowel `E` at position 17) → `true`. |
| No offensive-word/blocklist filtering added at position 17 (D-03) | ✓ RESOLVED | `schemas.js` contains no blocklist array or filter logic; regex is the sole validation mechanism. |
| Position 18 stays a single unrestricted digit; no check-digit (mod-10) algorithm (D-04) | ✓ RESOLVED | Regex tail is `[A-Z0-9]\d$` — single `\d`, no arithmetic/weighted-sum code anywhere in `schemas.js`. |
| Regex positions 1-16 preserved character-for-character | ✓ RESOLVED | `git diff` confirms only the final two atoms changed; prefix through entity alternation is byte-identical. |
| 3 existing `curp.test.js` blocks NOT refactored (D-05) | ✓ RESOLVED | `git diff` shows pure additions (+17/-0 lines); pre-existing block titles and bodies unchanged. |
| `phases.config.json` NOT modified in this phase (Phase 2 / CURP-05 scope) | ✓ RESOLVED | Empty diff for that file between `04915a7` and `HEAD`. |

### Anti-Patterns Found

None. Scanned `server/src/validation/schemas.js` and `server/tests/curp.test.js` for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` — no matches.

### Scope Check

`git diff 04915a7 HEAD --stat` shows only in-scope files touched: `server/src/validation/schemas.js`, `server/tests/curp.test.js`, plus planning docs (`REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `01-01-SUMMARY.md`, `01-REVIEW.md`). No Fase/Draft/Record structure or API-contract files modified, matching the project constraint.

### Human Verification Required

None. All must-haves are deterministic (regex/schema behavior) and were directly exercised and confirmed via live code execution, not just static presence checks.

### Gaps Summary

No gaps. All 5 must-have truths, both artifacts, the one key link, both requirement IDs (CURP-01, CURP-02), and all 6 judgment-tier prohibitions are verified against the actual codebase. `node --test server/tests/curp.test.js` (5/5) and the full backend suite `npm test` (17/17) both pass with zero regressions.

---

_Verified: 2026-07-16T04:13:00Z_
_Verifier: Claude (gsd-verifier)_
