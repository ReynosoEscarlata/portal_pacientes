# Phase 2: Frontend CURP Consistency & Test Infrastructure - Pattern Map

**Mapped:** 2026-07-15
**Files analyzed:** 8 (2 fixes, 1 config, 5 new test-infra files)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `client/src/utils/mask.ts` (fix) | utility | transform | `server/src/utils/mask.js` (already-correct sibling impl) | exact |
| `server/src/config/phases.config.json` (fix) | config | transform | same file, `telefono`/`cp` fields (existing escaping convention) | exact |
| `client/src/utils/mask.test.ts` (new) | test | transform | `server/tests/arco.test.js` (masking assertion) + `server/tests/curp.test.js` (arrange-act-assert style) | role-match (cross-language) |
| `client/vitest.config.ts` (new) | config | — | `client/vite.config.ts` (structure/style reference only; not a functional analog) | partial (no prior test-config file exists) |
| `client/src/test-utils/setup.ts` (new) | config | — | none (first Vitest setup file in repo) | no analog |
| `client/src/test-utils/renderConWizard.tsx` (new) | utility (test harness) | request-response (mocked) | none (first RTL harness in repo); structurally informed by `WizardContext.tsx`'s `useWizard` shape | no analog |
| `client/src/components/wizard/PhaseRenderer.test.tsx` (new) | test | request-response (form submit) | `server/tests/curp.test.js` (arrange-act-assert, fixture reuse) | role-match (cross-language) |
| `client/package.json` (modified) | config | — | itself (add devDependencies + `test` script) | exact |
| root `package.json` (NOT modified per D-01) | config | — | itself | n/a — do not touch `"test"` script |

## Pattern Assignments

### `client/src/utils/mask.ts` (utility, transform) — CURP-03

**Analog:** `server/src/utils/mask.js` (already fixed, same function shape)

**Current buggy code** (`client/src/utils/mask.ts` lines 3-6):
```typescript
export function enmascararCurp(curp: string): string {
  if (!curp) return '';
  return curp.slice(0, 5) + '*'.repeat(Math.max(0, curp.length - 5));
}
```

**Fix — change both `5`s to `4`s** (mirrors the server implementation exactly):
```typescript
export function enmascararCurp(curp: string): string {
  if (!curp) return '';
  return curp.slice(0, 4) + '*'.repeat(Math.max(0, curp.length - 4));
}
```

No import changes, no signature changes. Do not touch `enmascararTelefono`, `enmascararCorreo`, or `iniciales` in the same file (out of scope, D-06 constraint on strict scope).

---

### `server/src/config/phases.config.json` (config, transform) — CURP-05

**Analog:** same file, the `telefono` field's existing `pattern` value, which already demonstrates the correct JSON double-backslash escaping convention for a regex literal.

**Current loose value** (line 17):
```json
{ "nombre": "curp", "etiqueta": "CURP", "tipo": "text", "requerido": true, "maxLength": 18, "pattern": "^[A-Za-z0-9]{18}$", "ayuda": "18 caracteres, tal como aparece en tu identificación oficial." }
```

**Source of truth to copy from** — `server/src/validation/schemas.js` lines 4-5 (`CURP_REGEX`, JS regex literal):
```javascript
export const CURP_REGEX =
  /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;
```

**Fix value** — every `\` becomes `\\` when copied into the JSON string:
```json
"pattern": "^[A-Z][AEIOUX][A-Z]{2}\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\\d$"
```
Do not touch `maxLength`, `ayuda`, or the field's position in the array — only the `pattern` value changes.

---

### `client/src/utils/mask.test.ts` (test, transform) — CURP-04

**Analog 1 (fixture + exact-equality assertion):** `server/tests/arco.test.js` line 19 (fixture) and line 69 (assertion pattern):
```javascript
curp: 'PEGG850312MDFRRR04',
// ...
assert.equal(consulta.body.datosPersonales.curp, 'PEGG' + '*'.repeat(14));
```
Reuse `PEGG850312MDFRRR04` as the fixture in the new client test for direct backend/frontend cross-reference, and mirror the `'PEGG' + '*'.repeat(14)` expected-value construction.

**Analog 2 (arrange-act-assert style, terse inline comments for edge cases):** `server/tests/curp.test.js` lines 49-63 — flat `test()` blocks, one assertion focus per test, comments explaining *why* each fixture is invalid/edge-case.

**Vitest equivalent to write** (per D-06, using `describe`/`it` from `vitest`, no globals):
```typescript
import { describe, it, expect } from 'vitest';
import { enmascararCurp } from './mask';

