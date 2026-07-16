# ClinicConnect — Portal de Pre-Registro de Pacientes

## What This Is

A public web portal where patients complete a multi-phase pre-registration form (personal data, address, clinical data, privacy consent) before a clinic visit, plus a self-service ARCO rights flow (access/deletion by folio + birth date). Built with React (Vite) on the frontend and Express + PostgreSQL on the backend, with dynamic phase configuration and encryption of sensitive clinical data.

## Core Value

A patient can complete pre-registration and get a valid folio without the data being wrong, mismatched between what the form allowed and what the backend accepted, or leaked on screen.

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

None — all milestone requirements validated.

### Out of Scope

- RFC field/validation — not currently implemented anywhere in the app (config, schema, or backlog); adding it requires a business/compliance decision on whether pre-registration needs RFC at all, and if so where in the wizard. Documented in `ROADMAP_VALIDACION_CURP_RFC.md` as a pending decision, not a bug.
- Semantic cross-validation of CURP against captured birthdate/sex fields — already tracked as its own backlog item (`BACKLOG.md` #5); depends on the CURP regex fix landing first but is a separate piece of work.
- Exposing the validation regex via a public config API (`GET /api/config`) as a single source of truth — user chose the lower-effort duplication approach (2.1a) instead; revisit only if pattern drift becomes a recurring problem.

## Context

- Audit already completed and documented in `ROADMAP_VALIDACION_CURP_RFC.md` (2026-07-15), based on review of `server/src/validation/schemas.js`, `client/src/components/wizard/PhaseRenderer.tsx`, `server/src/config/phases.config.json`, `client/src/utils/mask.ts`, and `.planning/codebase/CONCERNS.md`.
- The frontend/backend validation split is a known architectural pattern (schemas defined once in backend, frontend reads via `/api/phases` and replicates as HTML5 constraints) — see `ARCHITECTURE.md` "Anti-Patterns" and "Cross-Cutting Concerns" sections. This milestone works within that pattern rather than changing it.
- `client/` currently has no test runner at all; adding Vitest is new infrastructure, not just new tests.
- CURP validation bugs are user-facing and data-safety issues: the regex bug blocks registration entirely for patients born 2000+, and the masking bug leaks PII on the confirmation screen.

## Constraints

- **Compatibility**: Fixes must not change the `Fase`/`Draft`/`Record` data structures or API contracts — this is a bug-fix and hardening milestone, not a redesign.
- **Test infra**: Backend already has `node:test` + Supertest; client test runner (Vitest) is being introduced fresh in this milestone, so keep initial client test setup minimal (config + first tests only).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Bundle Fase 1 + Fase 2 from the existing roadmap into one milestone | Fase 2 items depend on the Fase 1 CURP regex fix and touch overlapping files; doing both avoids a second pass | — Pending |
| Duplicate the corrected CURP regex into `phases.config.json` (roadmap option 2.1a) rather than exposing it via a public config API (2.1b) | Lower effort; drift risk is small and acceptable for now | — Pending |
| RFC implementation excluded from this milestone | Requires a business/compliance decision not yet made; not a bug to fix | — Pending |

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
*Last updated: 2026-07-16 after Phase 2 (Frontend CURP Consistency & Test Infrastructure) completion — final phase of milestone v1.0*
