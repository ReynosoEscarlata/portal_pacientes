# Phase 3: CURP Semantic Cross-Validation - Pattern Map

**Mapped:** 2026-07-17
**Files analyzed:** 2 (1 modified schema file, 1 modified test file)
**Analogs found:** 2 / 2 (both are the same files being modified — no new files created this phase, pattern comes from adjacent code in the same files)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `server/src/validation/schemas.js` (modify `esquemaDatosPersonales`) | model (Zod validation schema) | transform (request-response validation) | Same file — `fechaNacimiento` field-level `.refine()` chain (lines 23-31) | exact (style/tone), first-instance (no existing `.superRefine()` in codebase) |
| `server/tests/curp.test.js` (extend + fix fixture) | test | request-response (safeParse assertions) | Same file — existing `test(...)` blocks using `base` fixture + `safeParse` | exact |

No brand-new files are created this phase; both targets are existing files being extended. The "closest analog" for the new `.superRefine()` pattern is necessarily internal to `schemas.js` itself (same conventions, same file) since this is the first cross-field validation in the codebase.

## Pattern Assignments

### `server/src/validation/schemas.js` — add `.superRefine()` to `esquemaDatosPersonales`

**Analog:** `fechaNacimiento` field-level `.refine()` chain, same file, lines 23-31

**Imports pattern** (lines 1-2, already present, no changes needed):
```javascript
import { z } from 'zod';
import { CLAVES_SEXO, CLAVES_ENTIDADES } from './catalogos.js';
```

**Existing CURP_REGEX to reuse for the guard** (lines 4-5):
```javascript
export const CURP_REGEX =
  /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;
```

**Spanish message tone reference** (lines 23-31, `.refine()` message strings to match style):
```javascript
const fechaNacimiento = z
  .string({ required_error: 'La fecha de nacimiento es obligatoria' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, 'La fecha no es válida')
  .refine((v) => v <= hoyISO(), 'La fecha de nacimiento no puede ser futura')
  .refine((v) => v >= '1900-01-01', 'La fecha de nacimiento no es válida');
```
Note the tone: short, imperative or descriptive Spanish sentences, no punctuation-heavy phrasing, lowercase after the first word except proper nouns (CURP stays uppercase as an acronym).

**Object shape to insert into** (lines 33-55) — attach after `.strict()`:
```javascript
export const esquemaDatosPersonales = z
  .object({
    nombre: textoRequerido('El nombre', 80),
    primerApellido: textoRequerido('El primer apellido', 80),
    segundoApellido: textoOpcional(80),
    fechaNacimiento,
    sexo: z.enum(CLAVES_SEXO, { errorMap: () => ({ message: 'Selecciona una opción del catálogo de sexo' }) }),
    curp: z
      .string({ required_error: 'La CURP es obligatoria' })
      .trim()
      .transform((v) => v.toUpperCase())
      .pipe(z.string().regex(CURP_REGEX, 'La CURP no tiene un formato válido')),
    telefono: z
      .string({ required_error: 'El teléfono es obligatorio' })
      .trim()
      .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos'),
    correo: z
      .string({ required_error: 'El correo es obligatorio' })
      .trim()
      .max(120, 'El correo no debe exceder 120 caracteres')
      .email('El correo no es válido')
  })
  .strict();
  // ◄── NEW: .superRefine((data, ctx) => { ... }) goes here, chained after .strict()
```

