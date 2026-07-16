# Phase 2: Frontend CURP Consistency & Test Infrastructure - Research

**Researched:** 2026-07-15
**Domain:** Vitest + React Testing Library setup for an existing Vite/React 18/TypeScript client with zero prior test tooling; CURP masking bug fix; frontend/backend regex sync
**Confidence:** HIGH

## Summary

This phase touches two tiny, well-understood bug fixes (`enmascararCurp` off-by-one slice, and a loose `pattern` string in `phases.config.json`) and one substantial piece of new infrastructure: the client's first-ever test runner. The bug fixes are trivial once grounded in the actual code (verified below). The infrastructure work carries the real risk, concentrated in two places that CONTEXT.md's decisions (D-01–D-06) already narrowed down but did not fully resolve:

1. **Version compatibility:** The client pins `vite@^5.4.8`. Vitest's newest major (4.x, currently 4.1.10) requires `vite ^6.0.0 || ^7.0.0 || ^8.0.0` and will NOT install cleanly against this project's Vite version. **Vitest 3.2.7 is the correct choice** — it depends on `vite ^5.0.0 || ^6.0.0 || ^7.0.0-0`, matching the existing pin exactly `[VERIFIED: npm registry]`.
2. **The `WizardContext.Provider` harness is more constrained than D-05's wording implies.** `WizardContext.tsx` exports only `WizardProvider` (a component that fetches real config via `fetch`/`api.obtenerConfig()`) and `useWizard` (a hook) — the raw `WizardContext` object and the `WizardContextValor` interface are **not exported** `[VERIFIED: codebase read]`. Literally rendering `<WizardContext.Provider value={mock}>` is impossible without a source change to `WizardContext.tsx`, which is out of scope (not listed in CONTEXT.md's "Code to change"). The correct, zero-source-change pattern is `vi.mock('.../WizardContext')` + `vi.mocked(useWizard).mockReturnValue(...)`, typed via `ReturnType<typeof useWizard>` (works without exporting `WizardContextValor`, since TypeScript can derive the type structurally). This is detailed in Pattern 1 below.

**Primary recommendation:** Use Vitest `^3.2.7` (not latest 4.x) + `happy-dom` (locked, D-02) + `@testing-library/react@^16.3.2` + `@testing-library/user-event@^14.6.1` + `@testing-library/jest-dom@^6.9.1`, all verified current on the npm registry. Build the reusable harness around `vi.mock` of the `useWizard` hook, not around exporting `WizardContext` — this keeps the phase's file-change list exactly as CONTEXT.md scoped it (no edits to `WizardContext.tsx`).

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Keep the root `npm test` scoped to backend only, unchanged (`npm --prefix server test`). Add a separate script for client tests (e.g. `npm run test:client`) rather than merging into the existing `npm test` contract. Do NOT touch the existing root `"test"` script's meaning.
- **D-02:** Use `happy-dom` as the DOM simulator (`environment: 'happy-dom'`), not `jsdom`. Accepted trade-off: younger/smaller ecosystem than jsdom, documented incomplete DOM API surface. Escape hatch: per-file `// @vitest-environment jsdom` override if `PhaseRenderer` component tests hit DOM API gaps, without abandoning `happy-dom` as project default.
- **D-03:** Co-locate test files next to source (`client/src/**/*.test.ts(x)`), not a mirrored `client/tests/` directory. `tsconfig.json`'s `"include": ["src"]` needs confirmation on whether `.test.tsx` needs excluding from `tsc --noEmit` (part of `npm run build`).
- **D-04:** Test CURP pattern validation via full component render: `@testing-library/react` + `@testing-library/user-event`, filling the CURP field in actual rendered `PhaseRenderer`, asserting error message appears/doesn't on submit. No changes to `validarCampo`'s visibility (stays unexported, un-refactored).
- **D-05:** Build the `WizardContext` mock/render harness as **reusable test infrastructure** (e.g. `client/src/test-utils/` — exact naming/location left to planner), sized for what THIS phase's test needs, not speculative future component shapes.
- **D-06:** Masking regression test must cover: (1) happy path — 18-char valid CURP → 4 visible + 14 asterisks, exact-equality, using `PEGG850312MDFRRR04` fixture cross-referenced with `server/tests/arco.test.js`; (2) empty string → `''`; (3) short/exactly-4-char CURP as **documented hardening cases**, explicitly labeled as NOT anti-regression coverage (both `slice(0,5)` bug and `slice(0,4)` fix produce identical output at those lengths).

### Claude's Discretion

- Exact file/folder naming for `test-utils` harness (D-05) and root convenience test script name (D-01).
- Whether to exclude `*.test.tsx` from `tsc --noEmit` via `tsconfig.json` exclude, or rely on Vitest's own type-checking — pick whichever keeps `npm run build` passing without excluding legitimate source files.
- Exact CURP fixture values for new test cases (must be valid per full backend `CURP_REGEX`) — reuse `PEGG850312MDFRRR04`-style values already in `server/tests/arco.test.js` and `server/tests/curp.test.js`.

### Deferred Ideas (OUT OF SCOPE)

