# CODE_REVIEW — Guía de revisión cruzada con otra IA

Material de práctica: usa este checklist para revisar el proyecto tú mismo, y el prompt del final
para pedirle la revisión a **otra IA** (Gemini, GPT, Copilot Chat, etc.) y comparar hallazgos.

## Checklist de revisión

### Seguridad
- [ ] Todos los inputs del cliente pasan por validación backend (Zod `.strict()`); ¿hay algún endpoint que reciba datos sin esquema?
- [ ] Consultas SQL 100 % parametrizadas (busca concatenación de strings en `server/`).
- [ ] Rate limiting presente en endpoints de escritura y ARCO; ¿los límites son razonables?
- [ ] CORS restringido a un origen; Helmet activo; sin `x-powered-by`.
- [ ] Errores nunca exponen stack traces ni detalles internos al cliente.
- [ ] Nada sensible en logs (`console.log`/`console.error` con datos de pacientes = hallazgo).
- [ ] El id de borrador funciona como token de capacidad: ¿es adivinable? ¿expira?

### Cumplimiento (LFPDPPP / NOM-024)
- [ ] Consentimiento expreso, trazable (timestamp, versión del aviso, IP) y exigido antes de crear el registro.
- [ ] Datos sensibles cifrados en reposo (AES-256-GCM) en **ambos** repositorios (mock y postgres).
- [ ] Enmascaramiento correcto de CURP/teléfono/correo en resumen y respuestas ARCO (¿cuántos caracteres se muestran?).
- [ ] Respuestas ARCO no permiten enumeración de folios (mismo error si folio o fecha fallan).
- [ ] Minimización: ¿se pide algún dato que no se use?
- [ ] Catálogos con claves estándar (RENAPO) y validados por enum en backend.

### Correctitud
- [ ] Regex de CURP contra el formato oficial completo (¿todos los casos válidos pasan? prueba personas nacidas en 2000 o después).
- [ ] Guardado y **restauración** de borradores: captura datos, recarga la página y verifica que todo regrese.
- [ ] Barra y porcentaje de progreso consistentes con "Fase X de Y".
- [ ] Flujo de edición desde la confirmación regresa a la confirmación.
- [ ] Manejo de fase sensible: cifrada al guardar, descifrada al retomar y al consultar ARCO.

### Legibilidad y diseño
- [ ] Separación de capas (rutas → validación → repositorio) sin fugas entre ellas.
- [ ] Nombres consistentes (español en dominio, sin mezclas confusas).
- [ ] Sin duplicación relevante entre las utilidades de enmascaramiento cliente/servidor.
- [ ] El módulo `server/legacy/registro_viejo.js` es intencionalmente malo: ¿está aislado y desactivado por default?

### Tests
- [ ] Los 5 grupos exigidos existen: CURP, C.P., consentimiento, repositorio mock, ARCO.
- [ ] ¿Qué casos faltan? (p. ej. CURPs de nacidos ≥ 2000, expiración de drafts, postgres repo).
- [ ] ¿Los tests pasarían con la fuente `postgres`? ¿Cómo lo probarías?

---

## Prompt listo para otra IA

Copia y pega lo siguiente (adjunta o da acceso al código):

```text
Actúa como revisor senior de código para una aplicación médica en México. El proyecto
"ClinicConnect" es un portal de pre-registro de pacientes: React+TypeScript (client/),
Node/Express (server/), PostgreSQL opcional con repositorio mock intercambiable, y debe
cumplir NOM-024-SSA3-2012 y LFPDPPP (consentimiento trazable, datos sensibles cifrados,
enmascaramiento, derechos ARCO).

Revisa el código y reporta hallazgos EN FORMATO DE ISSUES, uno por hallazgo:

## [SEVERIDAD: crítica|alta|media|baja] Título corto
- **Archivo:** ruta:línea
- **Categoría:** seguridad | cumplimiento | bug | legibilidad | tests | rendimiento
- **Descripción:** qué está mal y por qué importa (cita el fragmento relevante)
- **Reproducción/evidencia:** pasos o entrada concreta que demuestra el problema
- **Sugerencia:** cómo corregirlo (con código si aplica)

Áreas donde sospecho que hay problemas deliberados (es un proyecto de entrenamiento con
bugs sembrados): validación de CURP, guardado/restauración de borradores, indicador de
progreso del wizard y enmascaramiento de datos. Verifica especialmente esos flujos, pero
no te limites a ellos. Ignora server/legacy/registro_viejo.js salvo para confirmar que
está aislado (es material de práctica intencionalmente malo).

Al final entrega un resumen ejecutivo: número de hallazgos por severidad y los 3 más
urgentes.
```

## Cómo usar los resultados

1. Registra cada hallazgo de la otra IA en una tabla propia (¿confirmado? ¿falso positivo?).
2. Compara contra `SOLUCIONES_BUGS.md` (**solo al final**): ¿encontró los 4 bugs sembrados? ¿encontró cosas que nosotros no sembramos?
3. Prioriza y corrige: un commit por hallazgo confirmado, con test de regresión cuando aplique.
