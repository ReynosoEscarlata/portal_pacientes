# Phase 2: Frontend CURP Consistency & Test Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-15
**Phase:** 2-Frontend CURP Consistency & Test Infrastructure
**Areas discussed:** npm test en la raíz, Entorno y ubicación de Vitest, Estrategia de prueba del patrón CURP, Casos límite del enmascarado

---

## npm test en la raíz

Research (advisor agent) compared 5 options; presented top 3 (2 dropped: `npm-run-all2`, npm workspaces — both flagged as weak fits for a 2-target monorepo with no CI).

| Option | Description | Selected |
|--------|-------------|----------|
| Mantener separado | `npm test` stays backend-only; add a separate client test script | ✓ |
| Merge secuencial (`&&`) | `npm --prefix server test && npm --prefix client test` | |
| concurrently | Reuse existing `concurrently` dep, parallel run with colored output | |

**User's choice:** Mantener separado (recommended option).
**Notes:** `.claude/CLAUDE.md` explicitly documents `npm test` as the backend suite; merging would require updating that doc in the same change. No CI depends on this repo's `npm test`, so scope drift risk is purely documentation-level.

---

## Entorno y ubicación de Vitest

Two sub-decisions researched together.

### Simulador de DOM

| Option | Description | Selected |
|--------|-------------|----------|
| jsdom | Mature (10+ yrs), ~75M weekly downloads, standard with RTL | |
| happy-dom | 2-10x faster, younger (~4.5k stars), documented-incomplete DOM API | ✓ |
| Híbrido | happy-dom default + per-file jsdom override | |

**User's choice:** happy-dom (not the recommended jsdom).
**Notes:** User accepted the trade-off knowingly after the research flagged happy-dom's incomplete API surface as a risk for the later Testing Library component test. Fallback path (per-file `jsdom` override) noted as an escape hatch if needed during execution.

### Ubicación de archivos

| Option | Description | Selected |
|--------|-------------|----------|
| Co-localizados | `client/src/**/*.test.tsx`, standard Vite/Vitest convention | ✓ |
| Carpeta espejo `client/tests/` | Imitates `server/tests/`, but that folder isn't a real structural mirror | |

**User's choice:** Co-localizados (recommended option).

---

## Estrategia de prueba del patrón CURP

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Exportar `validarCampo` | Pure-function unit test, minimal harness, small production code change | |
| (b) Render completo con Testing Library | Full-fidelity form test, requires mocking `WizardContext` for the first time | ✓ |
| (c) Probar solo el regex de config | Zero production changes, mirrors backend test style, weakest match to success criterion | |

**User's choice:** (b) Render completo con Testing Library + user-event (not the leaner (a) or (c)).

**Follow-up:** Since (b) requires a `WizardContext` mock harness — the first component-test infrastructure in the repo — asked whether to build it as reusable test-utils or keep it inline for this one test.

| Option | Description | Selected |
|--------|-------------|----------|
| Inline, solo para este test | Mock defined inside the PhaseRenderer test file only | |
| Reutilizable (test-utils compartido) | Shared `renderConProvider()`-style helper for future component tests | ✓ |

**User's choice:** Reutilizable — build shared test-utils now.
**Notes:** User explicitly chose the higher-cost, higher-fidelity path over both cheaper alternatives, and then explicitly chose to invest further by making the harness reusable rather than a one-off.

---

## Casos límite del enmascarado

| Option | Description | Selected |
|--------|-------------|----------|
| Solo caso feliz | 1 test: 18-char CURP → 4 visible + 14 asterisks | |
| Feliz + vacío | Adds empty-string branch coverage | |
| Feliz + vacío + aserción anti-reversión explícita | Adds a redundant but self-documenting `assert.notEqual` | |
| Matriz completa de límites | Adds short (<4 char) and exactly-4-char CURP cases | ✓ |

**User's choice:** Matriz completa de límites (not the recommended "feliz + vacío").

**Follow-up clarification:** Research found the short/4-char cases mathematically do NOT distinguish the bug (`slice(0,5)`) from the fix (`slice(0,4)`) — both produce identical output at those lengths. Asked the user how to treat this once flagged.

| Option | Description | Selected |
|--------|-------------|----------|
| Incluirlos igual, como hardening documentado | Kept, explicitly labeled as non-regression hardening cases, not anti-reversion coverage | ✓ |
| Quitarlos, quedarnos con feliz + vacío | Drop them since they don't protect against the actual bug | |

**User's choice:** Incluirlos igual, como hardening documentado.
**Notes:** User confirmed they understand these cases don't protect against the specific reported regression — included anyway to document current function behavior at short/malformed input lengths. CONTEXT.md instructs the plan to make this distinction explicit in the test file (comment or separate `describe` block).

---

## Claude's Discretion

- Exact file/folder naming for the new `test-utils` harness and the root convenience test script name.
- Whether to exclude `*.test.tsx` from `tsc --noEmit` via `tsconfig.json` or rely on Vitest's own type-checking.
- Exact CURP fixture values for new test cases (reuse existing `server/tests/` fixtures where it aids frontend/backend cross-reference).

## Deferred Ideas

- Extracting `validarCampo` to a shared, exported/testable util — the road not taken in favor of (b) full component rendering.
- npm workspaces for the monorepo — surfaced during `npm test` research, flagged as out of scope structural change.
- RFC implementation, CURP semantic cross-validation — already out of scope per `PROJECT.md` / `REQUIREMENTS.md`.
