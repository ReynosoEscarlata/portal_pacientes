# Roadmap — Corrección de validación CURP/RFC

Basado en la auditoría de `server/src/validation/schemas.js`, `client/src/components/wizard/PhaseRenderer.tsx`,
`server/src/config/phases.config.json`, `client/src/utils/mask.ts` y `.planning/codebase/CONCERNS.md`
(2026-07-15).

Estado actual: el portal **solo captura CURP**; no existe campo RFC en el wizard, el schema Zod ni el
backlog. La sección "Decisión pendiente" al final cubre ese punto.

---

## Fase 1 — Corrección de bugs bloqueantes (CURP)

**1.1 Regex de CURP rechaza nacidos en 2000+**
- Archivo: `server/src/validation/schemas.js:5` (`CURP_REGEX`)
- Problema: el patrón termina en `\d{2}$`, exige dígito en la posición 17. La CURP real usa dígito
  en esa posición solo para nacidos antes de 2000; para nacidos en 2000 en adelante es una letra
  (diferenciador de homoclave). Ejemplo que falla: `MAPA000115HDFRRLA1`.
- Corrección: cambiar el final del regex de `\d{2}$` a `[A-Z0-9]\d$`.
- Prioridad: **Alta** (bloquea el registro de cualquier paciente nacido en 2000 o después).

**1.2 Cobertura de pruebas insuficiente**
- Archivo: `server/tests/curp.test.js`
- Problema: solo cubre CURPs de nacidos antes de 2000; el bug 1.1 no se detecta en CI.
- Corrección: agregar casos válidos con diferenciador alfabético (nacidos 2000+) y casos inválidos
  correspondientes (p. ej. letra fuera de rango, o dígito de verificación mal formado).
- Depende de: 1.1.
- Prioridad: **Alta**.

**1.3 Enmascaramiento de CURP expone un carácter de más**
- Archivo: `client/src/utils/mask.ts:5` (`enmascararCurp`)
- Problema: `curp.slice(0, 5)` deja visible el primer dígito del año de nacimiento (5 caracteres en
  vez de 4). La versión de `server/src/utils/mask.js` ya está correcta.
- Corrección: cambiar a `curp.slice(0, 4) + '*'.repeat(Math.max(0, curp.length - 4))`.
- Prioridad: **Alta** (fuga de dato personal en pantalla de confirmación).

**1.4 Falta prueba de regresión para el enmascaramiento**
- Archivo: `client/src/utils/mask.ts` (sin archivo de test; el cliente no tiene suite de pruebas)
- Corrección mínima: agregar test unitario de `enmascararCurp` una vez exista runner en el cliente
  (ver Fase 2.2). Si se prioriza antes, cubrir con un test manual documentado en el PR de 1.3.
- Depende de: 1.3.
- Prioridad: **Media** (sin esto, el bug 1.3 puede reaparecer sin que nadie lo note).

---

## Fase 2 — Consistencia de validación CURP (frontend/backend)

**2.1 Patrón laxo en frontend no refleja el formato real**
- Archivo: `server/src/config/phases.config.json:17` (`pattern` del campo `curp`, consumido por
  `PhaseRenderer.tsx`)
- Problema: valida `^[A-Za-z0-9]{18}$` — cualquier alfanumérico de 18 caracteres. El usuario solo
  descubre un formato inválido hasta que el backend responde 422, después de enviar.
- Corrección: no requiere lógica nueva en el cliente. Opciones, de menor a mayor esfuerzo:
  - (a) Duplicar `CURP_REGEX` (ya corregido en 1.1) como el `pattern` de `phases.config.json`, o
  - (b) Exponer el regex del backend vía config pública (`GET /api/config`) para tener una sola fuente
    de verdad.
- Prioridad: **Media**. No bloquea el registro (el backend ya valida correctamente tras 1.1), pero
  mejora la UX y evita divergencia silenciosa documentada en `CONCERNS.md` ("Form Data Validation
  Split").

**2.2 Suite de pruebas del cliente**
- Problema: `client/package.json` no tiene runner de pruebas; ningún bug de frontend (incluye 1.3) se
  detecta antes de producción.
- Corrección: agregar Vitest + Testing Library; primeras pruebas: `enmascararCurp` (1.4) y validación
  de `PhaseRenderer` con el patrón corregido de 2.1.
- Prioridad: **Media** (habilita 1.4 y da cobertura a futuros cambios de este roadmap).

---

## Fase 3 — Validación semántica de CURP (ya en BACKLOG.md #5)

- Ya existe como historia de usuario: "Validación cruzada CURP ↔ datos capturados" (`BACKLOG.md`,
  ítem 5, 3 pts) — cruza fecha de nacimiento (posiciones 5-10) y sexo (posición 11) de la CURP contra
  los campos `fechaNacimiento` y `sexo` capturados por separado.
- No se duplica aquí; se referencia porque depende de que 1.1 esté corregido primero (si el regex
  sigue rechazando CURPs 2000+, la validación cruzada nunca se ejecuta para ese grupo de pacientes).
- Prioridad sugerida: ejecutar después de la Fase 1.

---

## Decisión pendiente — RFC

No hay campo RFC en `phases.config.json`, `schemas.js` ni en `BACKLOG.md`. El portal, tal como está
implementado, **no captura RFC**. Antes de planear una corrección, se necesita definir con negocio/
compliance:

- ¿El pre-registro de paciente requiere RFC? (Típicamente no es indispensable para atención médica;
  el RFC aplica más a facturación/CFDI que a expediente clínico.)
- Si se requiere, ¿es obligatorio u opcional, y en qué fase del wizard (datos personales o un futuro
  paso de facturación)?
- De confirmarse, el trabajo sería nuevo (no una corrección): agregar campo + regex RFC (persona
  física, 13 caracteres, con homoclave) al schema Zod, a `phases.config.json`, y su enmascaramiento
  correspondiente en `mask.ts` / `mask.js`, siguiendo el mismo patrón que CURP.

No se agrega como fase numerada hasta tener esa definición, para no planear trabajo sobre un
requisito no confirmado.

---

## Resumen de prioridades

| # | Corrección | Archivo principal | Prioridad | Depende de |
|---|---|---|---|---|
| 1.1 | Regex CURP posición 17 | `server/src/validation/schemas.js` | Alta | — |
| 1.2 | Tests CURP 2000+ | `server/tests/curp.test.js` | Alta | 1.1 |
| 1.3 | Enmascarado CURP (4 vs 5 chars) | `client/src/utils/mask.ts` | Alta | — |
| 1.4 | Test de regresión de enmascarado | `client/src/utils/mask.ts` | Media | 1.3, 2.2 |
| 2.1 | Patrón frontend desalineado | `server/src/config/phases.config.json` | Media | 1.1 |
| 2.2 | Suite de pruebas del cliente | `client/package.json` | Media | — |
| 3 | Validación cruzada CURP↔datos | ya en `BACKLOG.md` #5 | — | 1.1 |
| — | RFC | decisión de negocio pendiente | — | — |
