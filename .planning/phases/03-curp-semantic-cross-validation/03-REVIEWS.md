---
phase: 3
reviewers: [claude-headless-opus]
reviewed_at: 2026-07-17T00:00:00Z
plans_reviewed: [03-01-PLAN.md]
reviewer_note: >
  No independent-vendor CLI was available on this machine (gemini/codex/opencode/qwen/cursor/agy
  all missing; ollama/lm_studio servers not running). Per the workflow's --claude path, the review
  ran in a SEPARATE headless Claude session with a DIFFERENT model (Opus) than the orchestrating
  session, with full repo read access for source-grounding. Same-vendor caveat applies: treat as
  one independent grounded reviewer, not multi-vendor consensus.
---

# Cross-AI Plan Review — Phase 3

## Claude Review (headless, model: opus, separate session)

I've verified the plan against the actual source. Here is my review.

---

### 1. Summary

This is a **high-quality, low-risk plan** that is unusually well-grounded in the actual codebase. Every load-bearing claim I checked holds against source: the `.superRefine()` will chain correctly onto `esquemaDatosPersonales` (`schemas.js:33-55`), the `ctx.addIssue` path flows through the unchanged error pipeline (`errorHandler.js:7-12`), and the pre-existing fixture regression (`curp.test.js:26-30`) is real and correctly diagnosed. The scope is tightly bounded to two files, no API/data-structure changes, no new dependencies. My concerns are narrow: the test suite locks *rejection* but not the two behavioral guarantees the plan itself emphasizes (the `path: ['curp']` attribution and the single-issue guard), and the threat model slightly overstates its enforcement-coverage claim.

### 2. Strengths

- **The fixture regression is genuine and the fix is arithmetically correct.** `curp.test.js:28` passes `{ ...base, curp: 'MAPA000115HDFRRLA1' }` while `base` (lines 13-15) has `fechaNacimiento: '1985-03-12'`, `sexo: 'M'`. The CURP encodes `000115`/`H` at positions 5-10/11 — both mismatch. Without the fix this test flips to `success:false`. The proposed override (`fechaNacimiento: '2000-01-15'`, `sexo: 'H'`) makes `slice(4,10)='000115'` == `'00'+'01'+'15'` and `charAt(10)='H'` == `'H'`. Verified by hand; the fix is exact.
- **The guard is genuinely necessary and correctly placed.** `curp` runs `.transform(toUpperCase).pipe(regex)` (`schemas.js:43-44`). In Zod v3 the object-level `superRefine` still executes when a piped field fails its regex, so `data.curp` arrives uppercased-but-possibly-invalid. Re-testing `CURP_REGEX.test(data.curp)` before `.slice()/.charAt()` is the right defense against both duplicate issues and short-string indexing.
- **Error-pipeline reuse claim is accurate.** `errorHandler.js:11` does `err.errors.map((e) => ({ campo: e.path.join('.'), mensaje: e.message }))`, so a custom issue with `path: ['curp']` surfaces as `{ campo: 'curp', mensaje }` at 422 with zero middleware changes — exactly as claimed.
- **Scope discipline.** `esquemaDatosPersonales` is referenced only in `schemas.js` (definition + `esquemasPorFase:96`) and consumed once at `registros.js:59` — confirming the single-consumer premise. No century-differentiator creep (Pitfall 3 respected), no route-handler logic, no `new Date()` parsing.
- **The `NE` skip test is meaningfully discriminating**, not tautological: with `base.curp` sex letter `'M'` and `sexo:'NE'`, the test only passes *because* the skip exists (otherwise `'M' !== 'NE'` would reject), and its second assertion confirms the birthdate check still fires under `NE`.

### 3. Concerns

