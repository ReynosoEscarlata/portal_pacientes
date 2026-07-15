# LEGACY_MAP — Análisis del módulo `server/legacy/registro_viejo.js`

> Plantilla de trabajo. Completa cada sección analizando el módulo legacy **antes** de refactorizarlo.
> Actívalo con `LEGACY_ENABLED=true` en `server/.env` para observar su comportamiento real
> (`POST /api/legacy/registro`).

## 1. Inventario

| Elemento (función / variable) | Tipo | ¿Qué hace? | ¿Quién lo usa? |
|-------------------------------|------|------------|----------------|
| | | | |
| | | | |

## 2. Estado global y efectos secundarios

_¿Qué variables viven fuera de las funciones? ¿Qué pasa al reiniciar el proceso? ¿Qué se cuelga de `globalThis`?_

## 3. Flujo de datos

_Dibuja o describe el camino de una petición desde `req.body` hasta la respuesta. ¿Cuántos niveles de callbacks hay? ¿Qué garantías de orden existen?_

## 4. Malas prácticas detectadas

| # | Mala práctica | Evidencia (línea) | Riesgo | Severidad (alta/media/baja) |
|---|---------------|-------------------|--------|------------------------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

Pistas de categorías: validación de entradas, construcción de SQL, manejo de errores, logging de datos personales, asincronía, nombres y magia numérica, contratos de respuesta.

## 5. Riesgos de seguridad y cumplimiento

_¿Qué violaciones a LFPDPPP / buenas prácticas de seguridad encuentras? Compara con cómo lo resuelve el código moderno en `server/src/`._

## 6. Plan de refactor

- [ ] Paso 1:
- [ ] Paso 2:
- [ ] Paso 3:

_Criterio de éxito: mismo comportamiento externo deseado (contrato claro), sin estado global, con validación, async/await y sin datos personales en logs. Considera escribir tests de caracterización antes de tocar el código._
