# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — CURP Validation Fix

**Shipped:** 2026-07-16
**Phases:** 2 | **Plans:** 3 | **Sessions:** 2+

### What Was Built
- Backend `CURP_REGEX` fix accepting post-2000 patients (letter differentiator at position 17), with `node:test` regression coverage for valid and invalid variants.
- Frontend `enmascararCurp` masking fix (5→4 visible characters), closing a PII leak of one birth-year digit on the confirmation screen.
- The client's first test runner (Vitest + Testing Library) plus a reusable `renderConWizard` harness for testing wizard-form components.
- Frontend/backend CURP pattern parity in `phases.config.json`, verified through an actual rendered `PhaseRenderer` form submission test.

### What Worked
- RED→GREEN TDD sequencing (failing regression test committed first, then the fix) on both the backend and frontend phases made each fix trivially verifiable and gave clean, atomic commit history.
- Independent verification (gsd-verifier re-running tests and tracing wiring rather than trusting SUMMARY.md claims) caught nothing wrong here, but is the right posture — it would have caught a bug that "looked" fixed but wasn't wired up.
- Code review surfaced a real, non-obvious risk (WR-01: CURP regex now duplicated in 3 places with no automated equality check) immediately after the fix landed, while the context for why it mattered was still fresh.

### What Was Inefficient
- The working branch (`gsd/phase-01-backend-curp-regex-fix`) was never pushed to `origin`, so by Phase 2 execution `HEAD` had diverged from `origin/HEAD` and the run auto-degraded from parallel worktree isolation to sequential execution. Harmless here (only 2 sequentially-dependent plans), but would cost real parallelism on a milestone with independent plans in the same wave.
- A manual commit (`feat(vscode): add custom settings...`) landed on the branch from outside the GSD tool loop partway through the session, bundling in an accidental gitlink (`.claude/worktrees/roadmap-validacion-curp-rfc` committed as a submodule-like reference with no `.gitmodules` entry) alongside legitimate `.gitignore`/config changes. Not harmful, but worth a `git status` sanity pass before milestone close on any project where commits can come from outside the assistant.

### Patterns Established
- `renderConWizard` (`client/src/test-utils/renderConWizard.tsx`) as the standard harness for any future test that needs to render a wizard phase — mocks `useWizard` rather than exporting the private `WizardContext`, keeping the context module's internals private.
- "Duplicate the validation pattern, then lock the duplication with a test" is now the working approach for keeping the frontend/backend validation split in sync (per `ARCHITECTURE.md`'s existing anti-pattern guidance) — but per WR-01, the "lock it with a test" half still needs to be added as a fast-follow, not deferred indefinitely.

### Key Lessons
1. When a milestone's whole premise is "two copies of a pattern drifted apart," don't ship the re-sync without also shipping (or immediately fast-following with) an automated equality check between the copies — otherwise the same drift will recur silently.
2. Push/merge phase branches promptly rather than batching a full milestone on one unpushed branch — the worktree-isolation auto-degrade is a good safety net, but it silently trades away parallelism until the branch is pushed.
3. On projects where the human may commit directly (via IDE or CLI) alongside assistant-driven commits, run a quick `git log`/`git status` check before milestone close to catch stray commits (e.g. accidental gitlinks from committing directories containing nested `.git` dirs).

### Cost Observations
- Model mix: 100% sonnet (executor, verifier, and code-reviewer agents all resolved to sonnet this milestone)
- Sessions: 2+ (discuss/plan work in an earlier session; execute-phase 2 + complete-milestone in this session, itself resumed once via `/gsd-resume-work`)
- Notable: both phases were small, well-scoped vertical slices (1-3 tasks each) — no checkpoints, no gap-closure cycles, no failed executor runs.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 2+ | 2 | First milestone — established RED→GREEN TDD + code-review gate as standard execution pattern |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|---------------------|
| v1.0 | 25 (17 backend + 8 client) | Not measured | 0 (Vitest/Testing Library are devDependencies, no new runtime deps) |

### Top Lessons (Verified Across Milestones)

1. Ship the fix and the regression-lock together — a "fix" without a test that would fail on regression isn't done (v1.0).