- Extracting `validarCampo` to a shared, exported/testable util — considered, not chosen (D-04 picked full component rendering instead).
- npm workspaces for the monorepo — surfaced during `npm test` research as a long-term alternative to `--prefix` scripts; structural change beyond this phase's scope.
- RFC implementation, CURP semantic cross-validation — already out of scope per `PROJECT.md`/`REQUIREMENTS.md`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CURP-03 | `enmascararCurp` in `client/src/utils/mask.ts` masks all but first 4 chars (not 5) | Bug confirmed at `client/src/utils/mask.ts:5` (`slice(0, 5)`); one-line fix documented in Pitfall 1 / Code Examples |
| CURP-04 | Regression test exists for `enmascararCurp` (requires CURP-06) | Test cases and fixture strategy specified in D-06 and Code Examples; server-side precedent at `server/tests/arco.test.js:69` |
| CURP-05 | `curp` field `pattern` in `phases.config.json` matches corrected backend `CURP_REGEX` | Current loose pattern confirmed at `server/src/config/phases.config.json:17`; corrected regex source confirmed at `server/src/validation/schemas.js:4-5`; JSON-string escaping pitfall documented in Pitfall 2 |
| CURP-06 | `client/package.json` has working Vitest + Testing Library setup with initial tests | Full stack, versions, config shape, and harness pattern specified in Standard Stack / Architecture Patterns / Code Examples |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CURP masking (display) | Browser / Client | — | Purely a presentation concern; `enmascararCurp` runs entirely in `client/src/utils/mask.ts`, called from `Confirmacion.tsx` at render time. No server round-trip involved (server has its own independent, already-correct `server/src/utils/mask.js` for API responses). |
| CURP pattern validation (pre-submit) | Browser / Client | API / Backend | Frontend validation in `PhaseRenderer.tsx`'s `validarCampo` is a UX optimization (fail fast before network round-trip). The backend (`esquemaDatosPersonales` in `schemas.js`, already fixed in Phase 1) remains the authoritative validation layer — frontend pattern must mirror it, never replace it. |
| Test infrastructure (Vitest config, harness) | Browser / Client (dev tooling) | — | Client-only dev dependency; does not touch server test infra (`node:test`/Supertest), which remains untouched per D-01. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | `^3.2.7` | Test runner, assertion API, mocking (`vi.mock`/`vi.fn`) | De facto standard test runner for Vite projects; native ESM/TS support with zero extra transpile config; **NOT 4.x** — see Pitfall "Vitest 4 breaks the Vite 5 pin" below `[VERIFIED: npm registry]` |
| happy-dom | `^20.10.6` (locked by D-02) | DOM simulation environment for Vitest | User's explicit choice (D-02); faster than jsdom, documented trade-off already accepted `[VERIFIED: npm registry]` |
| @testing-library/react | `^16.3.2` | Component rendering (`render`, `screen`) for React 18 | Standard RTL peer for React 18/19; peer deps confirm React `^18.0.0 \|\| ^19.0.0` compatibility with project's React 18.3.1 `[VERIFIED: npm registry]` |
| @testing-library/user-event | `^14.6.1` | Realistic user interaction simulation (typing, clicking submit) | D-04 requires filling the CURP field and submitting the form — `userEvent` simulates real event sequences (focus, keydown, input, blur) more faithfully than `fireEvent` `[VERIFIED: npm registry]` |
| @testing-library/jest-dom | `^6.9.1` | DOM-specific matchers (`toBeInTheDocument`, etc.) for `expect()` | Needed for readable assertions on error messages (`role="alert"` elements) rendered by `Field.tsx` `[VERIFIED: npm registry]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitejs/plugin-react | `^4.3.1` (already installed) | JSX/TSX transform + Fast Refresh inside Vitest's Vite pipeline | Must be re-declared in `vitest.config.ts`'s own `plugins` array — Vitest does not automatically inherit `vite.config.ts`'s plugins when using a standalone config file (see Architecture Patterns) `[CITED: vitest.dev/config]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| happy-dom | jsdom (`^29.1.1` current) | jsdom is the safer/heavier default with a more complete DOM API and 21.6k GitHub stars vs. happy-dom's ~4.5k (per D-02's own research) — rejected by explicit user decision; kept as the documented per-file escape hatch (`// @vitest-environment jsdom`) if `PhaseRenderer` tests hit DOM gaps |
| vi.mock(WizardContext) harness | Export `WizardContext` + `WizardContextValor` and literally wrap in `<WizardContext.Provider>` | Would require a source change to `WizardContext.tsx` not listed in CONTEXT.md's scope; `vi.mock` achieves the same test isolation with zero production code changes (see Pattern 1) |
| Vitest's own coverage tooling (`@vitest/coverage-v8`) | Skip coverage entirely for this phase | Not requested by CONTEXT.md/PROJECT.md ("config + first tests only" constraint) — adding coverage reporting now would be scope creep; not installed in this phase |

**Installation:**
```bash
npm --prefix client install -D vitest@^3.2.7 happy-dom@^20.10.6 @testing-library/react@^16.3.2 @testing-library/user-event@^14.6.1 @testing-library/jest-dom@^6.9.1
```

