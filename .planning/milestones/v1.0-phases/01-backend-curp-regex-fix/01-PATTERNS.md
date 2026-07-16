# Phase 1: Backend CURP Regex Fix - Pattern Map

**Mapped:** 2026-07-15
**Files analyzed:** 2
**Analogs found:** 2 / 2 (both are self-analogs — same files being modified, no external analog needed)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `server/src/validation/schemas.js` | utility (validation constant) | transform (regex format validation) | itself (existing `CURP_REGEX` definition) | exact — in-place edit |
| `server/tests/curp.test.js` | test | request-response (unit test, no I/O) | itself (existing `test()` blocks) | exact — extend existing file |

Both files are small (< 105 lines and < 50 lines respectively) and were read in full in one pass each. No broader codebase search was needed — CONTEXT.md confirms `CURP_REGEX` is referenced nowhere else (`grep` not required; documented in CONTEXT.md `<code_context>` → Integration Points).

## Pattern Assignments

### `server/src/validation/schemas.js` (utility, transform)

**Analog:** itself — this is a targeted one-line regex edit, not a new file.

**Current state — full relevant excerpt** (`server/src/validation/schemas.js` lines 1-5):
```javascript
import { z } from 'zod';
import { CLAVES_SEXO, CLAVES_ENTIDADES } from './catalogos.js';

export const CURP_REGEX =
  /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}\d{2}$/;
```

**Exact edit required (per CONTEXT.md D-01):**
- Change the tail of the regex from `[B-DF-HJ-NP-TV-Z]{3}\d{2}$` to `[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$`.
- Positions 14-16 (`[B-DF-HJ-NP-TV-Z]{3}`) stay untouched — unrelated consonant-only name-derived rule, do not touch (D-02).
- Position 17 becomes `[A-Z0-9]` (unrestricted alnum, no consonant/vowel/blocklist restriction — D-02, D-03).
- Position 18 stays `\d` (single digit, permissive — D-04, no check-digit algorithm).

**Resulting line 5 should read:**
```javascript
  /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;
```

**Usage sites of `CURP_REGEX` (both stay untouched, no signature change):**
- Standalone: not used directly in this file outside the schema pipe (raw testing happens in test file).
- Inside Zod pipe (lines 40-44):
```javascript
curp: z
  .string({ required_error: 'La CURP es obligatoria' })
  .trim()
  .transform((v) => v.toUpperCase())
  .pipe(z.string().regex(CURP_REGEX, 'La CURP no tiene un formato válido')),
```
This confirms CURP is uppercased before regex testing — new test fixtures should already be uppercase (matches existing fixture style) or rely on this transform (as the "acepta CURP en minúsculas" test already does).

**Catalog import used by regex-adjacent validation** (line 2, for context — entity codes hardcoded literally inside the regex, not sourced from `CLAVES_ENTIDADES` dynamically):
```javascript
import { CLAVES_SEXO, CLAVES_ENTIDADES } from './catalogos.js';
```
Note: the regex's entity-code alternation (`AS|BC|BS|...`) is a hardcoded literal list inside the regex string itself, not generated from `CLAVES_ENTIDADES` — do not attempt to interpolate the catalog into the regex; this is out of scope and unrelated to the D-01 fix.

---

### `server/tests/curp.test.js` (test, request-response)

**Analog:** itself — extend existing file with 2-3 new `test()` blocks in the same style.

**Full current file structure extracted above.** Key reusable pieces:

**Import pattern** (lines 1-7):
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'mock';

