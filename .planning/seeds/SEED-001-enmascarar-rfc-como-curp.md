---
id: SEED-001
status: dormant
planted: 2026-07-16
planted_during: "between milestones (v1.0 shipped, v2.0 not yet started)"
trigger_when: "when RFC-01 lands — the RFC field is added to the pre-registration wizard (schema, phases.config.json, capture UI)"
scope: small
---

# SEED-001: Enmascarar el RFC en pantalla de confirmación y respuestas ARCO igual que la CURP

Cuando se agregue el campo RFC al wizard de pre-registro (RFC-01), enmascarar el RFC en la pantalla de confirmación y en respuestas ARCO igual que la CURP (primeros 4 caracteres visibles).

## Why This Matters

El RFC es PII fiscal (LFPDPPP). El milestone v1.0 cerró una fuga equivalente para la CURP
(`enmascararCurp` exponía 5 caracteres — uno de más — en la pantalla de confirmación). Si el RFC
entra al wizard sin su propia máscara desde el día uno, se repite exactamente la misma clase de
fuga que ya costó un milestone corregir: dato sensible completo visible en pantalla y en las
respuestas del flujo ARCO. Capturar esto como seed garantiza que la máscara sea parte del alcance
de RFC-01 y no un fast-follow olvidado.

## When to Surface

**Trigger:** cuando un milestone incluya RFC-01 (agregar campo RFC al wizard de pre-registro).

Señales concretas de disparo:
- `phases.config.json` gana un campo `rfc` en `datos_personales`
- `server/src/validation/schemas.js` agrega validación de RFC
- REQUIREMENTS.md de un milestone activo lista RFC-01

This seed will surface during `/gsd-new-milestone` when the milestone scope matches.

## Scope Estimate

**Small** — unas horas: `enmascararRfc` en `client/src/utils/mask.ts` + `server/src/utils/mask.js`
(espejo exacto, 4 chars visibles), registrarla en el mapa `MASCARAS` de `Confirmacion.tsx`, aplicarla
en las respuestas de `server/src/routes/arco.js`, y tests de regresión por igualdad exacta en
`mask.test.ts` / suite backend (mismo patrón que CURP-03/CURP-04).

## Breadcrumbs

- `client/src/utils/mask.ts` — `enmascararCurp` es el patrón a espejar (slice(0,4) + asteriscos)
- `server/src/utils/mask.js` — implementación server de referencia (paridad byte a byte)
- `client/src/components/wizard/phases/Confirmacion.tsx` — mapa `MASCARAS` donde se registra la máscara por nombre de campo
- `server/src/routes/arco.js` — respuestas ARCO donde hoy se enmascara CURP/teléfono
- `ROADMAP_VALIDACION_CURP_RFC.md` — origen de RFC-01 (Fase 3 propuesta del audit brownfield)
- `.planning/milestones/v1.0-REQUIREMENTS.md` — RFC-01 listado como requirement v2 diferido
- Decisión v1.0: RFC excluido del milestone pendiente de decisión de negocio/compliance (STATE.md Deferred Items)

## Notes

Capturada vía `/gsd-plant-seed` con trigger y scope provistos en el momento de la captura
(reto extra del bootcamp: condición de disparo realista que `/gsd-new-milestone` debe despertar
cuando el milestone incluya RFC-01).