**Version verification:** All five packages confirmed present on the npm registry with the exact versions above via `npm view <pkg> version` on 2026-07-15. `vitest`'s registry-latest is `4.1.10`, but that major requires Vite 6/7/8 — **do not install latest-tag blindly**; pin `^3.2.7` explicitly. Verified via `npm view vitest@3.2.7 dependencies.vite` → `^5.0.0 || ^6.0.0 || ^7.0.0-0`.

## Package Legitimacy Audit

| Package | Registry | Age (created) | Weekly Downloads | Source Repo | Verdict | Disposition |
|---------|----------|----------------|-------------------|--------------|---------|-------------|
| vitest | npm | 2021-12-03 (~4.6 yrs) | 72.7M | github.com/vitest-dev/vitest | SUS (heuristic: "too-new") | **Approved** — false positive: heuristic flags the *latest patch* publish date (2026-07-06, 9 days before this research), not package age. Package itself is 4.6 years old with 72.7M weekly downloads and an official repo. No `checkpoint:human-verify` needed; verified directly via `npm view vitest time.created`. |
| @testing-library/react | npm | (established) | 44.3M | github.com/testing-library/react-testing-library | OK | Approved |
| @testing-library/user-event | npm | (established) | 38.6M | github.com/testing-library/user-event | OK | Approved |
| @testing-library/jest-dom | npm | (established) | 50.1M | github.com/testing-library/jest-dom | OK | Approved |
| happy-dom | npm | 2019-09-15 (~7 yrs) | 10.8M | github.com/capricorn86/happy-dom | SUS (heuristic: "too-new") | **Approved** — same false positive pattern (latest patch published 2026-06-17); package is 7 years old. Additionally already a **locked user decision (D-02)** made with the trade-offs (younger ecosystem, smaller star count, incomplete DOM API surface) explicitly discussed and accepted — not a fresh choice to gate. |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `vitest`, `happy-dom` — both cleared above with concrete evidence (registry `time.created` + download counts + official repos) rather than gated behind a runtime checkpoint. No `checkpoint:human-verify` task is needed for these two; the "too-new" signal is a known false-positive pattern for actively-maintained tools that ship frequent patch releases (the legitimacy heuristic reads the *latest version's* publish timestamp, not the package's first-publish date).

*No packages in this audit were sourced from WebSearch/training-data guesses without registry confirmation — all five were confirmed via `npm view` against the live npm registry on 2026-07-15.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  npm run test:client  (new script, D-01)                         │
└───────────────────────────┬───────────────────────────────────────┘
                             │ invokes
                             ▼
                    ┌─────────────────┐
                    │  vitest.config.ts │  (standalone, NOT merged
                    │  environment:      │   into vite.config.ts)
                    │    happy-dom       │
                    │  plugins: [react()]│
                    │  setupFiles: [...] │
                    └─────────┬─────────┘
                              │ discovers
                              ▼
              ┌───────────────────────────────┐
              │  client/src/**/*.test.ts(x)     │  (co-located, D-03)
              └───────────────────────────────┘
                    │                      │
      ┌─────────────┘                      └─────────────┐
      ▼                                                    ▼
┌──────────────────────┐                     ┌──────────────────────────┐
│ mask.test.ts           │                     │ PhaseRenderer.test.tsx    │
│ (pure function test,   │                     │ (component render test,  │
│  no DOM/context needed)│                     │  needs harness)           │
└──────────────────────┘                     └───────────┬──────────────┘
                                                            │ imports
                                                            ▼
                                          ┌───────────────────────────────────┐
                                          │ client/src/test-utils/               │
                                          │  vi.mock('../context/WizardContext')  │
                                          │  → mocks the useWizard() hook only    │
                                          │  → does NOT touch WizardContext.tsx   │
                                          │  → renderConWizard(ui, overrides)     │
                                          └───────────────────────────────────┘
                                                            │ renders
                                                            ▼
                                          ┌───────────────────────────────────┐
                                          │ <PhaseRenderer fase={faseCurpSolo}/> │
                                          │  fase prop passed DIRECTLY by test   │
                                          │  (isolated single-field FaseConfig,  │
                                          │   not the full datos_personales)     │
                                          └───────────────────────────────────┘
                                                            │ userEvent.type + click submit
                                                            ▼
                                          validarCampo() runs pattern.test(value)
                                          against phases.config.json's curp.pattern
                                          → assert role="alert" error text present/absent
