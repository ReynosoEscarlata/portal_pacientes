---
phase: 02-frontend-curp-consistency-test-infrastructure
reviewed: 2026-07-16T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - client/package.json
  - client/src/components/wizard/PhaseRenderer.test.tsx
  - client/src/test-utils/renderConWizard.test.tsx
  - client/src/test-utils/renderConWizard.tsx
  - client/src/test-utils/setup.ts
  - client/src/utils/mask.test.ts
  - client/src/utils/mask.ts
  - client/vitest.config.ts
  - server/src/config/phases.config.json
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-07-16
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed the Vitest/Testing Library infrastructure stand-up, the `enmascararCurp` masking fix, and the `phases.config.json` CURP-regex sync. All tests were re-run locally (`npx vitest run`: 3 files / 8 tests passed) and `tsc --noEmit` was re-run against the full client (`client/tsconfig.json` includes `src`, which covers all new test files): both pass cleanly, and the fixed regex was verified byte-identical to the backend `CURP_REGEX` in `server/src/validation/schemas.js`. No critical bugs or security issues were found. The one substantive concern is structural: the corrected CURP regex is now hand-copied in three independent locations with no automated equality check between them — the exact failure mode (`phases.config.json` drifting from the backend schema) is what this phase itself was created to fix, so the underlying process risk that produced the original bug is still present. Remaining findings are minor test-infrastructure hygiene items.

## Warnings

### WR-01: CURP regex is duplicated in three places with no automated drift check

**File:** `server/src/config/phases.config.json:17`, `server/src/validation/schemas.js:4-5`, `client/src/components/wizard/PhaseRenderer.test.tsx:24-26`

**Issue:** The corrected CURP pattern now exists as three independently-maintained copies:
1. `CURP_REGEX` in `server/src/validation/schemas.js` (the actual backend source of truth, exercised by `server/tests/curp.test.js`).
2. The JSON-escaped `pattern` string in `server/src/config/phases.config.json` (served to the frontend via `/api/phases` and used for client-side pattern validation).
3. A hand-copied fixture string inside `PhaseRenderer.test.tsx` (lines 24-26), used only to build an isolated `FaseConfig` for the test — it is never read from the actual config file.

This is precisely the bug this phase fixed: `phases.config.json` previously held a permissive `^[A-Za-z0-9]{18}$` pattern while the backend enforced the strict CURP grammar (confirmed via `git diff fde4dff..HEAD -- server/src/config/phases.config.json`). Nothing in the test suite asserts that `phases.config.json`'s `curp.pattern` string equals `CURP_REGEX.source` (JSON-unescaped), so a future edit to either `CURP_REGEX` or the JSON pattern (updating one but not the other) would pass all existing tests silently and reintroduce the same client/backend mismatch this phase remediated. The `PhaseRenderer.test.tsx` fixture only proves the *hardcoded copy* behaves correctly — it gives no signal if the real `phases.config.json` drifts from it.

**Fix:** Add a small regression test (e.g. in `server/tests/`) that loads `phases.config.json`, unescapes its `curp.pattern` string, and asserts it equals `CURP_REGEX.source`:
```js
// server/tests/curp-config-sync.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURP_REGEX } from '../src/validation/schemas.js';

test('phases.config.json curp pattern matches backend CURP_REGEX', () => {
  const cfg = JSON.parse(readFileSync(new URL('../src/config/phases.config.json', import.meta.url)));
  const curpCampo = cfg.fases.find((f) => f.id === 'datos_personales')
    .campos.find((c) => c.nombre === 'curp');
  assert.equal(curpCampo.pattern, CURP_REGEX.source);
});
```
This turns the drift risk into a build-time failure instead of a silent runtime mismatch.

## Info

### IN-01: No mock reset between tests in shared test setup

**File:** `client/src/test-utils/setup.ts:9-11`

**Issue:** `setup.ts` only calls `cleanup()` in `afterEach`; it does not call `vi.clearAllMocks()` / `vi.restoreAllMocks()`, and `vitest.config.ts` does not set `clearMocks`/`restoreMocks`. Currently this is harmless because `renderConWizard.tsx` constructs a fresh `vi.fn()` for every context value on every call, so no state leaks between tests today. As more tests are added that share module-level mocks (e.g. mocking `client/src/api/client.ts`) or assert on call counts of the shared `useWizard` mock itself, this omission could cause cross-test pollution that is hard to diagnose.

**Fix:** Add `clearMocks: true` (or `restoreMocks: true`) to `vitest.config.ts`'s `test` block, or call `vi.clearAllMocks()` in `afterEach` in `setup.ts`, so future test files inherit safe defaults.

### IN-02: `client/package.json` test script has no coverage or CI reporting configured

**File:** `client/package.json:10`

**Issue:** `"test": "vitest run"` has no `--coverage` flag or reporter configuration. This is a reasonable minimal starting point per the phase's stated scope ("keep initial client test setup minimal"), but as more components gain test coverage there is no visibility into which files/branches remain untested.

**Fix:** Not required now; flagging for future phases — consider `vitest run --coverage` (with `@vitest/coverage-v8` as a devDependency) once test coverage expands beyond the current three files.

### IN-03: `enmascararTelefono`, `enmascararCorreo`, and `iniciales` remain untested

**File:** `client/src/utils/mask.ts:8-24`, `client/src/utils/mask.test.ts`

**Issue:** `mask.test.ts` only covers `enmascararCurp` (the function this phase fixed). The other three exported functions in the same module (`enmascararTelefono`, `enmascararCorreo`, `iniciales`) have zero test coverage, including edge cases already handled defensively in the code (e.g. `enmascararCorreo` with no `@`, `iniciales` with empty strings). This is pre-existing and out of this phase's stated scope, not a regression, but since the file is now under test infrastructure it is a natural next candidate.

**Fix:** No action required for this phase; consider adding coverage for the remaining `mask.ts` exports in a follow-up phase touching that module.

---

_Reviewed: 2026-07-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
