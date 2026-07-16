---
phase: quick-260715-thz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/CLAUDE.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "A new '## Reglas de Desarrollo' section exists in .claude/CLAUDE.md with three operational rules."
    - "The section lives OUTSIDE all GSD-managed <!-- GSD:*-start/end --> marker blocks so it survives GSD regeneration."
    - "The verification rule references concrete repo commands: npm test (backend) and npm run build (client typecheck/build)."
  artifacts:
    - .claude/CLAUDE.md
  key_links:
    - "New section is appended AFTER the final <!-- GSD:workflow-end --> marker (currently the last line of the file)."
---

<objective>
Add a new "## Reglas de Desarrollo" section to `.claude/CLAUDE.md` documenting three operational development rules for this project: (1) always work on an independent git branch, never commit directly to master; (2) stay strictly within requested scope — do not touch unrelated flows/code; (3) always run tests/verification before considering a task done.

Purpose: Codify the developer's operating rules so any agent working in this repo follows them consistently. The rules reinforce existing profile directives (scope-creep aversion, GSD workflow) with concrete, actionable commands.
Output: Modified `.claude/CLAUDE.md` with one new section placed outside GSD-managed marker blocks.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Append "Reglas de Desarrollo" section to CLAUDE.md</name>
  <files>.claude/CLAUDE.md</files>
  <action>
Append a new markdown section at the very end of `.claude/CLAUDE.md`, AFTER the final `<!-- GSD:workflow-end -->` marker (currently the last line). The section MUST live outside every `<!-- GSD:*-start -->` / `<!-- GSD:*-end -->` delimited block, because GSD regenerates content inside those markers and would overwrite anything placed within them.

Add exactly one blank line after the closing `<!-- GSD:workflow-end -->` marker, then the section. Use the heading `## Reglas de Desarrollo`.

Write the three rules in Spanish (matching the file's mixed-language convention) as a numbered list, each rule with a bolded lead-in label. Content requirements:

1. Rama git independiente: siempre trabajar sobre una rama git separada de `master`; nunca commitear ni hacer push directo a `master`. Crear una rama descriptiva antes de empezar el trabajo.
2. Alcance estricto: no modificar flujos ni código distintos a los solicitados explícitamente. Mantenerse dentro del alcance pedido; si algo fuera del alcance parece necesario, preguntar antes de expandirlo.
3. Verificación al final: antes de dar por terminada cualquier tarea, correr las pruebas y la verificación. Referenciar los comandos concretos del repo: `npm test` (suite de backend con node:test) y `npm run build` (typecheck + build del cliente, que ejecuta `tsc --noEmit && vite build`). Ambos deben pasar antes de cerrar la tarea.

Keep it concise (documentation prose, no code files touched). Do not modify any content inside the GSD marker blocks. Do not touch any file other than `.claude/CLAUDE.md`.
  </action>
  <verify>
    <automated>grep -n "## Reglas de Desarrollo" .claude/CLAUDE.md && grep -q "npm test" .claude/CLAUDE.md && grep -q "npm run build" .claude/CLAUDE.md && awk '/<!-- GSD:workflow-end -->/{found=NR} /## Reglas de Desarrollo/{sec=NR} END{exit !(sec>found)}' .claude/CLAUDE.md && echo OK</automated>
  </verify>
  <done>`.claude/CLAUDE.md` contains a `## Reglas de Desarrollo` section positioned after the final `<!-- GSD:workflow-end -->` marker, listing all three rules in Spanish, with rule 3 referencing both `npm test` and `npm run build`. No other files changed.</done>
</task>

</tasks>

<verification>
- `## Reglas de Desarrollo` heading exists and appears after the last GSD marker in the file.
- All three rules present and readable in Spanish.
- Verification rule cites `npm test` and `npm run build` (client `tsc --noEmit && vite build`).
- `git status` shows only `.claude/CLAUDE.md` modified — no code files touched.
</verification>

<success_criteria>
The new section is in place, outside GSD-managed blocks, with three clear operational rules and actionable command references. Documentation-only change.
</success_criteria>

<output>
Create `.planning/quick/260715-thz-anadir-seccion-reglas-de-desarrollo-a-cl/260715-thz-SUMMARY.md` when done.
</output>