const { esquemaDatosPersonales, CURP_REGEX } = await import('../src/validation/schemas.js');
```
New tests do not need additional imports — `esquemaDatosPersonales` and `CURP_REGEX` are already destructured and available.

**Shared fixture base object** (lines 9-18) — reused via spread (`{ ...base, curp: ... }`) in existing tests; new tests should follow the same pattern rather than building fresh objects:
```javascript
const base = {
  nombre: 'María Guadalupe',
  primerApellido: 'Pérez',
  segundoApellido: 'García',
  fechaNacimiento: '1985-03-12',
  sexo: 'M',
  curp: 'PEGG850312MDFRRR04',
  telefono: '5512345678',
  correo: 'maria@example.com'
};
```

**Raw-regex positive test pattern** (lines 20-24) — direct `CURP_REGEX.test(...)` assertions, no schema involved:
```javascript
test('acepta CURP válidas', () => {
  assert.ok(CURP_REGEX.test('PEGG850312MDFRRR04'));
  assert.ok(CURP_REGEX.test('HELJ781130HMCRPN05'));
  assert.ok(CURP_REGEX.test('RACA920704MJCMRN01'));
});
```
Per CONTEXT.md D-05(a), a new letter-differentiator-at-position-17 fixture should be added here (or as a new `test()` block) using `assert.ok(CURP_REGEX.test(...))`.

**Full-schema `safeParse` positive test pattern** (lines 26-30) — used when normalization (uppercasing) is relevant:
```javascript
test('acepta CURP en minúsculas (se normaliza a mayúsculas)', () => {
  const r = esquemaDatosPersonales.safeParse({ ...base, curp: 'pegg850312mdfrrr04' });
  assert.equal(r.success, true);
  assert.equal(r.data.curp, 'PEGG850312MDFRRR04');
});
```

**Table-driven negative test pattern** (lines 32-46) — array of invalid fixtures with inline `//` comments explaining the specific violation, looped with `safeParse` + `assert.equal(r.success, false, ...)`:
```javascript
test('rechaza CURP con formato inválido', () => {
  const invalidas = [
    'PEGG850312MDFRRR0', // 17 caracteres
    'PEGG850312MDFRRR045', // 19 caracteres
    'PEGG851312MDFRRR04', // mes 13
    'PEGG850332MDFRRR04', // día 32
    'PEGG850312XDFRRR04', // sexo inválido en posición 11
    'PEGG850312MXXRRR04', // entidad federativa inexistente
    '1EGG850312MDFRRR04' // inicia con dígito
  ];
  for (const curp of invalidas) {
    const r = esquemaDatosPersonales.safeParse({ ...base, curp });
    assert.equal(r.success, false, `debería rechazar: ${curp}`);
  }
});
```
Per CONTEXT.md D-05(b) and D-05(c), new invalid fixtures for "out-of-range character at position 17" and "malformed/missing check digit at position 18" should be appended to this array (or a new sibling array) following the same inline-comment convention, e.g. `// letra fuera de A-Z en posición 17`, `// dígito faltante en posición 18`.

**Valid entity codes available for new fixtures** (from `server/src/validation/catalogos.js` lines 45-46, imported transitively via `schemas.js`):
```javascript
export const CLAVES_ENTIDADES = ENTIDADES.map((e) => e.clave);
// includes: AS, BC, BS, CC, CS, CH, DF, CL, CM, DG, GT, GR, HG, JC, MC, MN, MS, NT, NL, OC, PL, QT, QR, SP, SL, SR, TC, TS, TL, VZ, YN, ZS, NE
```
Existing test fixtures already use `DF` and `MC` (via `MDFRRR`, `MJCMRN`... wait — `JC` for Jalisco appears in `RACA920704MJCMRN01`). New fixtures should reuse a known-valid code like `DF` or `MC` per CONTEXT.md discretion note.

---

## Shared Patterns

### Test file conventions (applies to `curp.test.js` only — no other test files touched this phase)
**Source:** `server/tests/curp.test.js` (entire file, self-contained)
**Apply to:** New test blocks added in this phase
- Use `node:test` + `node:assert/strict` exclusively (no other assertion library).
- Prefer `assert.ok(CURP_REGEX.test(x))` for raw-regex-only checks; prefer `esquemaDatosPersonales.safeParse({...base, curp: x})` + `assert.equal(r.success, ...)` when full-schema behavior (uppercasing, other field interplay) matters.
- Inline `//` comment per fixture explaining the specific rule violated — required by CONTEXT.md D-05 convention match.
- Do not restructure the existing 3 `test()` blocks into table-driven/parametrized format (explicitly out of scope per D-05).

### Regex character-class editing (applies to `schemas.js` only)
**Source:** `server/src/validation/schemas.js` line 5
**Apply to:** The single regex constant being fixed
- Edit only the final two atoms of the regex (position 17 and 18 groups); every other segment (year/month/day, sex, entity alternation, positions 14-16) is untouched and must be preserved character-for-character.

## No Analog Found

None — both files in scope already exist and are being directly edited/extended; no new files are created in this phase, so no external analog search was necessary beyond reading the two files themselves.

## Metadata

**Analog search scope:** `server/src/validation/schemas.js`, `server/tests/curp.test.js`, `server/src/validation/catalogos.js` (referenced for catalog values)
**Files scanned:** 3 (all fully read, no re-reads, no large-file truncation needed — all under 105 lines)
**Pattern extraction date:** 2026-07-15
