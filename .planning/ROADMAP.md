# Roadmap: ClinicConnect — Corrección de validación CURP

## Overview

A scoped bug-fix milestone against an already-audited codebase (`ROADMAP_VALIDACION_CURP_RFC.md`). The backend CURP regex currently rejects patients born in 2000 or later; the frontend masking function over-exposes one extra character of the CURP on the confirmation screen; and the frontend's CURP pattern is looser than the backend's, so invalid formats aren't caught until submission. This milestone fixes the backend validation first (it's the blocking bug), then aligns the frontend to match — masking, pattern, and the test infrastructure needed to keep both from drifting again. RFC and CURP semantic cross-validation are explicitly out of scope (v2).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Backend CURP Regex Fix** - Patients born in 2000+ can pass backend CURP validation, with regression test coverage
- [ ] **Phase 2: Frontend CURP Consistency & Test Infrastructure** - Frontend masking and pattern validation match the corrected backend behavior, backed by a new client test suite

## Phase Details

### Phase 1: Backend CURP Regex Fix
**Goal**: Patients born in 2000 or later can complete pre-registration; backend CURP validation matches the official 18-character CURP format, with regression coverage so the bug can't silently return.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: CURP-01, CURP-02
**Success Criteria** (what must be TRUE):
  1. A CURP for a patient born in 2000+ with a letter in position 17 (e.g. `MAPA000115HDFRRLA1`) is accepted by backend validation.
  2. A CURP for a patient born before 2000 with a digit in position 17 continues to be accepted (no regression).
  3. A CURP with an invalid position-17 character or a malformed check digit (position 18) is rejected by backend validation.
  4. `server/tests/curp.test.js` contains and passes test cases covering valid post-2000 CURPs and their corresponding invalid variants.
**Plans**: TBD

### Phase 2: Frontend CURP Consistency & Test Infrastructure
**Goal**: Frontend CURP masking and pattern validation match the corrected backend behavior, backed by a working client test suite, so PII isn't over-exposed on screen and format errors surface before submission instead of after.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CURP-03, CURP-04, CURP-05, CURP-06
**Success Criteria** (what must be TRUE):
  1. The CURP shown on the confirmation screen masks all but the first 4 characters (matching the already-correct server-side masking behavior).
  2. `client/package.json` has a working Vitest + Testing Library setup runnable via a standard test command.
  3. A passing regression test for `enmascararCurp` exists that would fail if masking reverted to exposing 5 characters.
  4. The `curp` field pattern in `phases.config.json` matches the corrected backend regex from Phase 1, verified by a passing test that accepts a valid post-2000 CURP and rejects a malformed one in the wizard form before it would reach the backend.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend CURP Regex Fix | 0/TBD | Not started | - |
| 2. Frontend CURP Consistency & Test Infrastructure | 0/TBD | Not started | - |
