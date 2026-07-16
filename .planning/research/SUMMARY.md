# Project Research Summary

**Scope note:** This milestone is a scoped bug-fix against an existing, already-audited codebase (`ROADMAP_VALIDACION_CURP_RFC.md`), not a new domain. Standard greenfield research (stack/features/architecture/pitfalls surveys) doesn't apply — the only open technical question was whether the roadmap's proposed CURP regex fix is actually correct per the official CURP format. That single question was researched directly instead of spawning the full 4-agent research pipeline.

## Key Findings

**CURP structure (18 characters):**
1. Apellido paterno (1st letter)
2. 1st internal vowel of apellido paterno
3. Apellido materno (1st letter)
4. Nombre (1st letter)
5–10. Fecha de nacimiento (AAMMDD)
11. Sexo (H/M)
12–13. Código de entidad federativa
14–16. Consonantes internas (paterno, materno, nombre)
17. **Diferenciador de siglo** — digit `0-9` if born before 2000, letter `A-Z` if born in 2000 or later
18. Dígito verificador — always a digit `0-9`

**Confirms the roadmap's fix is correct:** `CURP_REGEX` should end in `[A-Z0-9]\d$` (position 17 = digit OR letter, position 18 = always digit), not `\d{2}$`. This validates item 1.1 in `ROADMAP_VALIDACION_CURP_RFC.md` without changes.

**No other findings apply** — RFC format, masking, and frontend/backend alignment are implementation details already fully specified in the existing roadmap, not open domain questions.

## Implications for Roadmap

- Proceed with the fix exactly as specified in `ROADMAP_VALIDACION_CURP_RFC.md` items 1.1–1.4 and 2.1–2.2.
- No additional phases or requirements surfaced by research.

## Sources

- [¿Cuáles son los 18 caracteres que componen una CURP?](https://www.informador.mx/mexico/Cuales-son-los-18-caracteres-que-componen-una-CURP-20241204-0126.html)
- [Cómo leer tu CURP: qué significa cada carácter](https://vidavex.com/curp/como-leer-la-curp)
- [Cómo Validar un CURP: Dígito Verificador, Formato y Estructura](https://extraerdatosdeine.com/blog/curp-que-es-como-validar)
