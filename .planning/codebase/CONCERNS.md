# Codebase Concerns

**Analysis Date:** 2026-07-15

## Known Bugs

**Bug 1 — CURP validation fails for people born in 2000 or later:**
- Symptoms: Frontend accepts CURP format, but backend rejects with 422 "La CURP no tiene un formato válido" for patients born 2000+
- Files: `server/src/validation/schemas.js` (line 5, `CURP_REGEX`)
- Trigger: Submit CURP for anyone born 2000+ (e.g., `MAPA000115HDFRRLA1`)
- Cause: Regex ends with `\d{2}$` requiring digit at position 17; official CURP uses digit for pre-2000 births and letter for 2000+ births
- Fix approach: Change regex end from `\d{2}$` to `[A-Z0-9]\d$`
- Related test gap: `server/tests/curp.test.js` only tests pre-2000 CURPs

**Bug 2 — Draft data fails to restore after page reload:**
- Symptoms: Navigate away and return; wizard appears empty even though Network tab shows `GET /api/registros/draft/:id` returns data
- Files: `client/src/context/WizardContext.tsx` (line 53, `iniciar` function)
- Trigger: Enter data, reload page, observe empty form despite data in server
- Cause: Code reads `draft.respuestas` but API returns `draft.datos`; TypeScript doesn't catch due to `any` typing
- Fix approach: Change line 53 to `setDatos(draft.datos ?? {})` and type API responses with interface
- Impact: All user progress lost on page reload

**Bug 3 — Progress bar percentage calculation is off-by-one:**
- Symptoms: Progress starts at 0%, last phase shows 80%, never reaches 100% despite text saying "Fase 5 de 5"
- Files: `client/src/components/ProgressBar.tsx` (line 7)
- Trigger: Navigate through wizard phases
- Cause: Formula `(indice / total) * 100` uses 0-based index; should be `((indice + 1) / total) * 100`
- Fix approach: Update line 7 to use `(indice + 1)` in numerator
- Consistency issue: Text on line 22 already uses `indice + 1` — code/display mismatch is the detection clue

**Bug 4 — CURP masking exposes one extra character in summary:**
- Symptoms: Confirmation phase shows `PEGG8*************` (5 visible chars) instead of required `PEGG****…` (4 chars per privacy law)
- Files: `client/src/utils/mask.ts` (line 5, `enmascararCurp` function)
- Trigger: Review confirmation page; compare with ARCO consultation (where masking is correct)
- Cause: `curp.slice(0, 5)` should be `curp.slice(0, 4)` — exposes birth year first digit
- Fix approach: Change line 5 to `curp.slice(0, 4) + '*'.repeat(Math.max(0, curp.length - 4))`
- Impact: Privacy leakage of personally identifiable information (5th character is birth year)
- Design smell: Identical logic duplicated in `server/src/utils/mask.js` (line 3, correctly) — single source of truth violated

---

## Tech Debt

**Duplicated Data Masking Logic:**
- Problem: `client/src/utils/mask.ts` and `server/src/utils/mask.js` implement identical masking functions
- Files: `client/src/utils/mask.ts` (enmascararCurp, enmascararTelefono, enmascararCorreo), `server/src/utils/mask.js`
- Impact: Bug in client version not caught; maintenance burden; server version is correct, client is wrong
- Fix approach: 
  - For now: Copy correct implementation from server to client as regression fix
  - Long-term: Extract to shared library or API should always mask before sending to client

**Missing Client-Side Tests:**
- Problem: Client has zero tests; only backend has 5 test files
- Files: `client/package.json` (missing vitest/jest), no `*.test.ts` or `*.test.tsx` files in `client/src/`
- Impact: Cannot detect regressions in UI logic (see bugs 2, 3, 4 — all would be caught by tests)
- Affected areas:
  - WizardContext data flow and draft restoration
  - ProgressBar percentage calculation
  - Data masking utilities
  - Form validation and error display
  - API error handling
