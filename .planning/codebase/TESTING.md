# Testing Patterns

**Analysis Date:** 2026-07-15

## Test Framework

**Runner:**
- Node.js built-in test framework (`node:test`) — no external test runner like Jest or Vitest
- Zero test configuration required
- Package: N/A (built into Node.js v18+)

**Assertion Library:**
- `node:assert/strict` — strict assertions only, no loose equality

**Run Commands:**
```bash
npm test                   # Run all tests (runs "node --test")
npm --prefix server test   # Run server tests specifically
npm test -- pattern.test.js # Run specific test file
npm test -- --grep "pattern" # Run tests matching pattern (with some node versions)
```

**Test Script:**
- Defined in `server/package.json`: `"test": "node --test"`
- Runs all files matching `*.test.js` or `*.spec.js` in project by default
- Watch mode: `node --watch --test` (not configured in npm scripts)

## Test File Organization

**Location:**
- Tests co-located in `server/tests/` directory (separate from source)
- Pattern: `server/tests/*.test.js`

**Naming:**
- Suffix: `.test.js` (not `.spec.js`)
- Examples: `memoryRepo.test.js`, `arco.test.js`, `curp.test.js`, `consentimiento.test.js`, `codigoPostal.test.js`

**File Structure:**
```
server/
├── tests/
│   ├── memoryRepo.test.js
│   ├── arco.test.js
│   ├── curp.test.js
│   ├── consentimiento.test.js
│   ├── codigoPostal.test.js
├── src/
│   ├── repositories/
│   ├── routes/
│   ├── ...
```

## Test Structure

**Suite Organization:**
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'mock';

const { someFunction } = await import('../src/path/module.js');

test('description of what it tests', async () => {
  // Arrange
  const input = { ... };
  
  // Act
  const result = await someFunction(input);
  
  // Assert
  assert.equal(result.property, expected);
});

test('another test case', async () => {
  // Test code
});
```

**Key Patterns:**

1. **Environment Setup at Top:**
   - `process.env.NODE_ENV = 'test'` — signals test mode to app
   - `process.env.DATA_SOURCE = 'mock'` — uses in-memory repository, not database
   - Set BEFORE importing application code

2. **Dynamic Imports:**
   - Application modules imported with `await import()` after env setup
   - Allows environment to be set before module initialization
   - Example: `const { crearApp } = await import('../src/app.js');`

3. **Async Test Functions:**
   - All tests are async: `test('name', async () => { })`
   - Await database calls, API requests, etc.: `await repo.crearDraft()`

4. **Arrange-Act-Assert Structure:**
   - Prepare test data (Arrange)
   - Execute function/method (Act)
   - Verify results (Assert)
   - Clearly separated sections

## Mocking

**Framework:** No external mocking library—manual mocks built into codebase

**Repository Pattern (Main Mocking Strategy):**
- `crearRepositorioMemoria()` in `src/repositories/memoryRepo.js` — in-memory implementation
- `crearRepositorioPostgres()` in `src/repositories/postgresRepo.js` — real database
- Injected via `obtenerRepositorio()` singleton based on `DATA_SOURCE` env var
- Tests set `DATA_SOURCE=mock` to use memory repository
- Example in `memoryRepo.test.js`: repository is created fresh per test, no contamination

**Test Data:**
- Simple object literals: `{ nome: 'María', primerApellido: 'Pérez', ... }`
- Reused across multiple test functions within same file
- No factory libraries (no factory_bot, ModelFactory, etc.)

**Patterns Observed:**

```javascript
// Create test app with mock repository
process.env.DATA_SOURCE = 'mock';
const { crearApp } = await import('../src/app.js');
const app = crearApp();

// Test data as plain object
const personales = {
  nombre: 'María Guadalupe',
  primerApellido: 'Pérez',
  // ... fields
};

// Use in tests
await request(app).post('/api/registros/draft').expect(201);
```

**What to Mock:**
- External data sources: repository operations use in-memory store
- Configuration: env vars control app behavior
- NOT HTTP—supertest provides real request testing

**What NOT to Mock:**
- HTTP endpoints—test full request/response cycle with supertest
- Middleware—included in app, tested naturally
- Validation logic—test with real Zod schemas

## Fixtures and Factories

**Test Data:**
- Defined as plain constants at top of test file
- Used across multiple tests within file
- No randomization or factories—same data per test

Example from `arco.test.js`:
```javascript
const personales = {
  nombre: 'María Guadalupe',
  primerApellido: 'Pérez',
  // ... full structure
};

const domicilio = {
  calle: 'Av. Siempre Viva',
  // ... full structure
};

