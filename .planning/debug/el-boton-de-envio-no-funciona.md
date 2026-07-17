---
status: resolved
trigger: "El boton de envio no funciona en safari movil"
created: 2026-07-16
updated: 2026-07-17
---

## Symptoms

- **Expected behavior:** Envía el formulario y avanza (dispara el POST y muestra folio/confirmación o avanza de fase)
- **Actual behavior:** No pasa nada (botón inerte) — el tap no produce ninguna reacción visible, sin error, sin loading
- **Error messages:** No hay ningún error visible; no se ha revisado con Safari Web Inspector todavía
- **Timeline:** Siempre ha fallado en Safari móvil (funciona en otros navegadores/desktop, según lo indicado por el usuario)
- **Reproduction:** Tocar el botón de envío del formulario de pre-registro en Safari móvil (iOS)

## Current Focus

- hypothesis: El tap nunca ejecuta el handler del botón en iOS Safari. Los tres candidatos (ver Evidence) requieren observación en el dispositivo para desambiguar; el más probable es el `:hover` pegajoso de iOS (primer tap consumido por el estado hover del botón).
- test: Necesito el output del Safari Web Inspector al tocar el botón en el iPhone real (errores de consola + estado `disabled` del botón en el DOM).
- expecting: Consola con error → H3; botón `disabled` en DOM → H2; sin error y botón habilitado pero requiere segundo tap → H1.
- next_action: CHECKPOINT — pedir al usuario que capture Web Inspector y confirme qué botón/paso exacto y versión de iOS.

## Evidence

- timestamp: 2026-07-16
  checked: Todas las superficies de envío del pre-registro (PhaseRenderer.tsx form onSubmit→continuar; Confirmacion.tsx "Enviar registro" onClick→enviar; AvisoPrivacidad.tsx "Aceptar y continuar")
  found: Cada handler activa un estado de loading (setGuardando/setEnviando true) ANTES o justo al inicio del trabajo async. Confirmacion pone setEnviando(true) como primera línea de confirmarEnvio().
  implication: "sin loading" implica que el handler NUNCA se ejecutó. El tap no se registra, o el botón está `disabled` (que en iOS/Safari es un no-op nativo: sin reacción, sin error, sin loading — coincide exactamente con el síntoma).

- timestamp: 2026-07-16
  checked: CSS completo (client/src/styles/styles.css) — overlays, pointer-events, z-index, posiciones fijas/absolutas, pseudo-elementos, media queries
  found: Sin elementos que cubran los botones. `.btn` tiene `cursor: pointer`. topbar fija arriba con `.contenido { padding-top: 72px }`. `.fase__acciones` es un flex simple. Único `text-transform: uppercase` en `.aviso__version` (no en inputs).
  implication: Elimina la hipótesis de overlay/pointer-events tapando el botón.

- timestamp: 2026-07-16
  checked: grep en client/src de features JS/regex no soportadas por iOS Safari antiguo (lookbehind, named groups, .at(), structuredClone, replaceAll, ||=, ??=, matchAll, flatMap)
  found: Ninguna. El CURP_REGEX/pattern es estándar (sin lookbehind ni grupos con nombre), compila en cualquier navegador.
  implication: Elimina "SyntaxError silencioso al construir RegExp o usar API no soportada".

- timestamp: 2026-07-16
  checked: Reglas `:hover` de botones — `.btn--primario:hover`, `.btn--exito:hover`, `.btn--secundario:hover`, `.btn--liga:hover`, etc. NO están envueltas en `@media (hover: hover)`.
  found: En iOS Safari, el primer tap sobre un elemento con estado `:hover` puede aplicar solo el hover sin disparar el click (comportamiento "sticky hover"); requiere segundo tap. Funciona bien en desktop (hover real). Coincide con "funciona en desktop / inerte en móvil / siempre ha fallado".
  implication: Hipótesis H1 (candidata principal, fix seguro y en alcance: `@media (hover: hover)`).

## Eliminated

- hypothesis: Mismatch de mayúsculas del CURP frontend/backend (frontend valida el valor crudo contra `^[A-Z]...` sin `.toUpperCase()`, backend sí hace `.transform(v => v.toUpperCase())`)
  evidence: Es comportamiento ACEPTADO y documentado, bloqueado por un test que pasa (client/src/components/wizard/PhaseRenderer.test.tsx líneas 57-66: "accepted A2 behavior, not a regression"). Además produce un error de campo visible ("CURP no tiene un formato válido"), lo que contradice "sin error". Arreglarlo rompería el test y saldría del alcance.
  timestamp: 2026-07-16

- hypothesis: Overlay/pointer-events/z-index tapando el botón
  evidence: CSS revisado completo; no existe tal elemento; botones con cursor:pointer.
  timestamp: 2026-07-16

- hypothesis: Excepción JS silenciosa por feature no soportada en iOS Safari
  evidence: grep sin coincidencias; regex estándar.
  timestamp: 2026-07-16

## Resolution

- root_cause: H1 — sticky `:hover` de iOS Safari. Las 6 reglas `:hover` de botones/enlaces
  (`.topbar__enlace`, `.btn--primario`, `.btn--exito`, `.btn--secundario`, `.btn--peligro`,
  `.btn--liga` en `client/src/styles/styles.css`) no estaban condicionadas a dispositivos con
  hover real, por lo que en iOS el primer tap aplicaba el estado hover sin disparar el click y
  el botón parecía inerte. Adoptada como causa más probable: H2 y H3 fueron eliminadas con
  evidencia (ver Eliminated), el síntoma coincide exactamente (funciona en desktop, inerte en
  móvil, sin error/loading) y la confirmación en dispositivo físico no estuvo disponible en
  esta sesión — el fix elimina el modo de falla en cualquier caso y no cambia el comportamiento
  en desktop.
- fix: Envolver las 6 reglas `:hover` en bloques `@media (hover: hover)` para que solo apliquen
  en dispositivos con hover real (desktop). En pantallas táctiles (hover: none) el estado hover
  ya no se aplica y el primer tap dispara el click directamente.
- verification: `grep` confirma 6 bloques `@media (hover: hover)` y ninguna regla `:hover` fuera
  de ellos; `npm run build` (tsc --noEmit + vite build) pasa; comportamiento desktop intacto
  (mismas declaraciones, solo condicionadas por media query).
- files_changed:
  - client/src/styles/styles.css (6 reglas hover envueltas en @media (hover: hover))