describe('enmascararCurp', () => {
  it('enmascara todo excepto los primeros 4 caracteres (mirrors server/tests/arco.test.js)', () => {
    expect(enmascararCurp('PEGG850312MDFRRR04')).toBe('PEGG' + '*'.repeat(14));
  });

  it('regresa cadena vacía si no hay CURP', () => {
    expect(enmascararCurp('')).toBe('');
  });

  describe('casos límite documentados (NO son cobertura anti-regresión)', () => {
    it('CURP de 4 caracteres queda completamente visible bajo ambas versiones', () => {
      expect(enmascararCurp('PEGG')).toBe('PEGG');
    });
    it('CURP más corta que 4 caracteres queda completamente visible bajo ambas versiones', () => {
      expect(enmascararCurp('PE')).toBe('PE');
    });
  });
});
```
File location: co-located at `client/src/utils/mask.test.ts` per D-03.

---

### `client/vitest.config.ts` (config) — CURP-06

**No functional analog** (first Vitest config in repo). Structural reference only — `client/vite.config.ts` exists but is untouched (D-01/Pattern 2 in RESEARCH.md: keep it a standalone file, do not merge).

**Full config to create** (from RESEARCH.md Pattern 2, verified against installed `@vitejs/plugin-react@^4.3.1`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-utils/setup.ts'],
    globals: false
  }
});
```
`globals: false` matches this codebase's consistently explicit-import style (no ambient globals anywhere else — see `noUnusedLocals`/`noUnusedParameters` strict tsconfig and the project's "no path aliases, explicit relative imports throughout" convention).

---

### `client/src/test-utils/setup.ts` (config) — CURP-06

**No analog** (first setup file). One line, per RESEARCH.md:
```typescript
import '@testing-library/jest-dom/vitest';
```
Must live under `client/src/` (not `client/` root) so `tsconfig.json`'s existing `"include": ["src"]` (line 19) picks it up for `tsc --noEmit` without a tsconfig edit — this is what makes the jest-dom `expect().toBeInTheDocument()` typing resolve project-wide (Pitfall 5 in RESEARCH.md).

---

### `client/src/test-utils/renderConWizard.tsx` (test harness) — D-05, CURP-06

**No existing harness analog.** Built against the real, verified shape of `client/src/context/WizardContext.tsx`:
- Only `WizardProvider` (line 26) and `useWizard` (line 136) are exported — `WizardContext` itself (line 24) and the `WizardContextValor` interface (lines 8-22) are module-private. Confirmed by direct read; do not attempt `import { WizardContext }` — it does not exist as an export.
- `useWizard()` return shape (lines 8-22) to mock: `config, datos, faseActual, maxFase, draftId, folio, cargando, errorGeneral, iniciar, guardarFase, irAFase, enviar, reiniciar`.

