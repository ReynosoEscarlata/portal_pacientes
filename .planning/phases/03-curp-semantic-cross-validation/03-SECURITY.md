---
phase: 3
slug: curp-semantic-cross-validation
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-17
---

# Phase 3 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Patient browser → `PUT /api/registros/draft/:id/fase/datos_personales` | Untrusted client input (CURP, fechaNacimiento, sexo) crosses into backend validation | PII: CURP, birthdate, sex |
| `esquemaDatosPersonales.superRefine()` → draft storage | Validated data crosses from the Zod validation layer into the draft persistence layer | PII: CURP, birthdate, sex (unencrypted at this phase — `datos_personales` is not a `sensible` phase) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Tampering | `esquemaDatosPersonales.superRefine` (`server/src/validation/schemas.js:56-80`) | high | mitigate | Enforced at phase-save time in the standard patient flow: `datos_personales` can only enter a draft via `PUT .../fase/:faseId`, which runs `esquemaDatosPersonales.parse` (`registros.js:59`); the `.superRefine()` compares CURP positions 5-10/11 against `fechaNacimiento`/`sexo` and raises a `curp` issue on mismatch, rejecting the payload with 422 before it ever reaches a draft. The folio-issuing `enviar` endpoint trusts already-validated draft data (no re-validation); the seed script and opt-in legacy handler write records without this schema — both out of scope for CURP-07. | closed |
| T-03-02 | Information Disclosure | `.superRefine()` messages + `manejadorErrores` (`server/src/middleware/errorHandler.js`) | low | mitigate | Error messages are generic Spanish sentences ("La fecha de nacimiento de la CURP no coincide...", "El sexo de la CURP no coincide...") that reveal only that a mismatch exists — never the specific CURP positions or the full CURP value. No CURP is logged. `manejadorErrores` emits only `{ campo, mensaje }`, no stack trace or PII. The early-return format guard prevents redundant duplicate `curp` issues on already-invalid input, and is regression-locked by a dedicated test (`issues.length === 1`). | closed |
| T-03-03 | Tampering (supply chain) | npm dependency surface | low | accept | No new npm packages installed this phase. The phase extends the already-present `zod` (`^3.23.8`, installed 3.25.76) using its stable core `.superRefine()`/`ctx.addIssue` API. No supply-chain checkpoint required. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-03 | No new npm dependencies introduced; reuses the existing, already-audited `zod` package. No incremental supply-chain surface to track. | GSD secure-phase (automated, L1 ASVS) | 2026-07-17 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-17 | 3 | 3 | 0 | /gsd-secure-phase (Claude, orchestrator — L1 short-circuit path per workflow §3: `threats_open: 0`, register authored at plan time, ASVS L1) |

**Verification method:** Grep-level (L1 depth) evidence check against live source, matching the register built during phase planning and confirmed independently by `/gsd-execute-phase`'s `gsd-verifier` (`03-VERIFICATION.md`, 8/8 must-haves passed). Confirmed: `.superRefine()` present at `schemas.js:56` with the described guard, comparisons, `path:['curp']` issues, and generic messages (`schemas.js:65-77`); `git diff` shows no `package.json` changes in either `server/` or `client/` since the phase's research commit, confirming T-03-03's no-new-dependency claim.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-17
