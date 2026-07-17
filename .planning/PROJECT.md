# ClinicConnect — Portal de Pre-Registro de Pacientes

## What This Is

A public web portal where patients complete a multi-phase pre-registration form (personal data, address, clinical data, privacy consent) before a clinic visit, plus a self-service ARCO rights flow (access/deletion by folio + birth date). Built with React (Vite) on the frontend and Express + PostgreSQL on the backend, with dynamic phase configuration and encryption of sensitive clinical data.

## Core Value

A patient can complete pre-registration and get a valid folio without the data being wrong, mismatched between what the form allowed and what the backend accepted, or leaked on screen.

## Current Milestone: v2.0 Validación RFC y CURP semántica

**Goal:** The wizard captures and validates the patient's RFC with masking parity, and cross-validates the CURP against the captured birthdate/sex — closing both requirements deferred from v1.0.

**Target features:**
- RFC field in the pre-registration wizard with format validation (RFC-01, deferred from v1.0)
- RFC masked on the confirmation screen and in ARCO responses, mirroring CURP masking (RFC-02 — germinated from SEED-001)
- Semantic cross-validation of CURP positions 5–11 against captured `fechaNacimiento`/`sexo` (CURP-07, BACKLOG.md #5, deferred from v1.0)

**Key context:** SEED-001 surfaced during milestone scan (trigger: "when RFC-01 lands") and was incorporated as RFC-02. RFC scope assumes the pending business/compliance decision is resolved as "capture RFC as optional field" for this training milestone — recorded in Key Decisions.

## Requirements

### Validated

- ✓ Multi-phase wizard (personal → address → clinical → consent → review) with resumable drafts via localStorage — existing
- ✓ Dual-layer Zod validation (frontend UX hints + backend enforcement) — existing
- ✓ AES-256-GCM encryption of clinical data at rest — existing
- ✓ ARCO rights (access + deletion by folio/birthdate, rate-limited, no folio enumeration) — existing
- ✓ Repository pattern (mock in-memory / PostgreSQL, switchable via `DATA_SOURCE`) — existing
- ✓ CURP regex accepts patients born in 2000+ (`CURP_REGEX` position 17 now accepts the post-2000 letter differentiator) — Validated in Phase 1: Backend CURP Regex Fix
- ✓ Backend test coverage for CURP 2000+ cases (valid alphabetic-differentiator CURPs + corresponding invalid cases) in `server/tests/curp.test.js` — Validated in Phase 1: Backend CURP Regex Fix
- ✓ CURP masking on confirmation screen exposes only the first 4 characters (`enmascararCurp` fixed from 5→4) — Validated in Phase 2: Frontend CURP Consistency & Test Infrastructure
- ✓ Client-side test suite (Vitest + Testing Library) added to `client/package.json`, runnable via standard test command — Validated in Phase 2: Frontend CURP Consistency & Test Infrastructure
- ✓ Regression test for `enmascararCurp` locks the 4-character masking behavior — Validated in Phase 2: Frontend CURP Consistency & Test Infrastructure
- ✓ Frontend CURP pattern in `phases.config.json` matches the corrected backend regex, verified via rendered-form PhaseRenderer test — Validated in Phase 2: Frontend CURP Consistency & Test Infrastructure

### Active

- **RFC-01**: Patient can enter their RFC in the pre-registration wizard and it is validated for format (frontend pattern + backend Zod), as an optional field in `datos_personales`
- **RFC-02**: RFC is masked on the confirmation screen and in ARCO access responses, exposing only the first 4 characters (parity with CURP masking) — germinated from SEED-001
- **CURP-07**: Backend rejects a CURP whose encoded birthdate (positions 5–10) or sex letter (position 11) contradicts the separately captured `fechaNacimiento`/`sexo` fields

### Out of Scope

- Exposing the validation regex via a public config API (`GET /api/config`) as a single source of truth — user chose the lower-effort duplication approach (2.1a) instead; revisit only if pattern drift becomes a recurring problem.
- RFC as a *required* field or RFC↔CURP cross-validation — v2.0 captures RFC as optional with format validation only; obligatoriness needs the full compliance decision.
- Check-digit (mod-10/11) algorithmic validation for CURP position 18 or RFC — format-level validation only, consistent with v1.0 decision D-04.

## Context

- Milestone v1.0 shipped 2026-07-16: both backend CURP regex validation and frontend consistency/masking are fixed, backed by new test coverage on both sides.
- `client/` now has a working Vitest + Testing Library setup (`client/vitest.config.ts`, `client/src/test-utils/setup.ts`, `client/src/test-utils/renderConWizard.tsx`) — this was greenfield infrastructure before this milestone, not just new tests.
- The corrected CURP regex now exists as 3 independently-maintained copies (`server/src/validation/schemas.js`, `server/src/config/phases.config.json`, and a test fixture in `PhaseRenderer.test.tsx`) with no automated equality check between them — flagged in Phase 2 code review (WR-01) as the same drift pattern that caused this milestone's original bug. Worth a small regression test in a future pass.
- The frontend/backend validation split remains a known architectural pattern (schemas defined once in backend, frontend reads via `/api/phases` and replicates as HTML5 constraints) — see `ARCHITECTURE.md` "Anti-Patterns" and "Cross-Cutting Concerns" sections. This milestone worked within that pattern rather than changing it.
- Deferred to v2 backlog: RFC-01 (RFC field in wizard, pending business/compliance decision) and CURP-07 (semantic cross-validation of CURP vs. birthdate/sex, `BACKLOG.md` #5).

## Constraints

- **Compatibility**: Fixes must not change the `Fase`/`Draft`/`Record` data structures or API contracts — this is a bug-fix and hardening milestone, not a redesign.
- **Test infra**: Backend already has `node:test` + Supertest; client test runner (Vitest) is being introduced fresh in this milestone, so keep initial client test setup minimal (config + first tests only).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Bundle Fase 1 + Fase 2 from the existing roadmap into one milestone | Fase 2 items depend on the Fase 1 CURP regex fix and touch overlapping files; doing both avoids a second pass | ✓ Good — Phase 2 built cleanly on Phase 1's regex fix, no rework needed |
| Duplicate the corrected CURP regex into `phases.config.json` (roadmap option 2.1a) rather than exposing it via a public config API (2.1b) | Lower effort; drift risk is small and acceptable for now | ⚠️ Revisit — works today, but code review (Phase 2) flagged 3 hand-maintained regex copies with no automated equality check as a recurring drift risk |
| RFC implementation excluded from this milestone | Requires a business/compliance decision not yet made; not a bug to fix | ✓ Good — correctly scoped out, tracked as RFC-01 in v2 backlog |
| v2.0 scope = RFC-01 + RFC-02 + CURP-07 (the two v1-deferred requirements plus SEED-001) | Both deferred items are unblocked (CURP-01 shipped); SEED-001's trigger matched the milestone scan, so RFC masking ships with the RFC field instead of as a fast-follow | Pending — milestone in planning |
| RFC captured as *optional* field with format validation only | Training milestone: compliance decision assumed resolved as "optional capture"; obligatoriness and RFC↔CURP cross-checks stay out of scope | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-16 at v2.0 milestone start*
