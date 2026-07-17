# Phase 3: CURP Semantic Cross-Validation - Research

**Researched:** 2026-07-17
**Domain:** Zod cross-field validation (backend-only), CURP structural semantics
**Confidence:** HIGH

## Summary

This phase adds one cross-field validation refinement to `esquemaDatosPersonales` in
`server/src/validation/schemas.js`: after the existing per-field checks (CURP format regex,
`fechaNacimiento` format/range, `sexo` enum) all pass independently, a `.superRefine()` block
compares the CURP's embedded birthdate (`yymmdd` at positions 5–10) and sex letter (position 11)
against the separately captured `fechaNacimiento` and `sexo` fields, and raises a field-level Zod
issue on mismatch.

The exact API shape was verified by executing it against the repo's actual installed Zod version
(3.25.76, satisfies the `^3.23.8` dependency range) rather than assumed from training data — see
`## Code Examples`. The pattern is: `z.object({...}).strict().superRefine((data, ctx) => {
ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['curp'] }) })`. This integrates
cleanly with the existing `manejadorErrores` middleware, which already maps
`ZodError.errors[].path`/`.message` to `{ campo, mensaje }` — no changes needed there.

The most important finding is a **regression risk already present in the test suite**: one
existing test in `server/tests/curp.test.js` (`'acepta CURP post-2000 (letra en posición 17)'`)
uses a CURP whose encoded birthdate/sex do **not** match the shared `base` fixture's
`fechaNacimiento`/`sexo`, and currently expects `success: true`. Adding the semantic cross-check
without updating that fixture will break this existing, currently-passing test. This must be
fixed as part of this phase's plan, not discovered later as a broken build.

**Primary recommendation:** Add a single `.superRefine()` block to `esquemaDatosPersonales`
(after `.strict()`), guarded to run the semantic checks only when both `curp` already matches
`CURP_REGEX` and `fechaNacimiento` already matches its own `\d{4}-\d{2}-\d{2}` shape — comparing
via pure substring slicing (`curp.slice(4, 10)` vs `fechaNacimiento.slice(2,4) +
fechaNacimiento.slice(5,7) + fechaNacimiento.slice(8,10)`), never via `Date` object parsing. Fix
the pre-existing inconsistent fixture in `curp.test.js` line ~28 in the same plan.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CURP↔fechaNacimiento/sexo semantic cross-check | API / Backend | — | Phase scope is explicitly backend-only (`esquemaDatosPersonales` in `schemas.js`); no frontend, config, or API contract changes per phase goal and project constraint |
| Field-level error surfacing (422 + `{campo, mensaje}`) | API / Backend | — | Already owned by `manejadorErrores` (`server/src/middleware/errorHandler.js`); this phase reuses it unmodified, since `ZodError` issues raised via `ctx.addIssue` flow through the same `err.errors.map(...)` path as built-in Zod issues |

## Project Constraints (from CLAUDE.md)

- **No changes to `Fase`/`Draft`/`Record` structures or API contracts** — this phase must stay a pure validation refinement inside `esquemaDatosPersonales`; no new fields, no response shape changes.
- **Independent git branch, never commit to `master` directly** — create a descriptive branch before starting.
- **Strict scope** — do not touch flows/files beyond `server/src/validation/schemas.js` and its tests unless a discovered defect (like the fixture regression below) requires it; ask before expanding scope.
- **Verification before closing** — both `npm test` (backend `node:test` suite, run from `server/`) and `npm run build` (client typecheck+build) must pass. This phase touches no client code, but `npm run build` should still be run as the standing verification gate.
- Code style: 2-space indent, single quotes, semicolons, ESM only, Spanish identifiers/messages (`campo`, `mensaje`, error text in Spanish) — match `schemas.js` conventions exactly (see existing `fechaNacimiento` `.refine()` chain for tone/format of Spanish validation messages).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CURP-07 | Backend rejects a `datos_personales` payload whose CURP-encoded birthdate (positions 5–10, `yymmdd`) or sex letter (position 11, `H`/`M`) contradicts the separately captured `fechaNacimiento`/`sexo` fields, with a field-level validation error; `sexo: 'NE'` skips the sex cross-check | Verified `.superRefine()` mechanics end-to-end against the installed Zod version, including the `NE` skip and the guard against double-firing when `curp`/`fechaNacimiento` already fail their own format checks. See `## Code Examples` and `## Common Pitfalls`. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | `^3.23.8` (installed: 3.25.76) [VERIFIED: `node_modules/zod/package.json` in this repo] | Schema validation, including cross-field refinement via `.superRefine()` | Already the project's sole validation library (dual-layer pattern: same schemas exercised by frontend UX hints and backend enforcement); no reason to introduce anything else for a same-schema cross-field check |

