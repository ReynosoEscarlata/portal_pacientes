# ClinicConnect — Portal de pre-registro de pacientes

Portal web donde el paciente captura sus datos personales y clínicos **antes de llegar a la clínica** para agilizar su recepción. Proyecto de **entrenamiento**: incluye código legacy intencional, bugs sembrados y material de práctica.

> ⚠️ Todos los datos y entidades de este proyecto son ficticios.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Vite (CSS propio, colorimetría estilo Facebook) |
| Backend | Node.js + Express (ES Modules) |
| Validación | Zod (backend) + validación por configuración (frontend) |
| Persistencia | PostgreSQL (`pg`) **o** repositorio mock en memoria (patrón Repository) |
| Tests | `node:test` + Supertest |

## Setup rápido

Requisitos: Node.js 20+ (probado con 22). PostgreSQL es **opcional**.

```bash
npm install            # dependencias raíz (concurrently)
npm run install:all    # dependencias de server y client

# configuración del backend
cp server/.env.example server/.env   # en Windows: copy server\.env.example server\.env

npm run dev            # levanta API (:4000) y frontend (:5173) a la vez
```

Abre <http://localhost:5173>. El frontend usa el proxy de Vite hacia `http://localhost:4000`.

Con `SEED_MOCK=true` (valor del `.env.example`) se cargan 3 pacientes ficticios al arrancar; sus folios (`CC-2026-DEMO01/02/03`, fechas de nacimiento en [server/src/seed/sembrar.js](server/src/seed/sembrar.js)) sirven para probar la sección ARCO.

## Alternar mock ↔ PostgreSQL

La app funciona igual con ambas fuentes de datos; se elige con `DATA_SOURCE` en `server/.env`:

```bash
# 1) Modo mock (default): no requiere nada más
DATA_SOURCE=mock

# 2) Modo PostgreSQL
DATA_SOURCE=postgres
# crea la BD y aplica la migración:
#   createdb clinicconnect
#   psql -d clinicconnect -f server/db/schema.sql
# configura PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD en server/.env
npm run seed   # opcional: carga los 3 pacientes ficticios
```

Ambas implementaciones viven en [server/src/repositories/](server/src/repositories/) y comparten interfaz (patrón Repository); la fábrica está en [index.js](server/src/repositories/index.js).

## Scripts npm (raíz)

| Script | Qué hace |
|--------|----------|
| `npm run dev` | API + frontend en paralelo |
| `npm run dev:server` / `npm run dev:client` | cada uno por separado |
| `npm test` | tests del backend (`node --test`) |
| `npm run build` | type-check + build de producción del cliente |
| `npm run seed` | siembra pacientes ficticios en la fuente configurada |

## Fases dinámicas del wizard

Las fases **no están hardcodeadas**: se definen en [server/src/config/phases.config.json](server/src/config/phases.config.json) y el frontend las lee de `GET /api/phases` (incluye catálogos y versión del aviso de privacidad). Agregar, quitar o reordenar fases/campos solo requiere editar ese JSON; para nuevas fases con validación backend, registra su esquema en [schemas.js](server/src/validation/schemas.js) (`esquemasPorFase`).

Cada fase se valida **en frontend y backend** antes de avanzar, y el progreso se guarda como borrador retomable (el id del borrador se conserva en `localStorage`).

## API

| Método y ruta | Descripción |
|---------------|-------------|
| `GET /api/salud` | estado y fuente de datos activa |
| `GET /api/phases` | configuración de fases + catálogos + versión del aviso |
| `POST /api/registros/draft` | crea un borrador |
| `GET /api/registros/draft/:id` | recupera un borrador (para retomar) |
| `PUT /api/registros/draft/:id/fase/:faseId` | valida y guarda una fase |
| `POST /api/registros/draft/:id/enviar` | valida todo, exige consentimiento y genera folio |
| `POST /api/arco/consulta` | derecho de Acceso: folio + fecha de nacimiento |
| `POST /api/arco/eliminar` | derecho de Cancelación: elimina el pre-registro |

## Cumplimiento (NOM-024-SSA3-2012 / LFPDPPP)

