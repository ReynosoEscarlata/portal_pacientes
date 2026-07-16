# Phase 1: Backend CURP Regex Fix - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the `CURP_REGEX` bug in `server/src/validation/schemas.js` that wrongly requires a digit at position 17 of every CURP, rejecting valid CURPs for patients born in 2000 or later (who get a letter homoclave differentiator there instead). Add regression test coverage for the fix in `server/tests/curp.test.js`. This phase is backend-only (CURP-01, CURP-02); frontend pattern alignment and the client test suite are Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Regex fix (CURP-01)
- **D-01:** Change `CURP_REGEX` ending from `[B-DF-HJ-NP-TV-Z]{3}\d{2}$` to `[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$` — position 17 accepts any unrestricted character in `[A-Z0-9]` (digit for pre-2000, letter for 2000+, no vowel/blocklist restriction), position 18 remains any single digit `\d`.
- **D-02:** Do NOT restrict position 17 to the consonant-only subset used elsewhere in the regex (positions 14-16). That subset encodes name-derived internal consonants — a different, unrelated rule. Restricting position 17 to consonants would wrongly reject real CURPs with a vowel homoclave letter. Confirmed against SAT's own published CURP validation regex.
- **D-03:** No offensive-word/blocklist filtering at position 17 — no official rule supports this, and it would be unrequested scope beyond the audited bug.

### Check-digit scope (position 18)
- **D-04:** Keep position 18 permissive (`\d`, any digit) — do NOT implement the real CURP check-digit (weighted-sum mod-10) algorithm. That would be new validation capability, not a fix to the audited bug (`ROADMAP_VALIDACION_CURP_RFC.md` §1.1 only names the position-17 issue). Out of scope for this phase; not tracked as a backlog item either (user chose plain "keep permissive" over the doc-pairing option).

### Test coverage (CURP-02)
- **D-05:** Use an equivalence-partitioned test set — one case per failure class relevant to this fix: (a) valid CURP with a letter differentiator at position 17 (2000+ birth), (b) invalid CURP with an out-of-range/invalid character at position 17, (c) invalid CURP with a malformed/missing check digit at position 18. This is the technique-justified floor for a character-class regex fix — matches `curp.test.js`'s existing terse, hardcoded-array style. Do not build a full boundary matrix (year 1999 vs 2000, leap-day, entity/sex boundaries) — the regex has no year-conditional logic tying the differentiator to `fechaNacimiento`, so those cases would test a correlation the code doesn't implement. Do not refactor the existing 3 passing tests into a table-driven format — that's unrelated, unrequested refactoring.

### Claude's Discretion
- Exact CURP string values used for new test fixtures (must satisfy the full existing regex: valid apellido/nombre letters, valid month/day, valid sex code, valid entity code from `CLAVES_ENTIDADES`) — pick realistic examples consistent with the file's existing fixtures.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bug audit (primary source of truth for this phase)
- `ROADMAP_VALIDACION_CURP_RFC.md` §"Fase 1 — Corrección de bugs bloqueantes (CURP)", items 1.1 and 1.2 — the original audit that scoped this phase's two requirements

### Project planning
- `.planning/PROJECT.md` — project context and Active requirements
- `.planning/REQUIREMENTS.md` — CURP-01, CURP-02 requirement definitions
- `.planning/research/SUMMARY.md` — confirms the official CURP position-17/18 format rules
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria

### Code to change
- `server/src/validation/schemas.js` (line 4-5, `CURP_REGEX`) — the regex being fixed
- `server/tests/curp.test.js` — where new regression tests are added

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/tests/curp.test.js` already has 3 `test()` blocks using `node:test` + `node:assert/strict`, importing `esquemaDatosPersonales` and `CURP_REGEX` directly from `schemas.js`. New tests should extend this file using the same import and assertion style.
- `CLAVES_ENTIDADES` (imported from `./catalogos.js` in `schemas.js`) provides the valid entity-code list the regex's positions 12-13 already check against — reuse a known-valid entity code (e.g. `DF`, `MC`) for new test fixtures rather than inventing one.

### Established Patterns
- CURP is validated in two places conceptually: `CURP_REGEX` (raw format) used both standalone (`CURP_REGEX.test(...)`) and inside the Zod pipe (`esquemaDatosPersonales`, which also uppercases input before validating). New tests should cover both the raw regex and, where relevant to existing test style, the full schema parse.
- Existing invalid-case tests in `curp.test.js` use inline comments explaining what's wrong with each fixture (e.g. `// mes 13`) — follow this convention for the new cases (e.g. `// letra fuera de A-Z en posición 17`).

### Integration Points
- No other files reference `CURP_REGEX` directly outside `schemas.js` and its test file — Phase 2's frontend `phases.config.json` pattern is a *separate* duplicated string, not imported from this file, so this phase's fix does not need to touch the frontend.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the locked decisions above — the audit document and research fully specified the correct fix.

</specifics>

<deferred>
## Deferred Ideas

- **CURP check-digit algorithmic verification (mod-10)** — real fix exists and is well-documented (RENAPO weighted-sum algorithm), but is new validation capability beyond this bug-fix phase's scope. Not tracked in a backlog doc per user's choice; would need its own scoped phase if picked up later.
- **RFC implementation, CURP semantic cross-validation** — already out of scope per `PROJECT.md` / `REQUIREMENTS.md`; not re-raised during this discussion.

### Reviewed Todos (not folded)
None — no matching todos found (`todo.match-phase` returned 0 matches).

</deferred>

---

*Phase: 1-Backend CURP Regex Fix*
*Context gathered: 2026-07-15*