```

### Recommended Project Structure
```
client/
├── vitest.config.ts          # NEW — standalone Vitest config (see Pattern 2)
├── package.json               # UPDATED — devDependencies + "test" script
├── src/
│   ├── test-utils/            # NEW — reusable test harness (D-05)
│   │   ├── setup.ts           #   Vitest setupFiles entry (jest-dom matchers)
│   │   └── renderConWizard.tsx#   vi.mock(WizardContext) + render helper
│   ├── utils/
│   │   ├── mask.ts             # FIX — enmascararCurp slice(0,5) → slice(0,4)
│   │   └── mask.test.ts        # NEW — CURP-04 regression coverage
│   └── components/wizard/
│       ├── PhaseRenderer.tsx   # UNCHANGED (validarCampo stays as-is, D-04)
│       └── PhaseRenderer.test.tsx # NEW — CURP-05 pattern validation coverage
```

### Pattern 1: Mocking `useWizard` instead of exporting `WizardContext`

**What:** `WizardContext.tsx` exports only `WizardProvider` and `useWizard` — the raw context object and its value-type interface (`WizardContextValor`) are private to the module `[VERIFIED: codebase read, client/src/context/WizardContext.tsx:1-140]`. D-05 describes the harness as wrapping components "in a mocked `WizardContext.Provider`," but that JSX literally cannot be written without an export change. The equivalent, zero-source-change approach is to mock the **hook**, not the **Provider component**.

**When to use:** Any component test where the unit under test calls `useWizard()` internally (as `PhaseRenderer` and `Confirmacion` both do).

**Example:**
```typescript
// client/src/test-utils/renderConWizard.tsx
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import { useWizard } from '../context/WizardContext';
import type { ConfigPortal } from '../types';

// vi.mock must be called at module scope in the file that ultimately gets
// imported before the real WizardContext module — placing it here, in the
// shared harness, works because Vitest hoists vi.mock() above this file's
// own imports, and the mock registration is shared across the test file's
// module graph for that run.
vi.mock('../context/WizardContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../context/WizardContext')>();
  return { ...actual, useWizard: vi.fn() };
});

// Deriving the mock's type via ReturnType<typeof useWizard> works even
// though WizardContextValor itself is never exported — TS can reference
// an unexported type structurally without you naming it directly.
type ContextoWizard = ReturnType<typeof useWizard>;

function contextoBase(overrides: Partial<ContextoWizard> = {}): ContextoWizard {
  return {
    config: null,
    datos: {},
    faseActual: 0,
    maxFase: 0,
    draftId: 'draft-test',
    folio: null,
    cargando: false,
    errorGeneral: null,
    iniciar: vi.fn(),
    guardarFase: vi.fn().mockResolvedValue(undefined),
    irAFase: vi.fn(),
    enviar: vi.fn(),
    reiniciar: vi.fn(),
    ...overrides
  };
}

export function renderConWizard(ui: ReactElement, overrides: Partial<ContextoWizard> = {}) {
  vi.mocked(useWizard).mockReturnValue(contextoBase(overrides));
  return render(ui);
}
```

```typescript
// client/src/components/wizard/PhaseRenderer.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConWizard } from '../../test-utils/renderConWizard';
import PhaseRenderer from './PhaseRenderer';
import type { FaseConfig } from '../../types';

// Isolated fase with ONLY a curp field — avoids needing to satisfy the
// other required fields (nombre, telefono, etc.) of the real
// datos_personales fase. The `fase` prop is passed directly by the test,
// independent of whatever mocked `config` the harness returns
// (confirmed: Wizard.tsx passes config.fases[faseActual] as this prop in
// production, but PhaseRenderer itself has no dependency on that source).
const faseCurpSolo: FaseConfig = {
  id: 'datos_personales',
  titulo: 'Datos personales',
  icono: '👤',
  tipo: 'form',
  campos: [
    {
      nombre: 'curp',
      etiqueta: 'CURP',
      tipo: 'text',
      requerido: true,
      maxLength: 18,
      pattern: '^[A-Z][AEIOUX][A-Z]{2}\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\\d$'
    }
  ]
};

