# Roadmap: ClinicConnect — Portal de Pre-Registro de Pacientes

## Milestones

- ✅ **v1.0 CURP Validation Fix** — Phases 1-2 (shipped 2026-07-16)
- 🚧 **v2.0 Validación RFC y CURP semántica** — Phases 3-4 (in progress)

## Phases

**Phase Numbering:**

- Integer phases (3, 4): Planned milestone work. Numbering continues from v1.0 (ended at Phase 2).
- Decimal phases (3.1, 3.2): Urgent insertions (marked with INSERTED).

<details>
<summary>✅ v1.0 CURP Validation Fix (Phases 1-2) — SHIPPED 2026-07-16</summary>

- [x] Phase 1: Backend CURP Regex Fix (1/1 plans) — completed 2026-07-15
- [x] Phase 2: Frontend CURP Consistency & Test Infrastructure (2/2 plans) — completed 2026-07-16

Full detail archived at `.planning/milestones/v1.0-ROADMAP.md`.

</details>

### v2.0 Validación RFC y CURP semántica (Phases 3-4)

- [x] **Phase 3: CURP Semantic Cross-Validation** - Backend rejects a CURP whose encoded birthdate/sex contradicts the separately captured `fechaNacimiento`/`sexo` — completed 2026-07-17
- [ ] **Phase 4: RFC Capture & Masking** - Optional RFC field, format-validated on both layers and masked to the first 4 characters on the confirmation screen and in ARCO access responses

## Phase Details

### Phase 3: CURP Semantic Cross-Validation

**Goal**: The backend rejects a pre-registration whose CURP silently contradicts the birthdate or sex the patient entered, so a folio can never be issued against internally inconsistent identity data. Implemented as a cross-field validation refinement on `esquemaDatosPersonales` (`server/src/validation/schemas.js`) — no change to the `Fase`/`Draft`/`Record` structures or API contracts, only stricter rejection of contradictory input.
**Depends on**: Nothing (first phase of v2.0; builds on v1.0's shipped, corrected CURP regex)
**Requirements**: CURP-07
**Success Criteria** (what must be TRUE):

  1. A `datos_personales` payload whose CURP birthdate (positions 5–10, `yymmdd`) does not match the last two year digits, month, and day of the entered `fechaNacimiento` is rejected with a field-level validation error (422).
  2. A payload whose CURP sex letter (position 11, `H`/`M`) contradicts the entered `sexo` is rejected with a field-level validation error.
  3. A payload with `sexo: 'NE'` skips the sex cross-check and is accepted (no CURP encodes 'NE'), while the birthdate cross-check still applies.
  4. A payload whose CURP birthdate and sex agree with the entered `fechaNacimiento`/`sexo` continues to pass validation (no regression for existing valid submissions).
  5. Backend `node:test` coverage locks each case: mismatched birthdate rejected, mismatched sex rejected, `NE` sex-skip accepted, and a fully consistent payload accepted.

**Plans**: 1 plan

Plans:
- [x] 03-01-PLAN.md — Add CURP↔fechaNacimiento/sexo semantic cross-check (.superRefine) to esquemaDatosPersonales, fix the pre-existing post-2000 fixture, and lock all cases with node:test

### Phase 4: RFC Capture & Masking

**Goal**: A patient can enter their RFC as an optional field that is format-validated on both layers and never shown in full — masked to its first 4 characters on the confirmation screen and in ARCO access responses, exactly mirroring CURP masking. The RFC field is added as an optional, additive field to `datos_personales`, so existing drafts, records, and API responses stay backward-compatible (no existing field renamed or restructured, no API contract broken).
**Depends on**: Nothing (independent of Phase 3; sequence after Phase 3 since both edit `esquemaDatosPersonales`)
**Requirements**: RFC-01, RFC-02
**Success Criteria** (what must be TRUE):

  1. The wizard's "Datos personales" phase shows an optional RFC field; leaving it blank still lets the patient submit and receive a folio.
  2. A well-formed RFC — 13 characters (persona física) or 12 characters (persona moral) — is accepted and normalized to uppercase by both the frontend `pattern` (`phases.config.json`) and the backend Zod schema (`schemas.js`).
  3. A malformed RFC is rejected with a field-level validation error on the frontend (before submission) and re-rejected by the backend.
  4. On the confirmation screen (`Confirmacion.tsx` `MASCARAS`), an entered RFC displays with only its first 4 characters visible and the remainder masked (parity with CURP).
  5. An ARCO access response (`server/src/routes/arco.js`) returns the RFC masked to its first 4 characters, with client/server masking parity locked by regression tests.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 3 → 4

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|-----------------|--------|-----------|
| 1. Backend CURP Regex Fix | v1.0 | 1/1 | Complete | 2026-07-15 |
| 2. Frontend CURP Consistency & Test Infrastructure | v1.0 | 2/2 | Complete | 2026-07-16 |
| 3. CURP Semantic Cross-Validation | v2.0 | 1/1 | Complete | 2026-07-17 |
| 4. RFC Capture & Masking | v2.0 | 0/? | Not started | - |
