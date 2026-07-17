---
status: awaiting_human_verify
trigger: "Corregir que no deja guardar formulario, el mensaje es Borrador no encontrado"
created: 2026-07-17
updated: 2026-07-17
---

## Symptoms

- **Expected behavior:** El usuario reanuda un borrador existente (draftId persistido en localStorage) y puede seguir guardando fases del wizard con normalidad.
- **Actual behavior:** Al reanudar un borrador existente, el backend responde con error "Borrador no encontrado" y no permite continuar guardando el formulario.
- **Error messages:** "Borrador no encontrado" (coincide con AppError 404 NO_ENCONTRADO usado en rutas de registros/draft).
- **Timeline:** Siempre ha fallado (no hay un punto conocido en que reanudar un borrador haya funcionado).
- **Reproduction:** Ocurre al reanudar un borrador existente (no al guardar una fase nueva ni al enviar el formulario final, según lo indicado por el usuario). Servidor corriendo en modo mock en memoria (DATA_SOURCE no configurado / memoryRepo).

## Current Focus

reasoning_checkpoint:
  hypothesis: "Al reanudar un borrador existente, WizardContext.iniciar lee `draft.respuestas` pero la API responde los datos bajo la clave `datos`. Por eso restaura `{}` y el wizard reanudado pierde todo el progreso guardado, impidiendo continuar con normalidad."
  confirming_evidence:
    - "Reproducción con curl: GET /api/registros/draft/:id responde `{ id, faseActual, datos, actualizadoEn }` — la clave es `datos`, nunca `respuestas`."
    - "Tras PUT de la fase domicilio, el GET devuelve los datos correctamente bajo `datos.domicilio` (el guardado en servidor SÍ funciona)."
    - "El cliente (línea 53) hace `setDatos(draft.respuestas ?? {})`; `draft.respuestas` es undefined → siempre restaura `{}`."
  falsification_test: "Si el GET hubiera devuelto la clave `respuestas`, la hipótesis sería falsa. Se observó `datos`."
  fix_rationale: "Cambiar `draft.respuestas` por `draft.datos` restaura las fases guardadas al reanudar, que es la causa raíz de que la reanudación no funcione. Es un cambio mínimo de una línea en la única función responsable de reanudar."
  blind_spots: "El mensaje literal '404 Borrador no encontrado' NO proviene de este bug de mapeo; en la reproducción sólo aparece cuando el draft no existe en el servidor (modo mock pierde los drafts en memoria al reiniciar el proceso). Ese 404 es comportamiento propio del repositorio en memoria (efímero), no un defecto del mapeo, y el cliente ya lo maneja en iniciar creando un draft nuevo."

- next_action: Fix aplicado y auto-verificado (build + backend 23/23 + cliente 16/16 + reproducción end-to-end). Esperando que el usuario confirme en su flujo real que al reanudar un borrador existente se restauran las fases y puede seguir guardando.

## Evidence

- timestamp: 2026-07-17
  checked: server/src/routes/registros.js (GET /draft/:id, línea 43) y cargarDraft (líneas 19-23)
  found: El GET responde `{ id, faseActual, datos, actualizadoEn }` — la clave es `datos`. El 404 "Borrador no encontrado" solo se lanza en cargarDraft cuando (a) el id no cumple UUID_REGEX o (b) el repo devuelve null (draft inexistente).
  implication: El 404 en modo mock ocurre cuando el draft no está en memoria (p. ej. tras reiniciar el servidor). No hay una tercera fuente de 404 en la ruta.

- timestamp: 2026-07-17
  checked: client/src/context/WizardContext.tsx (iniciar, líneas 43-72)
  found: Al reanudar lee `setDatos(draft.respuestas ?? {})`. El servidor nunca envía `respuestas`, por lo que siempre restaura `{}`. Si obtenerBorrador lanza (404), el catch hace localStorage.removeItem y crea un draft nuevo silenciosamente (no muestra "Borrador no encontrado" durante iniciar).
  implication: El mensaje "Borrador no encontrado" NO surge del flujo de reanudar en iniciar (se traga el error). Surge de guardarFase (PUT) o enviar (POST) cuando el draftId en estado apunta a un draft inexistente en el servidor.

