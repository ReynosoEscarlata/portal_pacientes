# Phase 2: Frontend CURP Consistency & Test Infrastructure - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Align the frontend's CURP handling with the backend fix from Phase 1, and introduce the client's first test runner to lock it in. Two bugs to fix: (1) `enmascararCurp` in `client/src/utils/mask.ts` exposes 5 characters instead of 4, leaking one digit of birth year on the confirmation screen; (2) the `curp` field `pattern` in `server/src/config/phases.config.json` (`^[A-Za-z0-9]{18}$`) is looser than the corrected backend `CURP_REGEX`, so malformed CURPs aren't caught until submission. Both fixes need regression coverage from a newly-added Vitest + Testing Library setup in `client/`. This phase is frontend-only (CURP-03 through CURP-06); the backend regex itself was already fixed in Phase 1.

</domain>

<decisions>
## Implementation Decisions

### Test runner scope (`npm test`)
- **D-01:** Keep the root `npm test` scoped to backend only, unchanged from today (`npm --prefix server test`). Add a separate script for client tests (e.g. `npm run test:client` in the root `package.json`, or just `npm --prefix client test` run directly) rather than merging into the existing `npm test` contract.
- **Why:** `.claude/CLAUDE.md` "Reglas de Desarrollo" explicitly names `npm test` as the backend suite in its mandatory pre-close verification checklist. Merging client tests into it would silently redefine a documented contract without updating that doc in the same change. No CI depends on this — `npm test` is a local developer gate only, so getting the scope "wrong" has low technical cost but real documentation-drift cost. Matches the project's "alcance estricto" / no-unrequested-scope-change directive.
- **Downstream note:** The plan should add `client/package.json`'s own `test` script (Vitest) and, separately, decide whether to add a root convenience script pointing at it — but must NOT touch the existing root `"test"` script's meaning.

### Vitest environment
- **D-02:** Use `happy-dom` as the DOM simulator for Vitest (`environment: 'happy-dom'` in `vitest.config.ts`), not `jsdom`.
- **Why:** User's explicit choice, made after research flagged the trade-off: `happy-dom` is faster but younger (~4.5k GitHub stars vs. jsdom's ~21.6k) and has a documented-by-Vitest incomplete DOM API surface, which is a real risk factor for the upcoming Testing Library component render test (D-04). Accepted knowingly — if `PhaseRenderer` component tests hit unexplained DOM API gaps during Phase 2 execution, that's the first thing to suspect; falling back to `jsdom` for that specific test file (via a per-file `// @vitest-environment jsdom` override) is an acceptable escape hatch if needed, without abandoning `happy-dom` as the project default.