// Reused in multiple test functions
async function crearPreRegistro() {
  await request(app)
    .put(`/api/registros/draft/${draft.id}/fase/datos_personales`)
    .send({ datos: personales })
    .expect(200);
  // ...
}
```

**Helper Functions:**
- Test-specific helpers defined in test file: `crearPreRegistro()`
- Orchestrate multi-step setup: creates draft, fills phases, submits
- Returns result for assertion: `return body.folio`

**Location:**
- Fixtures defined at top of test file, after imports
- Helpers defined mid-file before tests that use them
- Tightly scoped to test file—not shared across files

## Coverage

**Requirements:** No coverage enforcement observed (no thresholds in config)

**View Coverage:**
```bash
node --test --test-reporter=tap # TAP format output
node --test --test-reporter=spec # Spec format (human-readable)
# Coverage collection: requires Node.js 18.3+ with --coverage flag (experimental)
```

**Current State:**
- No coverage threshold configured
- No coverage reports generated in CI
- Ad-hoc testing—developers verify by running tests

**Test Examples by Module:**
- `memoryRepo.test.js` — 100% coverage of repository operations
- `arco.test.js` — Full ARCO flow with masking, validation, deletion
- `curp.test.js` — Validation rules, normalization, edge cases
- `consentimiento.test.js` — Privacy policy versioning
- `codigoPostal.test.js` — Postal code validation

## Test Types

**Unit Tests:**
- Scope: Single function or class
- Examples: `curp.test.js` tests CURP_REGEX and validation schema
- Approach: Direct function call, verify output
- Setup: Load module with env vars, call function
- No external dependencies (mock repo satisfies that)

**Integration Tests:**
- Scope: Multiple components working together (repository + routes + middleware)
- Examples: `arco.test.js` full registration + ARCO query flow
- Approach: HTTP requests to app, verify responses and side effects
- Setup: Create app with mock repository, supertest for requests
- Tests data persistence: draft creation → update → retrieval

**E2E Tests:**
- Framework: Not implemented
- Approach: Would require Playwright, Cypress, or similar
- Client has no tests configured

**HTTP/API Tests:**
- Tool: `supertest` library
- Pattern: `request(app).post('/path').send(body).expect(statusCode)`
- Used in: `arco.test.js`

## Common Patterns

**Async Testing:**
```javascript
test('should save and retrieve data', async () => {
  const repo = crearRepositorioMemoria();
  
  // Create and update
  const draft = await repo.crearDraft();
  const actualizado = await repo.actualizarDraft(draft.id, { faseActual: 1 });
  
  // Retrieve and verify
  const recuperado = await repo.obtenerDraft(draft.id);
  assert.equal(recuperado.faseActual, 1);
});
```

**HTTP Testing with SuperTest:**
```javascript
test('flujo ARCO: consulta con datos enmascarados y eliminación', async () => {
  const folio = await crearPreRegistro();
  assert.match(folio, /^CC-\d{4}-[A-Z0-9]{6}$/);
  
  // Query with ARCO
  const consulta = await request(app)
    .post('/api/arco/consulta')
    .send({ folio, fechaNacimiento: personales.fechaNacimiento })
    .expect(200);
  
  // Verify masked data
  assert.equal(consulta.body.datosPersonales.curp, 'PEGG' + '*'.repeat(14));
  
  // Test deletion
  await request(app)
    .post('/api/arco/eliminar')
    .send({ folio, fechaNacimiento: personales.fechaNacimiento })
    .expect(200);
});
```

**Validation Testing:**
```javascript
test('acepta CURP en minúsculas (se normaliza a mayúsculas)', () => {
  const r = esquemaDatosPersonales.safeParse({ ...base, curp: 'pegg850312mdfrrr04' });
  assert.equal(r.success, true);
  assert.equal(r.data.curp, 'PEGG850312MDFRRR04');
});

test('rechaza CURP con formato inválido', () => {
  const invalidas = ['PEGG850312MDFRRR0', 'PEGG851312MDFRRR04', /* ... */];
  for (const curp of invalidas) {
    const r = esquemaDatosPersonales.safeParse({ ...base, curp });
    assert.equal(r.success, false, `debería rechazar: ${curp}`);
  }
});
```

**Data Isolation:**
```javascript
test('las copias devueltas no comparten referencia con el almacén', async () => {
  const repo = crearRepositorioMemoria();
  const draft = await repo.crearDraft();
  
  // Get reference and mutate it
  const a = await repo.obtenerDraft(draft.id);
  a.datos.hackeo = 'mutación externa';
  
  // Get fresh reference, verify mutation didn't persist
  const b = await repo.obtenerDraft(draft.id);
  assert.equal(b.datos.hackeo, undefined);
});
```

**Error Validation:**
```javascript
test('rechaza folios con formato inválido', async () => {
  await request(app)
    .post('/api/arco/consulta')
    .send({ folio: "CC-2026'; DROP TABLE pre_registros;--", fechaNacimiento: '1990-01-01' })
    .expect(422);  // Unprocessable entity
});
```

## Test Execution

**Running Tests:**
```bash
# All tests
npm --prefix server test

# Specific test file
npm --prefix server test -- tests/memoryRepo.test.js

# With grep pattern (Node.js 18.6+)
npm --prefix server test -- --grep "ciclo de vida"
```

**Test Discovery:**
- Automatic: `node --test` finds all `*.test.js` and `*.spec.js` files recursively
- Files in `server/tests/` directory are discovered automatically
- No configuration needed for discovery

**Parallel vs Sequential:**
- Node.js `node --test` runs tests in isolation (isolated event loop per test)
- Sequential by default within a file, but can run concurrently with proper flags
- Recommended: Sequential for this codebase given shared mock repository

## Assertions Used

**From `node:assert/strict`:**
- `assert.ok(value)` — truthy check
- `assert.equal(actual, expected)` — strict equality (===)
- `assert.deepEqual(actual, expected)` — deep object comparison
- `assert.match(string, regex)` — regex match
- `assert.throws(() => { }, ErrorClass)` — exception checking (not seen but available)

**Patterns Observed:**
```javascript
assert.ok(draft.id);                           // Check existence
assert.equal(draft.faseActual, 0);             // Check value
assert.deepEqual(draft.datos, {});             // Check object
assert.match(folio, /^CC-\d{4}-[A-Z0-9]{6}$/); // Check format
```

## Client Testing

**Current State:** No tests configured for React client

**Test Framework Not Set Up:** No Jest, Vitest, or React Testing Library

**To Add Tests:**
- Install test framework: `npm install --save-dev vitest @testing-library/react @testing-library/user-event`
- Create test files: `client/src/**/*.test.tsx`
- Add test script: `"test": "vitest"` in client/package.json
- Follow server test patterns: async, explicit assertions, env setup

---

*Testing analysis: 2026-07-15*