- timestamp: 2026-07-17
  checked: SOLUCIONES_BUGS.md y .planning/codebase/CONCERNS.md
  found: Proyecto de bootcamp con 4 bugs sembrados. Bug 2 = "El borrador se guarda pero nunca se restaura": causa raíz `draft.respuestas` en vez de `draft.datos` en WizardContext.iniciar; fix `setDatos(draft.datos ?? {})`. Impacto: se pierde todo el progreso al recargar.
  implication: El bug sembrado en el flujo de reanudar es el de mapeo respuestas/datos. El síntoma documentado es "wizard vacío", no un 404. Verificar empíricamente el comportamiento real.

- timestamp: 2026-07-17
  checked: Reproducción empírica con servidor en modo mock (PORT 4100) via curl
  found: |
    1) POST /api/registros/draft → { id, faseActual:0 }.
    2) PUT .../fase/domicilio → { ok:true, faseActual:2 } (guardado OK).
    3) GET .../draft/:id → { id, faseActual:2, datos:{ domicilio:{...} }, actualizadoEn } — clave `datos`, datos persistidos.
    4) GET con id válido pero inexistente → 404 { error:"NO_ENCONTRADO", mensaje:"Borrador no encontrado" }.
    5) PUT a draft inexistente → 404 mismo mensaje.
  implication: |
    Confirmado el contrato: la API usa `datos`. El cliente lee `respuestas` → causa raíz del fallo de reanudación (Bug 2).
    El 404 "Borrador no encontrado" SÓLO ocurre cuando el draft no existe en el servidor; en modo mock esto pasa
    al reiniciar el proceso (los drafts viven en memoria). No es un defecto del mapeo cliente/servidor.

## Resolution

root_cause: |
  En client/src/context/WizardContext.tsx (función `iniciar`, rama de borrador guardado), al reanudar un
  borrador existente el cliente ejecuta `setDatos(draft.respuestas ?? {})`, pero la API (GET /api/registros/draft/:id)
  entrega las fases capturadas bajo la clave `datos`, no `respuestas`. Como la respuesta está tipada como `any`,
  TypeScript no detecta el error; `draft.respuestas` es `undefined` y se restaura `{}`, perdiendo todo el progreso
  al reanudar (fases vacías, consentimiento aparece no aceptado, no se puede continuar el formulario con normalidad).

  Nota sobre el mensaje "Borrador no encontrado" (404 NO_ENCONTRADO): la reproducción demuestra que ese error
  sólo se produce cuando el draft no existe en el servidor. En modo mock (por defecto) los drafts se guardan en
  memoria y se pierden al reiniciar el proceso, por lo que un draftId viejo en localStorage deja de existir. Eso es
  comportamiento inherente del repositorio en memoria (efímero), no el defecto de mapeo; queda fuera del alcance de
  este fix (la persistencia real corresponde al repositorio Postgres).
fix: |
  client/src/context/WizardContext.tsx (función `iniciar`): cambiar `setDatos(draft.respuestas ?? {})`
  por `setDatos(draft.datos ?? {})`, alineando la lectura del cliente con la clave real que devuelve la API.
verification: |
  - Reproducción end-to-end contra el servidor en modo mock (curl + snippet Node que replica el mapeo de `iniciar`):
    antes → `draft.respuestas ?? {}` = {} (progreso perdido); después → `draft.datos ?? {}` =
    {"domicilio":{...}} (fases restauradas). faseActual también se restaura (2).
  - `npm run build` (tsc --noEmit && vite build): OK, 0 errores de tipos.
  - `npm test` (backend node:test): 23/23 pasan.
  - `npm run test:client` (vitest): 16/16 pasan.
files_changed:
  - client/src/context/WizardContext.tsx

## Eliminated

- hypothesis: "El 404 'Borrador no encontrado' se origina dentro del flujo de reanudar (WizardContext.iniciar)."
  evidence: "iniciar envuelve obtenerBorrador en try/catch: ante un 404 hace localStorage.removeItem y crea un draft nuevo, sin propagar el mensaje. El 404 sólo se ve en guardarFase/enviar cuando el draft ya no existe en el servidor (draft perdido tras reinicio en modo mock), no por el mapeo de la respuesta."
  timestamp: 2026-07-17
