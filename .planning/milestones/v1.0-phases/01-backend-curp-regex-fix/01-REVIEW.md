---
phase: 01-backend-curp-regex-fix
reviewed: 2026-07-15T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - server/src/validation/schemas.js
  - server/tests/curp.test.js
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-07-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed the CURP regex fix in `server/src/validation/schemas.js` and its accompanying regression
tests in `server/tests/curp.test.js`. The change replaces the trailing `\d{2}$` in `CURP_REGEX`
with `[A-Z0-9]\d$`, which correctly allows a letter at position 17 (the century/homoclave
differentiator used for people born in 2000 or later) while still requiring a digit at position 18
(the check digit). I traced this against the documented root cause (`SOLUCIONES_BUGS.md` Bug 1) and
against the real CURP specification: the fix is minimal, targeted, and correct — it strictly widens
acceptance at position 17 only, without weakening the position-18 digit requirement, so no
previously-valid-and-correctly-accepted CURP is now rejected, and no previously-correctly-rejected
malformed CURP (wrong length, bad month/day, bad state code, bad sex code) becomes accepted.

Ran the backend test suite (`npm test`); all 17 tests pass, including the 3 new/modified CURP tests
introduced by this phase.

No critical defects found. Two pre-existing gaps (not introduced or worsened in a way that breaks
this phase's stated goal, but real and living in the reviewed file) are flagged below because the
regex fix technically widens what "looks valid" without adding any compensating cross-checks.

## Warnings

### WR-01: No cross-field consistency check between CURP century differentiator and `fechaNacimiento`

**File:** `server/src/validation/schemas.js:23-44`
**Issue:** `CURP_REGEX` now accepts either a digit or a letter at position 17 (`[A-Z0-9]`)
regardless of what the 2-digit year (positions 5-6) encodes. Per the official spec, position 17
should be a digit only for people born before 2000 and a letter only for people born in 2000 or
later — i.e., it is supposed to be *consistent* with the century of the encoded birth year. There is
no `.refine()` (here or anywhere else in the schema) that cross-checks the CURP's encoded
year/century against the separately-submitted `fechaNacimiento` field, nor one that checks the
CURP's sex letter (position 11, `H`/`M`) against the submitted `sexo` field (which itself also
allows a third value, `'NE'`, via `CLAVES_SEXO`, that no real CURP would ever encode).

Before this fix, the regex's over-restriction (rejecting all letter differentiators) accidentally
acted as a partial "no post-2000 CURP without matching digit" guard; after the fix, a CURP whose
century differentiator doesn't match the submitted birth year (e.g. `fechaNacimiento: '1985-03-12'`
paired with a CURP using a letter at position 17) will now pass format validation with no error,
because nothing links the two fields. This doesn't block the intended fix (a pure per-field regex
can't fully resolve this — the CURP spec itself relies on the differentiator to disambiguate an
otherwise-ambiguous 2-digit year), but it is a real, currently-unguarded correctness gap in the file
reviewed.

**Fix:** If cross-field CURP/`fechaNacimiento` (and CURP/`sexo`) consistency is required by the
product, add a `.refine()` on `esquemaDatosPersonales` that decodes the CURP's year/century/sex
segments and compares them against `fechaNacimiento`/`sexo`. If that level of validation is
explicitly out of scope for this milestone (per `CLAUDE.md`'s "bug-fix, not a redesign" constraint),
consider filing it as a follow-up item rather than leaving it silently unaddressed.

## Info

### IN-01: CURP check digit (position 18) is not validated against the official checksum algorithm

**File:** `server/src/validation/schemas.js:5`
**Issue:** Position 18 is validated as "any digit" (`\d$`) rather than the RENAPO check-digit
algorithm (a weighted mod-10 calculation over positions 1-17). This means a CURP with a
transposed/typo'd final digit will still pass validation. This limitation predates this fix (the
prior regex also just required `\d{2}$` with no checksum) and is unchanged by it — flagging for
visibility only, not as a regression.
**Fix:** If stronger CURP integrity checking is desired later, implement the check-digit algorithm
as a separate `.refine()` step so the regex stays focused on structural shape.

### IN-02: No regression test locks in the century/differentiator consistency gap described in WR-01

**File:** `server/tests/curp.test.js`
**Issue:** The new tests correctly cover the position-17-letter acceptance case and the two invalid
variants (non-alphanumeric at 17, letter at 18), which matches the documented bug and fix exactly.
There is no test documenting the known limitation that a digit/letter at position 17 is currently
accepted independent of the encoded year, so a future contributor could "fix" WR-01 and
unknowingly break an assumption nothing currently tests for (or, conversely, not realize the gap
exists at all).
**Fix:** Optional — add a comment or a skipped/documented test noting the known limitation so it's
discoverable without re-deriving it from the regex.

---

_Reviewed: 2026-07-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