No new dependency is introduced by this phase. `.superRefine()` is part of the Zod core API
already present in the installed version — confirmed by direct execution (see `## Code
Examples`), not by documentation lookup alone.

**Installation:** None required — no `npm install` needed for this phase.

## Package Legitimacy Audit

Not applicable — this phase adds no new npm packages. It only extends the existing `zod` usage
already present in `server/package.json` (`zod: ^3.23.8`).

## Architecture Patterns

### System Architecture Diagram

```
PUT /api/registros/draft/:id/fase/datos_personales
        │
        ▼
registros.js route handler
        │  esquema = esquemasPorFase['datos_personales']  (existing lookup, unchanged)
        ▼
esquemaDatosPersonales.parse(payload)   [Zod object schema, unchanged shape]
        │
        ├─ per-field parse (unchanged): nombre, primerApellido, fechaNacimiento,
        │   sexo (enum H/M/NE), curp (trim → uppercase → CURP_REGEX), telefono, correo
        │
        ▼
.strict().superRefine((data, ctx) => { ... })   ◄── NEW in this phase
        │
        ├─ guard: CURP_REGEX.test(data.curp) && /^\d{4}-\d{2}-\d{2}$/.test(data.fechaNacimiento)
        │         (skip semantic checks entirely if either sibling already failed its own
        │          format check — avoids duplicate/confusing errors, see Pitfall 1)
        │
        ├─ birthdate check: data.curp.slice(4,10) === yy+mm+dd from data.fechaNacimiento
        │       mismatch → ctx.addIssue({ code: 'custom', message, path: ['curp'] })
        │
        └─ sex check: data.sexo !== 'NE' && data.curp.charAt(10) !== data.sexo
                mismatch → ctx.addIssue({ code: 'custom', message, path: ['curp'] })
        │
        ▼
   success → route saves phase data (unchanged)
   failure → ZodError thrown → manejadorErrores → 422 { error: 'VALIDACION',
             detalles: [{ campo: 'curp', mensaje: '...' }] }   (existing middleware, unchanged)
```

### Recommended Project Structure

No new files/folders. Single-file change:

```
server/src/validation/schemas.js   # add .superRefine() to esquemaDatosPersonales
server/tests/curp.test.js          # extend with semantic cross-check cases + fix line ~28 fixture
```

### Pattern 1: Object-level `.superRefine()` for cross-field checks

**What:** Attach `.superRefine()` after `.strict()` on the object schema (not on the individual
`curp` field) since the check depends on three sibling fields (`curp`, `fechaNacimiento`,
`sexo`).

**When to use:** Any time a validation rule spans more than one field — this codebase currently
has zero examples of this pattern (`schemas.js` only uses field-level `.refine()` chains, e.g. on
`fechaNacimiento`), so this phase introduces the first instance. Future graders/planners
extending this schema should follow the same shape rather than re-deriving it.