- Fix approach: Add vitest to `client/package.json`, create test files for components and hooks
- Priority: High — client bugs are user-facing

**Type Safety Gaps:**
- Problem: API responses typed as `any`, preventing TypeScript from catching data structure mismatches
- Files: 
  - `client/src/api/client.ts` (line 13: `payload: any`, line 22: return type `Promise<any>`)
  - `client/src/pages/ConsultaArco.tsx` (line 18: `resultado: any`)
  - `client/src/context/WizardContext.tsx` (line 51: `draft` destructured without typing)
- Impact: Bug #2 (draft restoration) not caught at compile time
- Fix approach:
  - Define interfaces for each API response (`DraftRespuesta`, `ConfigPortal`, `ArcoRespuesta`)
  - Apply strict typing to all fetch responses
  - Enable `strict: true` in `client/tsconfig.json`

---

## Security Considerations

**Environment Configuration Validation:**
- Risk: `ENCRYPTION_KEY` defaults to empty string (line 8 in `server/src/config/env.js`); can be deployed to production without encryption if unset
- Files: `server/src/config/env.js`, `server/src/crypto/cipher.js`
- Current mitigation: Cipher falls back to hardcoded development key if hex validation fails; throws error only in production
- Recommendation: 
  - Add startup validation that throws immediately if `NODE_ENV === 'production'` and `ENCRYPTION_KEY` is not a valid 64-char hex string
  - Same for database password: reject empty `PGPASSWORD` in production
  - Consider using a secrets management service (AWS Secrets Manager, HashiCorp Vault)

**Database Connection Security:**
- Risk: Default PostgreSQL password is empty string (line 16 in `server/src/config/env.js`), pool size hardcoded to 10 without backpressure
- Files: `server/src/repositories/postgresRepo.js` (line 28)
- Current mitigation: In-memory fallback for testing; depends on Docker/infrastructure to enforce strong credentials
- Recommendation:
  - Document production credential requirements
  - Add connection pool tuning per environment (separate dev/prod configs)
  - Implement connection timeout and retry logic

**CORS and Origin Validation:**
- Risk: CORS origin is configurable but defaults to localhost; single origin only (no array support for multiple environments)
- Files: `server/src/middleware/security.js` (line 10)
- Current mitigation: Requires explicit `CORS_ORIGIN` env var
- Recommendation: If using multiple frontend URLs (staging/prod), update middleware to support comma-separated origins

**Rate Limiting Scalability:**
- Risk: Rate limiter uses in-memory store; won't work with multiple server instances (distributed systems)
- Files: `server/src/middleware/rateLimit.js`
- Impact: Bypassed if load balanced across instances
- Recommendation: Use Redis-backed rate limiting for production deployment

**Audit Trail Missing:**
- Risk: No audit logging for sensitive operations (ARCO consulta/eliminar, data encryption/decryption, consent acceptance)
- Files: `server/src/routes/arco.js`, `server/src/middleware/errorHandler.js`
- Impact: Cannot investigate data access or deletions
- Recommendation: Add structured logging for ARCO operations with timestamp, IP, folio (hashed), outcome

---

## Performance Bottlenecks

**Database Query Optimization:**
- Problem: No indexes defined or mentioned for frequent queries
- Files: `server/src/repositories/postgresRepo.js` — `obtenerDraft(id)` (line 42), `obtenerRegistroPorFolio(folio)` (line 84), `existeFolio(folio)` (line 98)
- Cause: Schema not visible, but `folio` and `id` lookups will do full table scans without indexes
- Improvement path: Add `CREATE INDEX idx_drafts_id ON drafts(id)` and `CREATE INDEX idx_pre_registros_folio ON pre_registros(folio)`

**Folio Collision Detection Loop:**
- Problem: Lines 113–115 in `server/src/routes/registros.js` retry folio generation in a tight loop
- Cause: No uniqueness constraint enforced by DB; relies on sequential queries
- Improvement path: Make folio generation deterministic or add DB uniqueness constraint