describe('PhaseRenderer — validación de patrón CURP', () => {
  it('acepta una CURP válida post-2000 y llama guardarFase', async () => {
    const guardarFase = vi.fn().mockResolvedValue(undefined);
    renderConWizard(<PhaseRenderer fase={faseCurpSolo} />, { guardarFase });

    await userEvent.type(screen.getByLabelText(/curp/i), 'MAPA000115HDFRRLA1');
    await userEvent.click(screen.getByRole('button', { name: /guardar y continuar/i }));

    expect(guardarFase).toHaveBeenCalledWith('datos_personales', { curp: 'MAPA000115HDFRRLA1' });
  });

  it('rechaza una CURP malformada antes de llamar guardarFase', async () => {
    const guardarFase = vi.fn();
    renderConWizard(<PhaseRenderer fase={faseCurpSolo} />, { guardarFase });

    await userEvent.type(screen.getByLabelText(/curp/i), 'NOVALIDA123');
    await userEvent.click(screen.getByRole('button', { name: /guardar y continuar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('CURP no tiene un formato válido');
    expect(guardarFase).not.toHaveBeenCalled();
  });
});
```

### Pattern 2: Standalone `vitest.config.ts`, not merged into `vite.config.ts`

**What:** Keep `client/vite.config.ts` untouched (it's the production build/dev-server config) and add a separate `client/vitest.config.ts` that independently declares `plugins: [react()]` and the `test` block.

**When to use:** This project's constraint is "keep initial client test setup minimal" and CONTEXT.md's canonical file list does not include `vite.config.ts` among files to change — a standalone config avoids touching it at all. Official Vitest docs confirm a separate `vitest.config.ts` is a supported first-class pattern (it takes priority over `vite.config.ts` when both exist) `[CITED: vitest.dev/config]`. Vitest does **not** automatically reuse `vite.config.ts`'s plugins when you use a separate file — `@vitejs/plugin-react` must be re-declared, or `.tsx` test/component files will fail to parse `[CITED: vitest.dev/guide, cross-referenced via WebSearch against multiple 2026 setup guides]`.

**Example:**
```typescript
// client/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-utils/setup.ts'],
    globals: false // explicit imports (describe/it/expect from 'vitest')
                    // match this project's existing explicit-import style
                    // (no path aliases, explicit relative imports throughout)
  }
});
```

```typescript
// client/src/test-utils/setup.ts
import '@testing-library/jest-dom/vitest';
```

### Anti-Patterns to Avoid
- **Exporting `WizardContext`/`WizardContextValor` just to enable literal `<Provider>` JSX in tests:** Unnecessary source change outside phase scope; `vi.mock` achieves identical test isolation (Pattern 1).
- **Reusing the full `datos_personales` fase object for the CURP pattern test:** Forces the test to also fill `nombre`, `primerApellido`, `fechaNacimiento`, `sexo`, `telefono`, `correo` just to get past `validarCampo`'s required-field checks for unrelated fields, coupling the CURP test to unrelated form fields. Build an isolated single-field `FaseConfig` fixture instead (Pattern 1's `faseCurpSolo`).
- **`globals: true` in `vitest.config.ts`:** Would inject `describe`/`it`/`expect` as ambient globals, requiring a `tsconfig.json` `"types": ["vitest/globals"]` addition and diverging from this codebase's consistently explicit-import style (no ambient globals anywhere else in the project). Prefer explicit `import { describe, it, expect } from 'vitest'` per test file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Simulating a user typing into a controlled input and clicking submit | Manual `fireEvent.change`/`fireEvent.click` sequences | `@testing-library/user-event`'s `userEvent.type()` / `userEvent.click()` | Fires the full realistic event sequence (focus, keydown, input, blur) that controlled React inputs and `onChange` handlers expect; `fireEvent` skips intermediate events and can pass in a test while missing real-browser bugs |
| DOM-state assertions (`toBeInTheDocument`, `toHaveTextContent`) | Manual `element !== null` / `element.textContent === '...'` checks | `@testing-library/jest-dom` matchers | Standard, more readable failure messages; avoids re-deriving edge cases (e.g., whitespace normalization in `toHaveTextContent`) |
| Mocking a React hook's return value across a test file | Manual module replacement via dynamic `import()` swapping or a custom DI container | `vi.mock()` + `vi.mocked(hook).mockReturnValue()` | Vitest's built-in module mocking is hoisted, cached per test file, and is the documented idiomatic pattern — a custom DI layer would be unrequested scope expansion for a two-hook context |

**Key insight:** For a first test-infrastructure phase, every non-standard piece of home-grown test tooling is a maintenance cost future phases inherit. The one piece of genuinely new infrastructure this phase should build is the `test-utils/renderConWizard` harness (D-05) — everything else should be off-the-shelf.

## Common Pitfalls

### Pitfall 1: Vitest 4.x is incompatible with this project's pinned Vite version
**What goes wrong:** `npm install -D vitest` (no version pin) installs the registry `latest` tag, currently `4.1.10`, which declares `"vite": "^6.0.0 || ^7.0.0 || ^8.0.0"` as a hard dependency. This project's `client/package.json` pins `"vite": "^5.4.8"`. npm will either fail to resolve, or (with npm's more permissive dependency resolution) install a duplicate/mismatched Vite copy in `node_modules`, causing confusing dual-Vite runtime errors.
**Why it happens:** Vitest's major version tracks Vite's major version closely; jumping to `vitest@4` implicitly requires upgrading `vite@6+`, which is out of scope for this phase (CONTEXT.md does not mention touching `vite.config.ts` or the project's Vite version).
**How to avoid:** Pin `vitest@^3.2.7` explicitly in the install command and in `package.json`. Verified: `vitest@3.2.7` depends on `"vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0"` `[VERIFIED: npm registry, npm view vitest@3.2.7 dependencies.vite]`.
**Warning signs:** `npm install` warnings about peer dependency conflicts on `vite`; `vitest` failing to start with an error referencing an unexpected Vite API.

### Pitfall 2: happy-dom's documented form-submit flakiness
**What goes wrong:** `happy-dom` has open, unresolved GitHub issues (e.g. capricorn86/happy-dom#1770, opened 2025-03-10, still open) describing `fireEvent`/form-submission behavior that works in jsdom/real browsers but fails intermittently in happy-dom, specifically around `<form onSubmit>` + submit-button interactions — exactly the mechanism D-04's component test needs (`PhaseRenderer`'s `<form onSubmit={...}><button type="submit">`).
**Why it happens:** happy-dom trades DOM spec completeness for speed; form submission event propagation is one of the documented gaps.
**How to avoid:** Use `userEvent.click()` on the submit button first (the documented/recommended default). If that proves flaky under happy-dom during implementation, the two documented fallbacks (in priority order) are: (a) `fireEvent.submit(container.querySelector('form')!)` fired directly on the form element rather than via the button click, which multiple sources report as more reliable under happy-dom-like environments than `fireEvent.click` on the button; (b) fall back to `// @vitest-environment jsdom` for just `PhaseRenderer.test.tsx`, per D-02's pre-approved escape hatch.
**Warning signs:** `guardarFase` mock not being called despite a valid CURP being typed and the submit button being clicked; test timing out waiting for a state update that never happens.