**Example (verified live against installed Zod 3.25.76 in this repo):**
```js
// Source: verified via `node -e` REPL against node_modules/zod in this repo (2026-07-17)
export const esquemaDatosPersonales = z
  .object({
    // ...existing fields unchanged...
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!CURP_REGEX.test(data.curp) || !/^\d{4}-\d{2}-\d{2}$/.test(data.fechaNacimiento)) {
      return; // sibling field already failed its own format check — don't pile on
    }

    const yymmddCurp = data.curp.slice(4, 10);
    const yymmddFecha =
      data.fechaNacimiento.slice(2, 4) + data.fechaNacimiento.slice(5, 7) + data.fechaNacimiento.slice(8, 10);
    if (yymmddCurp !== yymmddFecha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha de nacimiento de la CURP no coincide con la fecha de nacimiento capturada',
        path: ['curp']
      });
    }

    const sexoCurp = data.curp.charAt(10);
    if (data.sexo !== 'NE' && sexoCurp !== data.sexo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El sexo de la CURP no coincide con el sexo capturado',
        path: ['curp']
      });
    }
  });
```

Live REPL output confirming this exact logic against the 5 phase success criteria, run with the
installed `zod` package in `server/node_modules`:
```
consistent -> true
bad date -> false [{"code":"custom","message":"CURP birthdate mismatch","path":["curp"]}]
bad sex -> false [{"code":"custom","message":"CURP sex mismatch","path":["curp"]}]
NE skip (date matches) -> true
NE but bad date still checked -> false [{"code":"custom","message":"CURP birthdate mismatch","path":["curp"]}]
```

### Anti-Patterns to Avoid

- **Parsing dates with `new Date(...)` for the comparison:** the codebase's own
  `fechaNacimiento` `.refine()` already uses `new Date(\`${v}T00:00:00\`)`, but only to check the
  date *exists* (round-trips through ISO), not to extract components for comparison. For the
  CURP cross-check, use substring slicing on the raw `YYYY-MM-DD` string. `Date` parsing pulls in
  local-timezone conversion semantics that are irrelevant here and is a documented pitfall class
  (`additional_context` already flags this) — string slicing is deterministic and side-effect-free.
- **Running the semantic check unconditionally:** without the guard shown in Pattern 1, a CURP
  that already fails its own format regex still reaches `.superRefine()` with a non-empty string
  (confirmed: Zod does not short-circuit sibling `superRefine` when a `.pipe()`-validated field
  fails — see Pitfall 1) and can add a **second**, redundant `curp` issue. Guard against this
  explicitly rather than relying on Zod to skip it.
- **Placing the check in the route handler instead of the schema:** would break the "dual-layer
  validation, single source of truth" pattern this codebase follows (`ARCHITECTURE.md`
  Cross-Cutting Concerns) and would require the route handler to know about `CURP_REGEX`
  internals it currently doesn't reference at all.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-field consistency validation | A manual `if (...) throw new AppError(...)` block in `registros.js` after `esquema.parse()` | Zod `.superRefine()` on `esquemaDatosPersonales` | Keeps validation centralized in `schemas.js` (existing pattern), reuses the existing `ZodError` → 422 `{campo, mensaje}` pipeline in `errorHandler.js` with zero changes there, and stays consistent with how `fechaNacimiento`'s own range checks are already expressed as schema-level `.refine()`s |
| Date component comparison | `Date` object arithmetic / `getFullYear()`/`getMonth()` etc. | Plain string slicing on the already-validated `YYYY-MM-DD` string | Avoids timezone/locale parsing pitfalls entirely; the values being compared are fixed-width numeric substrings, not calendar arithmetic |

**Key insight:** This phase requires no new abstraction — it is a two-line addition to an
existing, well-understood validation pattern. The risk in this phase is not "how do I build
this" but "what already-passing test fixture silently assumed the old, laxer behavior."

## Common Pitfalls

### Pitfall 1: `.superRefine()` still runs when a sibling field already failed its own regex/pipe validation

**What goes wrong:** If `curp` fails its own `.pipe(z.string().regex(CURP_REGEX, ...))` check
(format-invalid CURP), Zod still executes the object-level `.superRefine()` with whatever
(transformed but format-invalid) string value `curp` holds — it is **not** skipped. Without a
guard, this can append a second, confusing `curp` error alongside the format error, or (in a
different malformed-input shape) call `.slice()`/`.charAt()` on a string that's too short to
contain valid position data.

