# Milestones

## v1.0 CURP Validation Fix (Shipped: 2026-07-16)

**Phases completed:** 2 phases, 3 plans, 8 tasks

**Key accomplishments:**

- Fixed CURP_REGEX position-17 tail (`[A-Z0-9]\d$` instead of `\d{2}$`) so post-2000 patients with a letter homoclave differentiator pass backend Zod validation, with new node:test regression coverage for both the fix and its invalid variants.
- Stood up the client's first Vitest + Testing Library runner and fixed `enmascararCurp` to expose 4 characters (not 5), locked in by an exact-equality regression test mirroring the server-side precedent.
- Synced `phases.config.json`'s curp pattern byte-for-byte with the corrected backend `CURP_REGEX`, and proved client-side rejection/acceptance through the actual rendered `PhaseRenderer` form using a new reusable `renderConWizard` test harness that mocks `useWizard` instead of exporting `WizardContext`.

---
