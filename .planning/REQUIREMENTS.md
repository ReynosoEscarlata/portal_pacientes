# Requirements: ClinicConnect — Portal de Pre-Registro de Pacientes

**Defined:** 2026-07-16 (milestone v2.0)
**Core Value:** A patient can complete pre-registration and get a valid folio without the data being wrong, mismatched between what the form allowed and what the backend accepted, or leaked on screen.

## v2.0 Requirements

Scope: the two requirements deferred at v1.0 close (RFC-01, CURP-07) plus SEED-001, which
germinated during the milestone seed scan (trigger "when RFC-01 lands" matched) and became RFC-02.
REQ-ID numbering continues from v1.0 (`.planning/milestones/v1.0-REQUIREMENTS.md`).

### RFC

- [ ] **RFC-01**: Patient can enter their RFC (optional field) in the `datos_personales` wizard phase, and it is validated for format on both layers — `pattern` in `server/src/config/phases.config.json` and Zod schema in `server/src/validation/schemas.js` — accepting 12-character (persona moral) and 13-character (persona física) RFCs, normalized to uppercase
- [ ] **RFC-02**: RFC is masked everywhere it is displayed — confirmation screen (`Confirmacion.tsx` MASCARAS) and ARCO access responses (`server/src/routes/arco.js`) — exposing only the first 4 characters, with client/server masking parity locked by regression tests (germinated from SEED-001)

### CURP Semantic Validation

- [ ] **CURP-07**: Backend rejects a `datos_personales` payload whose CURP-encoded birthdate (positions 5–10, `yymmdd`) or sex letter (position 11, `H`/`M`) contradicts the separately captured `fechaNacimiento`/`sexo` fields, with a field-level validation error; `sexo: 'NE'` skips the sex cross-check (no CURP encodes it)

## Future Requirements

Deferred beyond v2.0. Tracked but not in current roadmap.

- RFC as a required field (needs full business/compliance decision)
- RFC↔CURP consistency cross-check (e.g. shared name-derived prefix)
- BACKLOG.md #1–#4 (correo de confirmación, panel de recepción, caducidad de borradores, derecho de rectificación ARCO)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Public `/api/config` shared-regex endpoint | v1.0 decision: duplication + byte-identity test is the working pattern; revisit only on recurring drift |
| Check-digit (mod-10/11) algorithms for CURP pos-18 or RFC | Format-level validation only, consistent with v1.0 decision D-04 |
| CURP century differentiator (pos 17) vs birth-year cross-check | Post-2000 letter rule has RENAPO edge cases; CURP-07 covers birthdate/sex only, the deterministic part |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RFC-01 | — | Pending roadmap |
| RFC-02 | — | Pending roadmap |
| CURP-07 | — | Pending roadmap |

**Coverage:**

- v2.0 requirements: 3 total
- Mapped to phases: pending roadmap
- Unmapped: 3 (roadmap pending)

---
*Requirements defined: 2026-07-16 at v2.0 milestone start (RFC-02 germinated from SEED-001)*
