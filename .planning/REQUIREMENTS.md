# Requirements: ClinicConnect — Portal de Pre-Registro de Pacientes

**Defined:** 2026-07-15
**Core Value:** A patient can complete pre-registration and get a valid folio without the data being wrong, mismatched between what the form allowed and what the backend accepted, or leaked on screen.

## v1 Requirements

Scope is fully specified by the existing audit in `ROADMAP_VALIDACION_CURP_RFC.md` (Fases 1–2). Research confirmed the CURP regex fix is correct per the official CURP format (`.planning/research/SUMMARY.md`).

### CURP Validation (bugs)

- [ ] **CURP-01**: `CURP_REGEX` in `server/src/validation/schemas.js` accepts CURPs for patients born in 2000+ (letter in position 17) as well as pre-2000 (digit in position 17); position 18 remains always a digit
- [ ] **CURP-02**: `server/tests/curp.test.js` covers valid CURPs with the alphabetic post-2000 differentiator and corresponding invalid cases (out-of-range letter, malformed check digit)
- [ ] **CURP-03**: `enmascararCurp` in `client/src/utils/mask.ts` masks all but the first 4 characters (not 5), matching the already-correct `server/src/utils/mask.js` behavior
- [ ] **CURP-04**: A regression test exists for `enmascararCurp` (requires CURP-06 test runner)

### CURP Validation (consistency)

- [ ] **CURP-05**: The `curp` field `pattern` in `server/src/config/phases.config.json` matches the corrected `CURP_REGEX` from CURP-01 (duplicated, not sourced from a shared API)

### Test Infrastructure

- [ ] **CURP-06**: `client/package.json` has a working Vitest + Testing Library setup, with initial tests covering `enmascararCurp` (CURP-04) and `PhaseRenderer` CURP pattern validation (CURP-05)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### RFC

- **RFC-01**: Add RFC field to pre-registration wizard (schema, config, masking) — pending business/compliance decision on whether it's required and where it belongs in the flow

### CURP Semantic Validation

- **CURP-07**: Cross-validate CURP birthdate/sex (positions 5–11) against separately captured `fechaNacimiento`/`sexo` fields — already tracked as `BACKLOG.md` #5; depends on CURP-01

## Out of Scope

| Feature | Reason |
|---------|--------|
| RFC implementation | No business/compliance decision yet on whether pre-registration requires it |
| CURP semantic cross-validation | Already tracked separately in `BACKLOG.md` #5; not duplicated here |
| Public `/api/config` endpoint for shared regex source of truth | User chose lower-effort duplication (CURP-05) over this; revisit only if drift becomes recurring |

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CURP-01 | TBD | Pending |
| CURP-02 | TBD | Pending |
| CURP-03 | TBD | Pending |
| CURP-04 | TBD | Pending |
| CURP-05 | TBD | Pending |
| CURP-06 | TBD | Pending |

**Coverage:**
- v1 requirements: 6 total
- Mapped to phases: 0
- Unmapped: 6 ⚠️ (pending roadmap creation)

---
*Requirements defined: 2026-07-15*
*Last updated: 2026-07-15 after initial definition*