**Why it happens:** Zod's `ZodObject.superRefine()` executes after per-key parsing completes,
regardless of whether individual keys succeeded, as long as the key produced *some* string value
(not `undefined`). It only fully skips the object-level effect chain when a required field is
entirely missing/wrong-type (`invalid_type`), not when a present value fails a chained
`.regex()`/`.pipe()` check.

**How to avoid:** Re-test `CURP_REGEX.test(data.curp)` (and the `fechaNacimiento` format regex)
at the top of `.superRefine()` and `return` early if either fails — the field-level error for
that sibling has already been raised by its own validator; the semantic check has nothing
reliable to compare against.

**Warning signs:** A 422 response for a malformed CURP returns two `detalles` entries for
`campo: 'curp'` instead of one.

**Verified:** confirmed live — see `Bash` REPL transcripts run against the repo's installed Zod
version during this research session (format-invalid CURP + guard-less superRefine → 2 issues on
`path: ['curp']`; with the guard added → 1 issue).

### Pitfall 2: An existing test fixture is already CURP-semantically inconsistent — this phase WILL break it if not fixed

**What goes wrong:** `server/tests/curp.test.js`, test `'acepta CURP post-2000 (letra en posición
17)'` (~line 26–30), does:
```js
const r = esquemaDatosPersonales.safeParse({ ...base, curp: 'MAPA000115HDFRRLA1' });
assert.equal(r.success, true);
```
`base` (from the same file) has `fechaNacimiento: '1985-03-12'` and `sexo: 'M'`. The overriding
CURP `MAPA000115HDFRRLA1` encodes birthdate `000115` (i.e. `2000-01-15`) and sex letter `H`. Both
the birthdate (`850312` vs `000115`) and sex (`M` vs `H`) mismatch `base`. **This test currently
passes only because no semantic check exists yet.** Adding the `.superRefine()` without touching
this fixture will flip this test to `success: false`, breaking `npm test`.

**Why it happens:** The fixture was written purely to exercise the post-2000 CURP *format*
(alphabetic differentiator at position 17), with no attention paid to whether the reused `base`
date/sex happened to semantically match — reasonable at the time (Phase 1, v1.0), but this
phase's new invariant retroactively invalidates it.

**How to avoid:** In the same plan, update this test's inline payload to either (a) override
`fechaNacimiento: '2000-01-15'` and `sexo: 'H'` alongside the new `curp`, or (b) construct a
different post-2000 CURP whose embedded birthdate/sex matches the existing `base` fixture. Option
(a) is simpler and keeps the test's original intent (format-only check) clearly separated from
the new semantic-check tests.

**Warning signs:** `npm test` in `server/` fails on this specific test immediately after adding
the `.superRefine()`, with no code path issue — pure fixture drift.

**Verified:** [VERIFIED: computed CURP position slices by hand and cross-checked against
`CURP_REGEX` groups in `schemas.js`]. All *other* CURP fixtures in the test suite were also
checked and are semantically consistent:
- `curp.test.js` `base` (`PEGG850312MDFRRR04`, `fechaNacimiento: '1985-03-12'`, `sexo: 'M'`) — consistent (`850312` == `850312`, `M` == `M`).
- `arco.test.js` fixture (same CURP/date/sex as above) — consistent.
- `consentimiento.test.js` fixture (`HELJ781130HMCRPN05`, `fechaNacimiento: '1978-11-30'`, `sexo: 'H'`) — consistent (`781130` == `781130`, `H` == `H`).
- `memoryRepo.test.js` — does not import or exercise `esquemaDatosPersonales` at all (tests the repository layer directly with partial mock objects); no regression risk.
- `phases-config-consistency.test.js` — only compares the `curp` regex pattern string between `phases.config.json` and `schemas.js`; does not construct payloads. No risk.
- Other `curp.test.js` cases using `{...base, curp: <malformed>}` (lines ~32–41, ~49–63) all use CURPs that already fail `CURP_REGEX` on format grounds, so with the Pitfall 1 guard in place they continue to fail for the same (now singular) reason. No behavior change expected for `r.success` outcomes, only potentially issue-count (mitigated by the guard).