- **Consentimiento expreso y trazable**: al aceptar el aviso se guarda `{ aceptado, versionAviso, timestamp, ip }`; el envío final lo exige.
- **Minimización**: solo se piden los campos del wizard; los clínicos están etiquetados como **sensibles** en la UI y en la configuración.
- **Cifrado en reposo (simulado)**: la fase clínica se guarda cifrada con AES-256-GCM ([cipher.js](server/src/crypto/cipher.js)); la clave viene de `ENCRYPTION_KEY`.
- **Sin datos personales en logs**: el manejador de errores loguea solo id/tipo de error y nunca expone stack traces al cliente.
- **Enmascaramiento**: CURP/teléfono/correo parciales en el resumen y en la respuesta ARCO.
- **Derechos ARCO simulados**: consulta y eliminación con folio + fecha de nacimiento (misma respuesta 404 si el folio no existe o la fecha no coincide, para evitar enumeración) con rate limit estricto.
- **Catálogos estándar**: sexo y entidades federativas con claves RENAPO en [catalogos.js](server/src/validation/catalogos.js).

## Seguridad

Helmet, CORS restringido a `CORS_ORIGIN`, rate limiting en endpoints de escritura y ARCO, validación/sanitización con Zod (`.strict()`), consultas parametrizadas en PostgreSQL y manejo de errores centralizado.

## Material de práctica

| Archivo | Propósito |
|---------|-----------|
| [server/legacy/registro_viejo.js](server/legacy/registro_viejo.js) | Módulo brownfield con malas prácticas para mapear y refactorizar (se monta con `LEGACY_ENABLED=true`) |
| [LEGACY_MAP.md](LEGACY_MAP.md) | Plantilla vacía para documentar el análisis del legacy |
| [BACKLOG.md](BACKLOG.md) | 12 user stories priorizadas con criterios de aceptación |
| [CODE_REVIEW.md](CODE_REVIEW.md) | Checklist de revisión + prompt listo para otra IA |
| [SOLUCIONES_BUGS.md](SOLUCIONES_BUGS.md) | ⚠️ **SPOILERS**: bugs sembrados intencionalmente. El proyecto contiene 4 bugs sutiles para practicar debugging sistemático; no abras este archivo hasta haberlos buscado |

## Validación semántica de CURP

El backend valida (en `esquemaDatosPersonales`, [schemas.js](server/src/validation/schemas.js)) que la fecha de nacimiento y el sexo codificados dentro de la CURP coincidan con `fechaNacimiento` y `sexo` capturados por separado en el formulario; si contradicen, la fase se rechaza con un error 422 de validación (el sexo `NE` omite ese cruce, ya que ninguna CURP lo codifica).

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md) | Requisitos, instalación paso a paso y primer arranque |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Visión general del sistema, componentes y flujo de datos |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setup de desarrollo, comandos de build/lint y convenciones de rama/PR |
| [docs/TESTING.md](docs/TESTING.md) | Cómo correr y escribir tests (backend `node:test` y cliente Vitest) |
| [docs/API.md](docs/API.md) | Detalle de endpoints, formatos de request/response y códigos de error |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | Variables de entorno y opciones de configuración del servidor |

## Estructura

```
├── server/
│   ├── src/
│   │   ├── config/          # env + phases.config.json (fases dinámicas)
│   │   ├── crypto/          # AES-256-GCM
│   │   ├── middleware/      # helmet/cors, rate limit, errores
│   │   ├── repositories/    # mock (memoria) y postgres, intercambiables
│   │   ├── routes/          # phases, registros (drafts), arco
│   │   ├── seed/            # pacientes ficticios
│   │   ├── utils/           # folio, enmascaramiento, errores
│   │   └── validation/      # esquemas zod + catálogos
│   ├── db/                  # schema.sql + seed.js
│   ├── legacy/              # código brownfield de práctica
│   └── tests/               # 5 suites (node:test + supertest)
└── client/
    └── src/
        ├── api/             # cliente fetch tipado
        ├── components/      # TopBar, chips, avatar, progreso, campos
        │   └── wizard/      # motor dinámico + fases custom
        ├── context/         # estado global del wizard
        ├── pages/           # Inicio, PreRegistro, ConsultaArco
        └── styles/          # tema estilo Facebook
```