- **[MEDIUM] The `path: ['curp']` attribution is asserted as a must-have but never tested.** The frontmatter `must_haves.truths` and Task 1 `<behavior>` both require the issue land on `path: ['curp']`, yet every test case in Task 2 asserts only `r.success === false`. If a future edit changed `path` to `['fechaNacimiento']` or dropped it, the suite would stay green. Since `manejadorErrores` derives `campo` directly from `path` (`errorHandler.js:11`), the field-level-error success criteria (#1, #2) are only *partially* locked. Add one assertion, e.g. `assert.equal(r.error.issues[0].path[0], 'curp')`, to at least one rejection case.

- **[MEDIUM] The single-issue guard (Pitfall 1) is a stated behavior with no regression test.** Task 1 `<behavior>` promises a format-invalid CURP "still yields exactly one `curp` issue, not two." No test asserts issue *count*. The existing `rechaza CURP con diferenciador...` test (`curp.test.js:32-41`) only checks `success === false`. The guard is the plan's single most subtle piece of logic; if someone later removes the early-return, nothing fails. Consider asserting `r.error.issues.length === 1` (or filtering issues on `campo:'curp'`) for a format-invalid input.

- **[LOW] The threat model overstates enforcement coverage.** T-03-01 asserts "no folio-creation path bypasses `esquemaDatosPersonales`." The user flow is transitively safe — `datos_personales` can only enter a draft via `PUT .../fase/:faseId` which runs `esquema.parse` (`registros.js:59`) — but the folio-issuing `enviar` endpoint itself does **not** re-validate; it copies `draft.datos.datos_personales` straight into `crearRegistro` (`registros.js:97-124`). Two other paths write records without the schema: the seed script (`seed/sembrar.js:96`) and the opt-in legacy handler (`app.js:24`, `index.js:10`, `legacy/registro_viejo.js`). All are out of scope, but the claim as worded ("no path bypasses") is imprecise — the accurate statement is "the standard patient flow enforces it at phase-save time."

- **[LOW] A payload mismatching both date *and* sex raises two `curp` issues.** Both `if` blocks in the refinement can fire independently, producing two `detalles` entries with `campo:'curp'`. This is not a bug (still a 422 rejection) and matches Pitfall 1's guard intent only for the *format-invalid* case, not the double-*semantic*-mismatch case. Worth a one-line awareness note; no code change needed unless the client de-dupes errors by `campo`.

### 4. Suggestions

- Add a `path`/`campo === 'curp'` assertion to the sex-mismatch test (closes Concern 1, directly supports success criterion #2's "field-level" wording).
- Add an issue-count assertion on a format-invalid CURP input to lock the guard (closes Concern 2).
- Reword T-03-01's mitigation to "enforced at phase-save time in the standard flow; `enviar` trusts already-validated draft data" — more defensible and still accurate.
- Optional: the NE test comment could note *why* `base.curp`'s `M` sex letter makes the skip observable, so a future reader doesn't "simplify" the fixture and silently defeat the test.

### 5. Risk Assessment

**Overall: LOW.**

Justification: two-file, additive-only change on a stable Zod v3 API; the trickiest failure modes (fixture regression, guard-less double-issue) were identified in research and are handled in the plan; verification gates (`npm test`, `npm run build`) are correct. Residual risk is confined to *test completeness* — the suite proves the feature rejects/accepts correctly but under-specifies two behaviors the plan itself calls must-haves (field attribution, single-issue guard). These are test-coverage gaps, not design flaws, and none threaten the phase goal or the compatibility constraint. Nothing here should block execution; folding the two suggested assertions in during Task 2 would fully close the gap.

---

## Consensus Summary

Single grounded reviewer (separate headless Claude session, Opus model, full repo access) — findings below are that reviewer's verdict, not multi-vendor consensus (see `reviewer_note`).

### Agreed Strengths

- Plan is source-grounded and arithmetically verified (fixture fix, guard placement, error-pipeline reuse all confirmed against `file:line` evidence).
- Scope discipline: two files, additive-only, no API/data-structure changes, no new dependencies.

### Agreed Concerns

1. **[MEDIUM]** `path: ['curp']` attribution declared as must-have but untested — add a `path[0] === 'curp'` assertion to at least one rejection test.
2. **[MEDIUM]** Single-issue guard behavior untested — add an issue-count assertion for a format-invalid CURP.
3. **[LOW]** Threat model T-03-01 wording overstates coverage — reword to "enforced at phase-save time in the standard flow" (seed/legacy/enviar paths don't re-validate, all out of scope).
4. **[LOW]** Double-semantic-mismatch produces two `curp` issues — acceptable; document as known behavior.

### Divergent Views

None (single reviewer).