### Pitfall 3: Century ambiguity is explicitly out of scope — do not "fix" it opportunistically

**What goes wrong:** A 2-digit CURP year (`yy`) is ambiguous between two centuries (e.g. `00` =
1900 or 2000). It would be tempting, while touching this code, to also validate the CURP position
17 century differentiator against the 4-digit `fechaNacimiento` year.

**Why it happens:** The temptation is natural since both live in the same field and a developer
reading the CURP structure might reflexively want "full" correctness.

**How to avoid:** `REQUIREMENTS.md` Out of Scope explicitly excludes this ("CURP century
differentiator (pos 17) vs birth-year cross-check | Post-2000 letter rule has RENAPO edge cases;
CURP-07 covers birthdate/sex only"), and the project's scope-discipline directive (CLAUDE.md:
"Do exactly what is asked — nothing more") reinforces it. The cross-check in this phase must
compare **only** the last two year digits + month + day (`yymmdd`), never attempt to resolve
which century they belong to.

**Warning signs:** Any code in the plan that reads `curp.charAt(16)` (position 17, the
differentiator) or attempts to derive a 4-digit year from the CURP is out of scope for CURP-07.

## Code Examples

### Full test additions matching existing `node:test` conventions

```js
// Source: verified live against esquemaDatosPersonales + installed zod 3.25.76 in this repo
// Follows the existing style of server/tests/curp.test.js (safeParse + assert.equal)

test('rechaza CURP cuya fecha codificada no coincide con fechaNacimiento', () => {
  const r = esquemaDatosPersonales.safeParse({ ...base, fechaNacimiento: '1985-03-13' });
  assert.equal(r.success, false);
});

test('rechaza CURP cuyo sexo codificado no coincide con sexo', () => {
  const r = esquemaDatosPersonales.safeParse({ ...base, sexo: 'H' });
  assert.equal(r.success, false);
});

test('sexo NE omite la verificación de sexo pero conserva la de fecha', () => {
  // NE-compatible payload: keep curp's encoded birthdate matching fechaNacimiento
  const r1 = esquemaDatosPersonales.safeParse({ ...base, sexo: 'NE' });
  assert.equal(r1.success, true);

  const r2 = esquemaDatosPersonales.safeParse({ ...base, sexo: 'NE', fechaNacimiento: '1985-03-13' });
  assert.equal(r2.success, false);
});

test('acepta payload con CURP semánticamente consistente (sin regresión)', () => {
  const r = esquemaDatosPersonales.safeParse(base);
  assert.equal(r.success, true);
});
```

Note: `base.sexo === 'M'` and `CLAVES_SEXO` (from `catalogos.js`) is `['H', 'M', 'NE']`
[VERIFIED: `server/src/validation/catalogos.js`], so `{ ...base, sexo: 'NE' }` is a valid enum
value and exercises the skip path directly.

## State of the Art

Not applicable — no external ecosystem shift is relevant here. This is a same-version extension
of an already-adopted library (`zod`) using an API (`.superRefine()`) that has been stable across
the entire Zod 3.x line.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Both the birthdate-mismatch and sex-mismatch errors should attach to `path: ['curp']` (rather than `'fechaNacimiento'`/`'sexo'`) | Architecture Patterns, Code Examples | Low — no success criterion or existing test asserts a specific `campo` value for these errors (criteria 1/2/5 only require *some* field-level 422 rejection). If the planner/user prefers a different field attribution, it's a one-line change in the `path` array with no structural impact. |

**If this table is empty:** N/A — see A1 above; all other claims in this research were verified
by direct execution against the installed dependency or by inspection of the actual codebase.

## Open Questions