### Test file location
- **D-03:** Co-locate test files next to source (`client/src/**/*.test.ts(x)`), not a mirrored `client/tests/` directory.
- **Why:** Standard convention in the Vite/React/Vitest ecosystem (matches Vitest's own scaffolding default), needs no extra `include` config. Research found `server/tests/` isn't actually a structural mirror of `server/src/` (it's a flat folder named by topic, not a nested replica) — so it's a weaker precedent for "consistency" than it first appears. Client `tsconfig.json` has `"include": ["src"]`; the plan should confirm whether `.test.tsx` files need excluding from the production typecheck (`tsc --noEmit` in `npm run build`) or if that's acceptable/handled by Vitest's own typechecking.

### CURP pattern test strategy (CURP-05, CURP-06)
- **D-04:** Test via full component render: `@testing-library/react` + `@testing-library/user-event`, filling the CURP field in the actual rendered `PhaseRenderer` form and asserting the error message appears/doesn't appear on submit. No changes to `validarCampo`'s visibility (stays unexported, un-refactored).
- **D-05:** Build the `WizardContext` mock/render harness as **reusable test infrastructure**, not inline-only for this one test. Create a shared helper (e.g. `client/src/test-utils/` — exact naming/location left to planner) that wraps a component in a mocked `WizardContext.Provider` with configurable `config`/`datos`/`faseActual`/`guardarFase`/`irAFase`, so future phases that add component tests don't re-solve this.
- **Why:** User explicitly chose the higher-fidelity, higher-setup-cost option over the two cheaper alternatives (exporting `validarCampo` for a pure-function test, or testing the regex string from `phases.config.json` in isolation) — accepting the added harness work as an investment. Requirements note this is the **first** component-level test in the repo (all existing tests are backend unit/HTTP tests); this decision sets that precedent deliberately, not as scope creep.
- **Constraint:** This is still "config + first tests only" scope per `PROJECT.md`'s Test infra constraint — the reusable harness should be sized for what THIS phase's test needs (rendering `PhaseRenderer` with a mocked context), not built out speculatively for hypothetical future component shapes.

### Masking regression test coverage (CURP-04)
- **D-06:** Cover: (1) happy path — 18-char valid CURP → 4 visible chars + 14 asterisks, exact-equality assertion (mirrors `server/tests/arco.test.js`'s existing `'PEGG' + '*'.repeat(14)` pattern — reuse a matching CURP fixture for visible cross-reference between backend and frontend tests); (2) empty string → `''` (exercises the function's other real branch, `if (!curp) return ''`); (3) short CURP (<4 chars) and exactly-4-char CURP, included as **documented hardening cases**, explicitly labeled/commented as NOT anti-regression cases.
- **Why on the short/4-char cases:** Research confirmed these do not distinguish the bug (`slice(0,5)`) from the fix (`slice(0,4)`) — both produce identical (fully-exposed) output at those lengths, since `Math.max(0, len-5)` and `Math.max(0, len-4)` both floor to 0. User chose to include them anyway as documentation of current behavior for malformed input, understanding they're not part of the anti-reversion protection (that's carried entirely by the happy-path exact-match test). The plan/test file must make this distinction explicit (e.g., a comment or separate `describe` block) so a future reader doesn't mistake them for regression coverage.

### Claude's Discretion
- Exact file/folder naming for the new `test-utils` harness (D-05) and for the root convenience test script name (D-01).
- Whether to exclude `*.test.tsx` from `tsc --noEmit` via `tsconfig.json` exclude, or rely on Vitest's separate type-checking — pick whichever keeps `npm run build` passing without excluding legitimate source files.
- Exact CURP fixture values for new test cases (must be valid per the full backend `CURP_REGEX`) — reuse `PEGG850312MDFRRR04`-style values already established in `server/tests/arco.test.js` and `server/tests/curp.test.js` where it helps cross-reference frontend/backend test expectations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/PROJECT.md` — Active requirements (CURP masking bug, pattern alignment, client test suite) and the Test infra constraint ("keep initial client test setup minimal")
- `.planning/REQUIREMENTS.md` — CURP-03, CURP-04, CURP-05, CURP-06 requirement definitions
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria
- `.planning/phases/01-backend-curp-regex-fix/01-CONTEXT.md` — Phase 1's decisions on the corrected `CURP_REGEX`, which this phase's frontend pattern must match exactly

### Code to change
- `client/src/utils/mask.ts` — `enmascararCurp` (line 3-6), the masking bug fix
- `server/src/config/phases.config.json` (line 17) — `curp` field `pattern`, to be updated to match backend `CURP_REGEX`
- `server/src/validation/schemas.js` (line 4-5) — source of truth for the corrected `CURP_REGEX` string to duplicate
- `client/src/components/wizard/PhaseRenderer.tsx` — `validarCampo` (line 11-21), the pattern-validation logic under test
- `client/package.json` — where the new Vitest/Testing Library devDependencies and `test` script land
- Root `package.json` (line 11, `"test"` script) — must NOT be changed to include client tests (D-01)

### Test precedent to follow
- `server/tests/curp.test.js` — existing terse arrange-act-assert style, inline comments explaining invalid fixtures
- `server/tests/arco.test.js` (line ~267) — existing masking assertion pattern (`'PEGG' + '*'.repeat(14)`) to mirror in the new client test

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/tests/arco.test.js`'s masking assertion pattern and CURP fixture (`PEGG850312MDFRRR04` → `'PEGG' + '*'.repeat(14)`) — reuse the same fixture value in the new client-side masking test for direct backend/frontend comparability.
- `CLAVES_ENTIDADES`/existing valid CURP fixtures already established in `server/tests/curp.test.js` — reuse known-valid CURP strings rather than inventing new ones for the wizard-form component test.

### Established Patterns
- `validarCampo` in `PhaseRenderer.tsx` runs pattern validation only on form submit (`continuar()`), not on every keystroke — the component test (D-04) must submit the form to trigger validation, not just type into the field.
- Frontend/backend validation split: `phases.config.json`'s `pattern` field is a **duplicated** string, not imported from `schemas.js` — confirmed in Phase 1 CONTEXT.md and unchanged by `PROJECT.md`'s Key Decisions (duplication chosen over exposing a shared config API). This phase's `phases.config.json` fix must keep the two regexes in sync manually.

### Integration Points
- `Confirmacion.tsx` imports `enmascararCurp` from `mask.ts` and uses it to render the confirmation-screen summary — the one and only call site for the masking fix.
- `PhaseRenderer.tsx` is the one and only place `campo.pattern` (from `phases.config.json`) is compiled into a `RegExp` and tested against user input on the frontend.

</code_context>

<specifics>
## Specific Ideas

No specific UI/visual references beyond the locked decisions above — this phase is validation/masking correctness and test infrastructure, not a UI redesign.

</specifics>

<deferred>
## Deferred Ideas

- **Extracting `validarCampo` to a shared, exported/testable util** — considered as an alternative test strategy (option (a) in the CURP test strategy research) but not chosen; the user picked full component rendering instead (D-04). Not re-raised as a separate idea, just the road not taken.
- **npm workspaces for the monorepo** — surfaced during `npm test` research as a long-term alternative to `--prefix` scripts, but flagged as a structural change well beyond this phase's scope. Not pursued.
- **RFC implementation, CURP semantic cross-validation** — already out of scope per `PROJECT.md` / `REQUIREMENTS.md`; not re-raised during this discussion.

### Reviewed Todos (not folded)
None — no matching todos found (`todo.match-phase` returned 0 matches for Phase 2).

</deferred>

---

*Phase: 2-Frontend CURP Consistency & Test Infrastructure*
*Context gathered: 2026-07-15*