**Harness to create** (from RESEARCH.md Pattern 1, using `ReturnType<typeof useWizard>` to type the mock without needing the private interface exported):
```typescript
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import { useWizard } from '../context/WizardContext';

vi.mock('../context/WizardContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../context/WizardContext')>();
  return { ...actual, useWizard: vi.fn() };
});

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
**Verify first:** per RESEARCH.md Open Question 1, confirm this shared-file `vi.mock()` actually applies across test files that import `renderConWizard` with a trivial smoke test before building the full CURP-05 assertions on top of it. If it doesn't, fall back to duplicating the `vi.mock(...)` call directly in each `*.test.tsx` file.

---

### `client/src/components/wizard/PhaseRenderer.test.tsx` (test, request-response/form-submit) — CURP-05, CURP-06

**Analog 1 (arrange-act-assert style):** `server/tests/curp.test.js` — flat, terse `test()`/`it()` blocks with one behavioral assertion each.

**Analog 2 (the unit under test itself, unchanged):** `client/src/components/wizard/PhaseRenderer.tsx`:
- `validarCampo` (lines 11-21) — stays unexported per D-04; tested only indirectly via rendered form submission.
- `continuar` (lines 46-80) calls `guardarFase(fase.id, completos)` only if `validarCampo` produces no errors for any field (lines 48-56).
- Error rendering: `errorEnvio` renders as `<p className="campo__error" role="alert">{errorEnvio}</p>` (line 110) — but per-field pattern errors are set into `errores` state (line 54) and rendered inside `<Field>` (need to confirm `Field.tsx`'s `role="alert"` usage for the assertion target — RESEARCH.md's example asserts `screen.getByRole('alert')` generically, relying on `Field.tsx` rendering the per-field error with `role="alert"`).
- Submit button label: `"Guardar y continuar"` (line 119, exact text needed for `getByRole('button', { name: /guardar y continuar/i })`).

**Test to create** (from RESEARCH.md Pattern 1, using an isolated single-field `FaseConfig` fixture to avoid needing to satisfy unrelated required fields):
```typescript
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConWizard } from '../../test-utils/renderConWizard';
import PhaseRenderer from './PhaseRenderer';
import type { FaseConfig } from '../../types';

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
**Fallback if happy-dom form-submit flakes (Pitfall 2):** replace `userEvent.click(submitButton)` with `fireEvent.submit(container.querySelector('form')!)`, or add `// @vitest-environment jsdom` at the top of this file only (D-02's pre-approved escape hatch).

**Reuse `MAPA000115HDFRRLA1`** — already an established valid post-2000 CURP fixture in `server/tests/curp.test.js` line 27 (`CURP_REGEX.test('MAPA000115HDFRRLA1')`), giving frontend/backend cross-reference for the happy-path fixture too.

---

### `client/package.json` (config) — CURP-06

**Analog:** itself, current state (read above). Add devDependencies and a `test` script; do not touch `dependencies`, `dev`/`build`/`preview` scripts.

**Devdependencies to add** (verified npm registry versions from RESEARCH.md):
```json
"vitest": "^3.2.7",
"happy-dom": "^20.10.6",
"@testing-library/react": "^16.3.2",
"@testing-library/user-event": "^14.6.1",
"@testing-library/jest-dom": "^6.9.1"
```

**Script to add** (name is planner's discretion per D-01, e.g. `"test": "vitest run"`):
```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run"
}
```

**Do NOT modify** root `package.json` line 11 (`"test": "npm --prefix server test"`) — this is a hard constraint (D-01). If a root convenience script is added, it must be a *new*, separately-named script (e.g. `test:client`), never a change to the existing `"test"` key's value.

## Shared Patterns

### Test file arrange-act-assert style (cross-language precedent)
**Source:** `server/tests/curp.test.js` (whole file) and `server/tests/arco.test.js` (masking assertion)
**Apply to:** `client/src/utils/mask.test.ts`, `client/src/components/wizard/PhaseRenderer.test.tsx`
- Flat `describe`/`it` (client) or `test` (server) blocks, one behavioral assertion focus per block.
- Terse inline comments on fixtures explaining *why* a value is valid/invalid/edge-case (see `server/tests/curp.test.js` lines 34-35, 51-57).
- Known-valid CURP fixtures (`PEGG850312MDFRRR04`, `MAPA000115HDFRRLA1`) reused verbatim across backend and frontend tests for cross-referenceability — do not invent new CURP fixtures unless a new fixture is specifically required by a new edge case.

### Regex duplication between backend and frontend (no shared import)
**Source:** `server/src/validation/schemas.js` lines 4-5 (`CURP_REGEX`) vs. `server/src/config/phases.config.json` line 17 (`curp.pattern`)
**Apply to:** the CURP-05 fix — this is an existing, deliberate architectural pattern (confirmed by Phase 1 CONTEXT.md and PROJECT.md's Key Decisions: duplication chosen over exposing a shared config API). The fix must manually keep the two regex strings in sync; do not attempt to import/reference `schemas.js` from the JSON config file.

### Explicit imports, no test globals
**Source:** project-wide convention (client `tsconfig.json` strict mode, no path aliases, "explicit relative imports throughout" per project CLAUDE.md)
**Apply to:** all new `*.test.ts(x)` files — always `import { describe, it, expect } from 'vitest'` (and `vi` when mocking), never rely on `globals: true` ambient injection.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `client/vitest.config.ts` | config | — | First test-runner config in the client; structurally informed by RESEARCH.md Pattern 2, not an existing codebase file |
| `client/src/test-utils/setup.ts` | config | — | First Vitest setup file; single-line jest-dom import, no prior analog needed |
| `client/src/test-utils/renderConWizard.tsx` | test harness | request-response (mocked) | First RTL/context-mocking harness in the repo; built directly against `WizardContext.tsx`'s verified private-export shape (RESEARCH.md Pattern 1) |

## Metadata

**Analog search scope:** `server/tests/`, `server/src/utils/`, `server/src/validation/`, `client/src/utils/`, `client/src/context/`, `client/src/components/wizard/`, `client/package.json`, `client/tsconfig.json`, root `package.json`
**Files scanned:** 11 (all read directly, no grep-only files — all analogs are small enough for single-pass reads)
**Pattern extraction date:** 2026-07-15