**Connection Pool Size:**
- Problem: Hardcoded to 10 connections (line 28 in `server/src/repositories/postgresRepo.js`)
- Impact: May be too small for high load, too large for development
- Improvement path: Make configurable via `PG_POOL_MAX` env var with sensible defaults (5 for dev, 20 for prod)

---

## Fragile Areas

**WizardContext State Management:**
- Files: `client/src/context/WizardContext.tsx`
- Why fragile:
  - Multiple state variables (`datos`, `faseActual`, `maxFase`, `draftId`) must stay in sync
  - `iniciar` callback has complex branching (create vs. restore path)
  - Dependencies in `useCallback` array could easily get out of sync (line 72, 87)
  - No tests to catch state machine violations
- Safe modification:
  - Add tests for `iniciar` path with mocked API responses
  - Consider using useReducer to manage phase transitions
  - Add invariant checks (e.g., `faseActual <= maxFase`)
- Test coverage gaps: Draft restoration (critical), phase transitions, error recovery

**Form Data Validation Split:**
- Files: `client/src/components/wizard/PhaseRenderer.tsx` (frontend validation), `server/src/validation/schemas.js` (backend validation)
- Why fragile: Validation logic duplicated (CURP pattern on both sides); frontend pattern is lax (`^[A-Za-z0-9]{18}$`), backend is strict
- Safe modification: Remove client-side pattern validation, rely on server Zod schemas via network response errors
- Risk: Client-side validation UX will degrade until server error handling is improved

**API Error Handling in Components:**
- Files: `client/src/pages/ConsultaArco.tsx` (lines 31–33, 47–48)
- Why fragile: Generic error messages hide root cause; `err instanceof ApiError` check is the only differentiation
- Impact: User sees "No se pudo realizar la consulta" for both network errors and validation errors
- Test coverage gaps: Error scenarios (404, 422, 500, network timeout)

---

## Scaling Limits

**In-Memory Rate Limiting:**
- Current capacity: 100 requests/15 min per IP (standard tier), 15 for ARCO (strict tier)
- Limit: Single-instance only; scales to ~50 concurrent users
- Scaling path: Migrate to Redis-backed rate limiting; remove in-memory skip in distributed setup

**Database Connection Pool:**
- Current capacity: 10 connections hardcoded
- Limit: ~10 concurrent database requests; queuing after that
- Scaling path: Make configurable, increase to 20–50 for production, monitor connection time

**Memory Draft Storage (Mock Mode):**
- Current capacity: All drafts held in RAM (see `server/src/repositories/memoryRepo.js`)
- Limit: Leaks memory over time as completed drafts are not cleaned up
- Scaling path: Implement draft cleanup job (delete drafts > 7 days old) or always use PostgreSQL

---

## Dependencies at Risk

**Node.js Version Mismatch:**
- Risk: No `.nvmrc` or `engines` field in `package.json`; TypeScript version pinned to `~5.6.2` (allows 5.6.0–5.6.x)
- Impact: Different developers may use incompatible Node versions
- Recommendation: Add `.nvmrc` with specific version, add `"engines": { "node": ">=18.0.0" }` to both `package.json` files

**Helmet Security Headers:**
- Status: Using `helmet()` default configuration (line 7 in `server/src/middleware/security.js`)
- Risk: Defaults may change in major version upgrades
- Recommendation: Explicitly configure CSP, X-Frame-Options, etc. rather than relying on defaults

**Zod Validation:**
- Status: Using `^3.23.8` (caret allows minor updates)
- Risk: New minor versions could introduce stricter validation
- Impact: Could break existing data validation logic
- Recommendation: Pin to exact version `3.23.8` or monitor Zod releases

---

## Test Coverage Gaps

**Backend API Routes:**
- Untested area: `POST /api/registros/draft/:id/enviar` (submission workflow)
- Files: `server/src/routes/registros.js` (lines 92–131)
- Risk: Folio collision logic, draft cleanup on submit untested
- Priority: High