### Pitfall 3: `WizardContextValor` is not exported — cannot type the mock without a workaround
**What goes wrong:** Attempting `import type { WizardContextValor } from '../context/WizardContext'` in the test harness fails to compile — the interface is private to the module `[VERIFIED: codebase read]`.
**Why it happens:** `WizardContext.tsx` only exports `WizardProvider` and `useWizard`; the interface and the raw context object are intentionally private, following this codebase's existing "explicit null return type allows safe checking" pattern.
**How to avoid:** Use `ReturnType<typeof useWizard>` in the harness instead of importing the interface by name — TypeScript resolves this structurally without needing the type exported (see Pattern 1's `ContextoWizard` type alias). This avoids any change to `WizardContext.tsx`.
**Warning signs:** A TS2305 "has no exported member" compiler error on `WizardContextValor` — a signal to switch to `ReturnType<typeof useWizard>` rather than adding an `export` keyword to production code.

### Pitfall 4: `phases.config.json`'s `pattern` string needs double-escaping when copied from `CURP_REGEX`
**What goes wrong:** `CURP_REGEX` in `schemas.js` is a JS regex literal containing backslashes (`\d`, `\d{2}`). Copied verbatim into a JSON string value (`"pattern": "..."`), each `\d` must become `\\d` in the JSON source, or `JSON.parse` will throw (`\d` is not a valid JSON escape sequence) or silently corrupt the pattern.
**Why it happens:** JSON string escaping rules differ from JS regex literal syntax; the existing `telefono` field's pattern in the same file (`"pattern": "^\\d{10}$"`) already demonstrates the correct double-backslash convention, confirming this is a known, previously-solved pattern in this exact file.
**How to avoid:** Mirror the existing `telefono`/`cp` fields' escaping convention exactly. Corrected value to write into `phases.config.json`'s `curp.pattern`:
```
^[A-Z][AEIOUX][A-Z]{2}\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\\d$
```
**Warning signs:** `JSON.parse` errors on server startup (phases config is read from disk at boot per the project's architectural constraints); or, if not caught, a pattern that never matches anything because the regex engine received a malformed string.

### Pitfall 5: Including `*.test.tsx` in `tsc --noEmit`'s scope is very likely fine, but confirm the jest-dom matcher augmentation actually applies
**What goes wrong:** `client/tsconfig.json`'s `"include": ["src"]` will pick up co-located `*.test.tsx` files (D-03) automatically since they live under `src/`. If the ambient type augmentation from `@testing-library/jest-dom/vitest` (which teaches `expect().toBeInTheDocument()` etc. to TypeScript) isn't part of the same compiled program, `tsc --noEmit` will fail with "Property 'toBeInTheDocument' does not exist."
**Why it happens:** Module augmentation for global interfaces (like `vitest`'s `Assertion`) only applies within files that are part of the same TS compilation. Since `src/test-utils/setup.ts` (which does `import '@testing-library/jest-dom/vitest'`) is itself under `src/` and therefore included by `tsconfig.json`'s glob, it becomes part of the same program automatically — no explicit cross-file import is needed for the augmentation to apply project-wide.
**How to avoid:** Keep the setup file (with the jest-dom import) inside `src/` (as `client/src/test-utils/setup.ts`, not e.g. `client/test-setup.ts` at the client root) specifically so `tsconfig.json`'s existing `"include": ["src"]` picks it up without any tsconfig edit. This is the discretion point CONTEXT.md leaves to the planner — recommend NOT excluding `*.test.tsx`, since keeping them in the same `tsc --noEmit` program is what makes the jest-dom typing work without extra config, and `npm run build`'s typecheck catching test-file type errors is a feature, not a liability, for this small a test suite.
**Warning signs:** If `npm run build` does fail on test files for reasons unrelated to actual bugs (e.g., strict `noUnusedLocals` flagging an unused React import that isn't needed under the `react-jsx` transform), that is a signal to reconsider — but this is not expected given `jsx: "react-jsx"` is already configured (no explicit `React` import needed in `.tsx` files).

## Code Examples

### `enmascararCurp` fix (CURP-03)
```typescript
// client/src/utils/mask.ts — current (buggy) code at line 3-6:
export function enmascararCurp(curp: string): string {
  if (!curp) return '';
  return curp.slice(0, 5) + '*'.repeat(Math.max(0, curp.length - 5));
}

// Fix — mirror the already-correct server-side implementation
// (server/src/utils/mask.js:3-6) exactly: change both the visible-slice
// count AND the asterisk-count subtrahend from 5 to 4.
export function enmascararCurp(curp: string): string {
  if (!curp) return '';
  return curp.slice(0, 4) + '*'.repeat(Math.max(0, curp.length - 4));
}
```

### `mask.test.ts` regression coverage (CURP-04), mirroring server precedent
```typescript
// client/src/utils/mask.test.ts
import { describe, it, expect } from 'vitest';
import { enmascararCurp } from './mask';

describe('enmascararCurp', () => {
  // Anti-regression coverage: this is the ONLY case that distinguishes
  // the bug (slice(0,5)) from the fix (slice(0,4)) — Math.max(0, n-5) and
  // Math.max(0, n-4) diverge only when curp.length > 4.
  it('enmascara todo excepto los primeros 4 caracteres (mirrors server/tests/arco.test.js)', () => {
    expect(enmascararCurp('PEGG850312MDFRRR04')).toBe('PEGG' + '*'.repeat(14));
  });

  it('regresa cadena vacía si no hay CURP', () => {
    expect(enmascararCurp('')).toBe('');
  });

  describe('casos límite documentados (NO son cobertura anti-regresión — ' +
    'slice(0,5) y slice(0,4) producen el mismo resultado cuando length <= 4)', () => {
    it('CURP de 4 caracteres queda completamente visible bajo ambas versiones', () => {
      expect(enmascararCurp('PEGG')).toBe('PEGG');
    });

    it('CURP más corta que 4 caracteres queda completamente visible bajo ambas versiones', () => {
      expect(enmascararCurp('PE')).toBe('PE');
    });
  });
});
```

### `phases.config.json` pattern fix (CURP-05)
```json
{
  "nombre": "curp",
  "etiqueta": "CURP",
  "tipo": "text",
  "requerido": true,
  "maxLength": 18,
  "pattern": "^[A-Z][AEIOUX][A-Z]{2}\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\\d$",
  "ayuda": "18 caracteres, tal como aparece en tu identificación oficial."
}
```
Note: `PhaseRenderer.tsx`'s `validarCampo` does `new RegExp(campo.pattern).test(v)` without a case-insensitive flag, and does NOT uppercase the input before testing (unlike the backend's Zod schema, which `.transform((v) => v.toUpperCase())` before testing). Since `CURP_REGEX` requires uppercase letters (`[A-Z]`, not `[A-Za-z]`), a user typing a lowercase CURP will pass the (currently loose) `^[A-Za-z0-9]{18}$` pattern today but will **fail** the corrected pattern client-side, even though the backend would accept it (after its own uppercase transform). This is a real UX-visible behavior change from this fix, not a bug in the fix itself — flag it for the planner as an expected, in-scope consequence of CURP-05 (the field's `ayuda` text already says "tal como aparece en tu identificación oficial," and CURPs are conventionally presented in uppercase on official IDs, so this is unlikely to be a frequent real-world friction point, but a verification step should explicitly check a lowercase-CURP input against the new pattern to confirm this is the expected, accepted behavior rather than an overlooked regression).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `fireEvent` as the default RTL interaction API | `@testing-library/user-event` as the default, `fireEvent` reserved for low-level/rare cases | Long-standing RTL guidance, still current as of 2026 | D-04's component test should default to `userEvent.type`/`userEvent.click`, falling back to `fireEvent.submit` only if happy-dom's documented form-submit gap is hit (Pitfall 2) |
| `vitest@2.x` / `vitest@1.x` | `vitest@3.2.x` (current stable line compatible with Vite 5) or `vitest@4.x` (requires Vite 6+) | Vitest 4.0.0 released 2025-10-22 | This project must stay on the 3.x line until/unless a separate decision is made to upgrade Vite to 6+ |

**Deprecated/outdated:** None specific to this phase's scope — all recommended packages are current, actively maintained majors.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `userEvent.click()` on the submit button will reliably trigger `PhaseRenderer`'s `onSubmit` handler under `happy-dom` in most cases, with `fireEvent.submit(form)` as a documented fallback only if flakiness is observed | Pitfall 2 | If happy-dom's form-submit gap is broader than the search results suggest, the D-04 component test could be unreliable/flaky in CI-like repeated runs; mitigated by the pre-approved `jsdom` per-file escape hatch (D-02) |
| A2 | Lowercase CURP input will fail client-side validation post-CURP-05 (since `validarCampo` doesn't uppercase before testing) but would have succeeded server-side (which does uppercase) — this is an acceptable, expected behavior change, not a defect | Code Examples ("phases.config.json pattern fix") | If this is NOT acceptable to the user, the plan would need an additional fix to `validarCampo` (uppercase before pattern test) or to the `curp` field pattern (add case-insensitivity) — neither is in CONTEXT.md's locked scope, so this should be confirmed during planning/verification, not silently patched |

## Open Questions

1. **Will `vi.mock('../context/WizardContext')` placed inside the shared `test-utils/renderConWizard.tsx` file actually apply for every test file that imports `renderConWizard`, or does each `*.test.tsx` file need its own top-level `vi.mock(...)` call?**
   - What we know: Vitest hoists `vi.mock()` calls to the top of the file they're written in, and ESM module evaluation order means `test-utils`'s hoisted mock registration runs before its own subsequent imports (including anything that transitively imports the real `WizardContext` module) resolve, for that test file's module graph.
   - What's unclear: This exact "mock declared in a shared helper module, consumed by multiple test files" pattern is common but not universally guaranteed across Vitest versions/configurations without a directly-observed passing test run.
   - Recommendation: The planner should have the first task that builds this harness immediately verify it against a trivial smoke test (render `PhaseRenderer` with a mocked `guardarFase`, assert it was called) before building out the full CURP-05 assertions on top of it. If the shared-file mock doesn't apply, the fallback is moving the single `vi.mock('../../context/WizardContext')` line into each `*.test.tsx` file directly (a small amount of duplication, not a redesign).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Running Vitest | ✓ | v22.22.2 | — (satisfies vitest's `engines.node: ^18 \|\| ^20 \|\| >=22`) |
| npm | Installing new devDependencies | ✓ | 10.9.7 | — |
| vitest@3.2.7 | Test runner | ✓ (confirmed on npm registry) | 3.2.7 | — |
| happy-dom | DOM environment | ✓ (confirmed on npm registry) | 20.10.6 | jsdom (D-02's documented escape hatch, per-file only) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** happy-dom → jsdom, scoped to individual test files only if needed (D-02).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Phase touches no auth code |
| V3 Session Management | No | Phase touches no session/draft-ID handling logic |
| V4 Access Control | No | No access-control code touched |
| V5 Input Validation | Yes | `curp` field `pattern` in `phases.config.json` — client-side validation is a UX layer only; the authoritative validation remains the backend Zod `CURP_REGEX` schema (already fixed in Phase 1, unchanged by this phase). This phase must not weaken or bypass that server-side check. |
| V6 Cryptography | No | No cryptographic code touched (clinical-data encryption in `server/src/crypto/cipher.js` is untouched) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Over-exposure of PII on screen (CURP masking bug, CURP-03) | Information Disclosure | Mask sensitive identifiers to the minimum necessary for user recognition (4 visible chars, matching server precedent) — this phase's core fix |
| Client-side-only validation being mistaken for a security boundary | Tampering | Frontend `pattern` validation (CURP-05) is explicitly a UX optimization, not a security control — a malicious client can always bypass it and send arbitrary data directly to the API; the backend Zod schema (`esquemaDatosPersonales`, `.strict()`) remains the actual security boundary and is unchanged by this phase |

## Sources

### Primary (HIGH confidence)
- `npm view vitest version` / `npm view vitest@3.2.7 dependencies.vite` / `npm view vitest time.created` — registry-verified version and compatibility data, 2026-07-15
- `npm view @testing-library/react version` / `peerDependencies` — registry-verified, 2026-07-15
- `npm view @testing-library/user-event version` / `peerDependencies` — registry-verified, 2026-07-15
- `npm view @testing-library/jest-dom version` / `time` — registry-verified, 2026-07-15
- `npm view happy-dom version` / `time.created` — registry-verified, 2026-07-15
- Direct codebase reads: `client/src/utils/mask.ts`, `server/src/utils/mask.js`, `server/src/config/phases.config.json`, `server/src/validation/schemas.js`, `client/src/components/wizard/PhaseRenderer.tsx`, `client/src/context/WizardContext.tsx`, `client/src/components/wizard/Wizard.tsx`, `client/src/components/wizard/phases/Confirmacion.tsx`, `client/src/components/fields/Field.tsx`, `client/src/types.ts`, `client/package.json`, `client/tsconfig.json`, `client/vite.config.ts`, `server/tests/curp.test.js`, `server/tests/arco.test.js`, `package.json` (root)
- `gsd-tools query package-legitimacy check --ecosystem npm` — legitimacy signals for all 5 recommended packages

### Secondary (MEDIUM confidence)
- [vitest.dev/config](https://vitest.dev/config/) — standalone `vitest.config.ts` vs. merged config guidance, cross-referenced via WebSearch
- [vitest.dev/guide/projects](https://vitest.dev/guide/projects) — config file resolution priority
- WebSearch results on `@testing-library/jest-dom` + Vitest setup pattern (`@testing-library/jest-dom/vitest` import) — cross-referenced across multiple 2026 setup guides
- WebSearch results on happy-dom form-submit issues (capricorn86/happy-dom#1770, and related form-submission threads) — GitHub issue confirmed open as of this research date via WebFetch

### Tertiary (LOW confidence)
- General WebSearch summaries on `userEvent` vs `fireEvent` best practices (widely consistent across sources, not independently verified against Testing Library's own docs page in this session)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions and compatibility constraints directly verified against the live npm registry, not training-data assumptions
- Architecture (harness pattern): HIGH — grounded in a direct read of the actual `WizardContext.tsx`/`PhaseRenderer.tsx`/`Wizard.tsx` source, not assumed API shape
- Pitfalls: MEDIUM-HIGH — the Vitest/Vite version mismatch and the unexported-context finding are HIGH confidence (directly verified); the happy-dom form-submit flakiness is MEDIUM (documented open GitHub issues, but severity/frequency not independently reproduced in this session)

**Research date:** 2026-07-15
**Valid until:** 2026-08-14 (30 days — this is a fast-moving dependency surface; re-verify `vitest`/`happy-dom`/`@testing-library/*` versions if planning is delayed past this window)