**New cross-field pattern to add (from RESEARCH.md, verified live against installed Zod 3.25.76):**
```javascript
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

**Error handling pattern (no changes needed):** `ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['curp'] })` issues flow through the existing `ZodError` → `manejadorErrores` pipeline in `server/src/middleware/errorHandler.js` unchanged — same as any other Zod validation failure (`err.errors.map(e => ({ campo: e.path.join('.'), mensaje: e.message }))`). No middleware changes required.

---

### `server/tests/curp.test.js` — add semantic tests + fix broken fixture

**Analog:** existing `test(...)` blocks in the same file (lines 20-63), all following `safeParse` + `assert.equal(r.success, ...)` convention

**Imports/setup pattern (already present, no changes)** (lines 1-18):
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'mock';

const { esquemaDatosPersonales, CURP_REGEX } = await import('../src/validation/schemas.js');

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
`base` is already semantically consistent (`850312` == `850312`, `M` == `M`) — do not change it, only the broken test below reuses it incorrectly.

**Existing test style to copy (lines 20-24, simple regex-only assertion)**:
```javascript
test('acepta CURP válidas', () => {
  assert.ok(CURP_REGEX.test('PEGG850312MDFRRR04'));
  assert.ok(CURP_REGEX.test('HELJ781130HMCRPN05'));
  assert.ok(CURP_REGEX.test('RACA920704MJCMRN01'));
});
```

**BROKEN FIXTURE to fix — lines 26-30 (this is the required regression fix):**
```javascript
test('acepta CURP post-2000 (letra en posición 17)', () => {
  assert.ok(CURP_REGEX.test('MAPA000115HDFRRLA1'));
  const r = esquemaDatosPersonales.safeParse({ ...base, curp: 'MAPA000115HDFRRLA1' });
  assert.equal(r.success, true);
});
```
`MAPA000115HDFRRLA1` encodes birthdate `000115` (2000-01-15) and sex `H`, but `base` has `fechaNacimiento: '1985-03-12'` and `sexo: 'M'`. Per RESEARCH.md Pitfall 2, fix by overriding both sibling fields alongside `curp` (Option (a), the simpler/recommended fix):
```javascript
test('acepta CURP post-2000 (letra en posición 17)', () => {
  assert.ok(CURP_REGEX.test('MAPA000115HDFRRLA1'));
  const r = esquemaDatosPersonales.safeParse({
    ...base,
    curp: 'MAPA000115HDFRRLA1',
    fechaNacimiento: '2000-01-15',
    sexo: 'H'
  });
  assert.equal(r.success, true);
});
```

**New semantic test cases to append (from RESEARCH.md `## Code Examples`, verified live):**
```javascript
test('rechaza CURP cuya fecha codificada no coincide con fechaNacimiento', () => {
  const r = esquemaDatosPersonales.safeParse({ ...base, fechaNacimiento: '1985-03-13' });
  assert.equal(r.success, false);
});

test('rechaza CURP cuyo sexo codificado no coincide con sexo', () => {
  const r = esquemaDatosPersonales.safeParse({ ...base, sexo: 'H' });
  assert.equal(r.success, false);
});

test('sexo NE omite la verificación de sexo pero conserva la de fecha', () => {
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

**Error handling / assertion pattern (existing convention, lines 32-41, 49-63):** loop over an array of invalid values, `safeParse`, `assert.equal(r.success, false, ...)` with a descriptive failure message template literal when iterating multiple cases; single-case tests use a bare `assert.equal(r.success, expected)`.

---

## Shared Patterns

### Zod safeParse + assert.equal convention (all tests in this file)
**Source:** `server/tests/curp.test.js` lines 20-63 (whole file)
**Apply to:** All new/modified test cases in this phase
```javascript
const r = esquemaDatosPersonales.safeParse({ ...base, /* override */ });
assert.equal(r.success, true /* or false */);
```

### Spanish, field-level Zod issue messages
**Source:** `server/src/validation/schemas.js` lines 23-31, 39, 41-44
**Apply to:** The new `.superRefine()` messages — short declarative Spanish sentences, no trailing period, first letter capitalized, domain term (CURP) kept uppercase.

### Cross-field validation stays in the schema layer, not the route handler
**Source:** RESEARCH.md "Don't Hand-Roll" table; `server/src/routes/registros.js` (not modified this phase — confirmed out of scope)
**Apply to:** `esquemaDatosPersonales` only. Do not add any `if (...) throw new AppError(...)` cross-field logic to `registros.js`; the existing `esquema.parse(payload)` call there is unchanged and continues to be the sole enforcement point. `manejadorErrores` in `server/src/middleware/errorHandler.js` requires no changes since `ctx.addIssue` issues use the same `ZodError.errors[].path`/`.message` shape as built-in Zod checks.

## No Analog Found

None — both files being modified are self-contained; the new `.superRefine()` pattern is the first instance of object-level cross-field validation in the codebase, but RESEARCH.md already verified its exact API shape live against the installed Zod version, so no external analog search is needed.

## Metadata

**Analog search scope:** `server/src/validation/schemas.js`, `server/tests/curp.test.js`, `server/src/middleware/errorHandler.js` (referenced, unmodified)
**Files scanned:** 3
**Pattern extraction date:** 2026-07-17