**Client Context and Hooks:**
- Untested area: `WizardProvider`, `useWizard`, draft restoration flow
- Files: `client/src/context/WizardContext.tsx`
- Risk: State management bugs live in production (see bug #2)
- Priority: High

**Error Recovery:**
- Untested area: Network errors, API 422/500 responses, partial data states
- Files: `client/src/components/wizard/Wizard.tsx`, `client/src/pages/ConsultaArco.tsx`
- Risk: User cannot recover from errors; stuck in error state
- Priority: Medium

**Data Masking:**
- Untested area: `client/src/utils/mask.ts` (especially `enmascararCurp`)
- Files: `client/src/utils/mask.ts`
- Risk: Privacy leakage (see bug #4)
- Priority: High (regression test required)

**ARCO Workflow:**
- Untested area: Both consulta and eliminar operations; date matching, folio validation
- Files: `server/src/routes/arco.js`, `server/tests/arco.test.js` exists but likely incomplete
- Risk: ARCO is legally mandated; errors have compliance implications
- Priority: High

---

## Missing Critical Features

**Production Deployment Readiness:**
- Missing: Health check endpoint (only `/api/salud` exists but no liveness/readiness distinction)
- Impact: Kubernetes/load balancer cannot distinguish between "application booting" and "fatal error"
- Recommendation: Implement separate liveness and readiness probes

**Structured Logging:**
- Missing: Production-grade logging (JSON, levels, trace IDs)
- Impact: Cannot debug issues in production; error IDs (line 24 in `errorHandler.js`) not connected to structured logs
- Recommendation: Integrate pino or winston; log all API requests with response time

**Encryption Key Rotation:**
- Missing: Mechanism to rotate encryption keys without losing access to encrypted data
- Impact: If key is compromised, cannot rotate without decrypting all records
- Recommendation: Add versioning to cipher format (already has `v1` prefix); support multiple keys during rotation

**API Documentation:**
- Missing: OpenAPI/Swagger schema
- Impact: Frontend developers must read code to understand API contract
- Recommendation: Generate from Zod schemas using OpenAPI integration

**Data Export/Archive:**
- Missing: No feature to export user's own data (GDPR/data portability)
- Impact: Violates some data protection regulations
- Recommendation: Add `POST /api/arco/exportar` endpoint

---

## Code Quality Issues

**Inconsistent Error Handling Patterns:**
- Problem: Some routes use `next(err)` (async), some don't have try-catch
- Files: Most routes follow pattern, but middleware/setup code doesn't
- Recommendation: Use express-async-errors or wrap all route handlers consistently

**Magic Strings and Numbers:**
- Problem: Phase IDs, rate limit windows, CURP regex hardcoded throughout
- Files: Multiple files
- Recommendation: Extract to constants file (`server/src/constants.js`)

**Console Logging vs. Structured Logging:**
- Problem: Mix of `console.log`, `console.warn`, `console.error`
- Files: `server/src/crypto/cipher.js`, `server/src/index.js`, `server/src/middleware/errorHandler.js`
- Recommendation: Implement structured logging throughout

---

## Recommendations Priority

**Immediate (blocks deployment):**
1. Fix bugs 1, 2, 3, 4 (see Known Bugs section)
2. Add environment validation for `ENCRYPTION_KEY` in production
3. Add client-side tests for WizardContext, draft restoration, masking

**Short-term (before production use):**
1. Add database indexes for `id` and `folio` lookups
2. Implement structured logging framework
3. Add ARCO audit trail
4. Type all API responses

**Medium-term (scalability):**
1. Migrate rate limiting to Redis
2. Make connection pool size configurable
3. Add cleanup job for stale drafts
4. Implement health check endpoints

**Long-term (compliance/reliability):**
1. Add API documentation (OpenAPI)
2. Implement data export feature
3. Add encryption key rotation mechanism
4. Implement comprehensive monitoring and alerting

---

*Concerns audit: 2026-07-15*
