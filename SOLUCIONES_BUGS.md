# SOLUCIONES_BUGS — ⚠️ SPOILERS ⚠️

> **No sigas leyendo si aún no has buscado los bugs.** Este proyecto tiene **4 bugs sembrados
> intencionalmente** para practicar debugging sistemático. Intenta encontrarlos primero:
> reproduce, formula hipótesis, aísla con la red/DevTools/tests y solo entonces compara aquí.

---

## Bug 1 — La CURP de personas nacidas en 2000 o después es rechazada

- **Síntoma:** el frontend acepta la CURP (patrón laxo de 18 caracteres), pero al guardar la fase el backend responde 422 "La CURP no tiene un formato válido"… solo para pacientes nacidos a partir del año 2000.
- **Archivo:** `server/src/validation/schemas.js` (constante `CURP_REGEX`).
- **Causa raíz:** la regex termina en `\d{2}$`, forzando que la posición 17 sea un dígito. En la CURP oficial, la posición 17 (primer carácter de la homoclave) es un **dígito para nacidos antes del 2000 y una letra para nacidos en 2000 o después**.
- **Fix:** cambiar el final de la regex de `\d{2}$` a `[A-Z0-9]\d$`.
- **Test que lo habría atrapado:** agregar a `tests/curp.test.js` un caso válido de nacido ≥ 2000, p. ej. `MAPA000115HDFRRLA1` (nótese la `A` en la posición 17). Los tests actuales solo usan CURPs pre-2000 — lección: cobertura sesgada oculta bugs.

## Bug 2 — El borrador se guarda pero nunca se restaura

- **Síntoma:** capturas fases, recargas la página o vuelves después, y el wizard aparece vacío aunque el chip de fases se resetea; en la pestaña Red se ve que `GET /api/registros/draft/:id` **sí** devuelve los datos.
- **Archivo:** `client/src/context/WizardContext.tsx` (función `iniciar`, rama de borrador guardado).
- **Causa raíz:** el cliente lee `draft.respuestas`, pero la API devuelve los datos bajo la clave `datos`. Como la respuesta es `any`, TypeScript no lo detecta; `draft.respuestas` es `undefined` y se restaura `{}`.
- **Fix:** `setDatos(draft.datos ?? {})`. Mejora adicional: tipar la respuesta del API (`interface DraftRespuesta { datos: DatosFases; faseActual: number }`) para que el compilador atrape este tipo de errores.
- **Técnica de debugging:** separar "¿se guarda?" de "¿se restaura?" — la pestaña Red demuestra que el guardado (PUT) y la lectura (GET) funcionan, por lo que el bug tiene que estar en el mapeo del cliente.

## Bug 3 — Off-by-one en el porcentaje de progreso

- **Síntoma:** la barra inicia en 0 % y en la última fase marca 80 %, mientras el texto dice "Fase 5 de 5". Nunca llega a 100 %.
- **Archivo:** `client/src/components/ProgressBar.tsx`.
- **Causa raíz:** `porcentaje = (indice / total) * 100` usa el índice base 0; la fase 1 de 5 da 0 % y la 5 de 5 da 80 %.
- **Fix:** `Math.round(((indice + 1) / total) * 100)` (el texto "Fase {indice + 1} de {total}" ya lo hace bien — esa inconsistencia era la pista).

## Bug 4 — El enmascaramiento de la CURP en el resumen fuga un carácter de más

- **Síntoma:** en la fase de Confirmación la CURP se muestra como `PEGG8*************` (5 visibles); el requisito de privacidad es mostrar solo 4 (`PEGG****…`), como sí lo hace la respuesta ARCO del servidor.
- **Archivo:** `client/src/utils/mask.ts` (función `enmascararCurp`).
- **Causa raíz:** `curp.slice(0, 5)` en lugar de `curp.slice(0, 4)`. El quinto carácter es el primer dígito del año de nacimiento: una fuga menor pero real de dato personal.
- **Fix:** `curp.slice(0, 4) + '*'.repeat(Math.max(0, curp.length - 4))`.
- **Pista de detección:** comparar el resumen del wizard con la consulta ARCO (servidor, `server/src/utils/mask.js`, correcto) — la duplicación cliente/servidor de esta utilidad es en sí un hallazgo de diseño.

---

## Cierre sugerido

1. Corrige cada bug en un commit separado con mensaje descriptivo.
2. Agrega el test de regresión correspondiente (bugs 1 y 4 son fáciles de cubrir; para 2 y 3 considera tests de componente con Vitest + Testing Library).
3. Reflexiona: ¿qué práctica habría prevenido cada bug? (tipado estricto de respuestas API, tests con datos frontera, revisión de consistencia UI, single source of truth para utilidades duplicadas).