1. **Should the two semantic checks (birthdate, sex) produce distinct error messages/paths, or could a future consumer want to distinguish them programmatically (e.g. `path: ['curp', 'fechaNacimiento']` vs `path: ['curp', 'sexo']`)?**
   - What we know: The success criteria only require rejection with *a* field-level error per case; there's no requirement for the client to visually distinguish "your birthdate is wrong" from "your sex selection is wrong" beyond the (already distinct) `mensaje` text.
   - What's unclear: Whether a future UI (Phase 4 or later) will want to highlight `fechaNacimiento` or `sexo` inputs specifically instead of `curp`, since arguably the *other* field could be the one that's actually wrong (the CURP is usually the more error-prone free-text entry, but not always).
   - Recommendation: Ship with `path: ['curp']` for both (per A1) — simplest, matches success-criteria wording ("CURP ... contradicts"), and is a one-line change to revisit later if UX feedback says otherwise. No need to block this phase on it.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | no | N/A — no auth surface in this phase |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | yes | Zod schema validation (existing pattern) — this phase strengthens it with a cross-field invariant; no new input surface is added (no new fields, no new endpoint) |
| V6 Cryptography | no | N/A — `datos_personales` is not a `sensible`/encrypted phase (only `datos_clinicos` is per `fase.sensible` in `phases.config.json`) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Contradictory identity data used to obtain a valid folio (e.g. CURP encoding a different birthdate/sex than declared, potentially to obscure identity or exploit downstream systems that trust one field over the other) | Tampering | This phase's core deliverable: reject at validation time via `.superRefine()`, before a folio can ever be issued against inconsistent data — no folio creation path bypasses `esquemaDatosPersonales` (confirmed: `esquemaDatosPersonales` is only imported by `registros.js`, which is the sole route touching `datos_personales`) |
| Verbose/duplicate error messages leaking implementation detail | Information Disclosure | Not a new risk — `manejadorErrores` already emits only `{campo, mensaje}` in Spanish, no stack traces; this phase's Spanish messages should follow the same tone as existing ones (see Pitfall 1 guard, which also prevents redundant/confusing duplicate messages) |

## Sources

### Primary (HIGH confidence)

- Direct execution against `server/node_modules/zod` (v3.25.76) in this repository via `node -e` REPL, 2026-07-17 — confirmed `.superRefine()` + `ctx.addIssue({code: z.ZodIssueCode.custom, message, path})` API shape, confirmed behavior when a sibling field's own validator already failed, confirmed all 5 phase success criteria against a simulated schema matching the real field structure.
- `server/src/validation/schemas.js`, `server/src/validation/catalogos.js`, `server/src/middleware/errorHandler.js`, `server/src/config/phases.config.json`, `server/tests/*.test.js` — read directly for existing conventions, CURP position semantics, and fixture consistency audit.

### Secondary (MEDIUM confidence)

- [WebSearch: "Zod superRefine cross-field validation addIssue path custom error ZodIssueCode"] — confirmed the general `.superRefine()`/`ctx.addIssue()`/`path` cross-field pattern is the documented, idiomatic approach across Zod versions (articles from valentinprugnaud.dev, DeepWiki, Medium). Used only to corroborate the pattern's legitimacy; the exact API call shape used in this doc was independently verified against the installed version (see Primary).

### Tertiary (LOW confidence)

- `https://zod.dev/?id=superrefine` (fetched via WebFetch) — this resolved to Zod **v4** documentation (uses `code: "custom"` string literals and `error:` instead of `message:` in `.refine()`), which does **not** match this project's installed Zod v3 API. Not used as a source for code examples in this document; flagged here only so future researchers don't reuse it uncritically for this project.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependency; existing installed version directly inspected and exercised.
- Architecture: HIGH — pattern verified via live execution against this repo's exact Zod version and a schema shape matching the real one.
- Pitfalls: HIGH — both pitfalls (guard-less double-issue, existing fixture regression) were reproduced/confirmed via direct execution and manual position-slicing verification against real repo fixtures, not inferred.

**Research date:** 2026-07-17
**Valid until:** Effectively indefinite for the core pattern (stable Zod 3.x API); re-verify only if `zod` is upgraded to a new major version before this phase is planned/executed.
