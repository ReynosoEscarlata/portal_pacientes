# Phase 1: Backend CURP Regex Fix - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-15
**Phase:** 1-Backend CURP Regex Fix
**Areas discussed:** Position-17 letter range, Check-digit strictness (position 18), Test coverage depth (CURP-02)

---

## Position-17 letter range

Research (SAT's published CURP validation regex, an independent PHP CURP validator, and consumer-facing explainers) confirmed position 17 accepts any character in `[A-Z0-9]` for 2000+ births, with no vowel exclusion or blocklist.

| Option | Description | Selected |
|--------|-------------|----------|
| A. Unrestricted `[A-Z0-9]` | Matches SAT's published regex exactly | ✓ |
| B. Consonant-restricted subset | Mirrors positions 14-16; would wrongly reject valid vowel-homoclave CURPs | |
| C. Offensive-word/blocklist filter | No official rule supports this | |
| D. Status quo (`\d{2}$`) | This is the bug being fixed | |

**User's choice:** A. Unrestricted `[A-Z0-9]`
**Notes:** Matches the regex change already implied by the roadmap audit and confirmed correct by research.

---

## Check-digit strictness (position 18)

Research confirmed the real CURP check-digit is a weighted-sum mod-10 algorithm, well documented but not flagged as a bug in the original audit (`ROADMAP_VALIDACION_CURP_RFC.md`).

| Option | Description | Selected |
|--------|-------------|----------|
| A. Keep permissive (`\d`) | Matches locked CURP-01/CURP-02 scope exactly | ✓ |
| A + D. Permissive + log gap in roadmap doc | Same as A, plus a tracked note | |
| B. Add real mod-10 check-digit algorithm | Closes the gap but expands scope beyond the audited bug | |
| C. Adopt `validate-curp` npm package | Same scope issue as B, plus a low-star dependency | |

**User's choice:** A. Keep permissive, any digit
**Notes:** Chose not to pair with a backlog doc note — position 18 stays out of scope entirely, undocumented as a known gap for now.

---

## Test coverage depth (CURP-02)

Research applied equivalence-partitioning/boundary-value-analysis practice to a character-class regex bug fix.

| Option | Description | Selected |
|--------|-------------|----------|
| Equivalence-partitioned set | One case per failure class: valid-letter@17, invalid-symbol@17, invalid check-digit | ✓ |
| Minimal targeted additions | 1 valid + 2 invalid, smallest diff | |
| Full boundary matrix | 15-30+ cases incl. year/leap-day — tests correlations the regex doesn't enforce | |
| Table-driven refactor | Would restructure existing passing tests — unrequested refactoring | |

**User's choice:** Equivalence-partitioned set
**Notes:** Matches the existing file's terse hardcoded-array style; satisfies CURP-02's wording without inflating a one-line regex fix into a large test matrix.

---

## Claude's Discretion

- Exact CURP string values used for new test fixtures (must satisfy the full existing regex — valid letters, valid month/day, valid sex code, valid entity code from `CLAVES_ENTIDADES`).

## Deferred Ideas

- CURP check-digit algorithmic verification (mod-10) — real, well-documented fix exists but is new validation capability beyond this bug-fix phase; would need its own scoped phase if picked up later.
