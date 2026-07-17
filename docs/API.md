<!-- generated-by: gsd-doc-writer -->
# API Reference

REST API for the ClinicConnect patient pre-registration portal. All endpoints are mounted
under `/api` by `server/src/app.js`. Request and response bodies are JSON.

## Authentication

There is no authentication mechanism on this API — all endpoints are public. Access control
is implemented differently per resource:

- **Draft endpoints** (`/api/registros/draft/*`) rely on knowledge of an unguessable UUID
  draft ID (returned once, at creation time) as the only "credential." There is no ownership
  check beyond possessing that ID.
- **ARCO endpoints** (`/api/arco/*`) authenticate the requester by requiring both a folio
  and the patient's exact date of birth (`fechaNacimiento`) as a shared secret pair. A
  mismatch on either value returns the same `404 NO_ENCONTRADO` response, to avoid leaking
  which folios exist (see `server/src/routes/arco.js`).
- Write endpoints are protected only by rate limiting (see [Rate Limits](#rate-limits)), not
  by API keys or sessions.
- CORS is restricted to a single allowed origin via the `CORS_ORIGIN` environment variable
  (default `http://localhost:5173`); see `server/src/middleware/security.js` and
  [CONFIGURATION.md](CONFIGURATION.md).

## Endpoints Overview

| Method | Path | Description | Rate Limited |
|--------|------|--------------|--------------|
| GET | `/api/salud` | Health check | No |
| GET | `/api/phases` | Wizard configuration, phase definitions, catalogs | No |
| POST | `/api/registros/draft` | Create a new draft | Yes (write) |
| GET | `/api/registros/draft/:id` | Fetch a draft (decrypts sensitive phases) | No |
| PUT | `/api/registros/draft/:id/fase/:faseId` | Validate and save one phase of a draft | Yes (write) |
| POST | `/api/registros/draft/:id/enviar` | Final submission — generates folio, creates record | Yes (write) |
| POST | `/api/arco/consulta` | ARCO Right of Access — fetch a submitted record | Yes (ARCO) |
| POST | `/api/arco/eliminar` | ARCO Right to be Forgotten — delete a submitted record | Yes (ARCO) |
| POST | `/api/legacy/registro` | Legacy practice endpoint, disabled by default | No |

## Health Check

### `GET /api/salud`

Returns service status and which data source is active.

**Response `200`:**
```json
{ "ok": true, "fuenteDatos": "mock" }
```
`fuenteDatos` is `"mock"` or `"postgres"`, matching the `DATA_SOURCE` environment variable
(see `server/src/repositories/index.js`).

## Phase Configuration

### `GET /api/phases`

Serves the dynamic wizard configuration that drives the frontend: the current privacy
notice version, all phase definitions (with fields for `tipo: "form"` phases), and the
selectable catalogs. Source: `server/src/config/phases.config.json` and
`server/src/validation/catalogos.js`.

**Response `200`:**
```json
{
  "versionAviso": "1.0-2026-07",
  "fases": [
    {
      "id": "datos_personales",
      "titulo": "Datos personales",
      "descripcion": "Información básica para identificarte al llegar a la clínica.",
      "icono": "👤",
      "tipo": "form",
      "sensible": false,
      "campos": [
        { "nombre": "curp", "etiqueta": "CURP", "tipo": "text", "requerido": true, "maxLength": 18, "pattern": "..." }
      ]
    },
    { "id": "consentimiento", "titulo": "Aviso de privacidad", "tipo": "aviso_privacidad", "sensible": false },
    { "id": "confirmacion", "titulo": "Confirmación", "tipo": "confirmacion", "sensible": false }
  ],
  "catalogos": {
    "sexo": [{ "clave": "H", "descripcion": "Hombre" }, { "clave": "M", "descripcion": "Mujer" }, { "clave": "NE", "descripcion": "No especificado" }],
    "entidades": [{ "clave": "AS", "descripcion": "Aguascalientes" }]
  }
}
```

The full phase list (5 phases: `datos_personales`, `domicilio`, `datos_clinicos`,
`consentimiento`, `confirmacion`) and field-level rules live in
`server/src/config/phases.config.json`. `tipo` is one of `form`, `aviso_privacidad`, or
`confirmacion`; only `form` phases carry a `campos` array and a matching Zod schema (see
[Request/Response Formats](#requestresponse-formats)).

## Draft (Pre-Registration) Endpoints

All routes are relative to `/api/registros`, defined in `server/src/routes/registros.js`.

### `POST /api/registros/draft`

Creates a new empty draft.

**Response `201`:**
```json
{ "id": "3fae1d2e-9c3d-4b3a-9a7a-2f9a1c9d0aa1", "faseActual": 0 }
```

### `GET /api/registros/draft/:id`

Fetches a draft by ID. The `datos_clinicos` phase is decrypted transparently before being
returned (server never returns raw ciphertext to the client).

**Response `200`:**
```json
{
  "id": "3fae1d2e-9c3d-4b3a-9a7a-2f9a1c9d0aa1",
  "faseActual": 2,
  "datos": {
    "datos_personales": { "nombre": "Ana", "primerApellido": "López", "curp": "..." },
    "domicilio": { "calle": "..." }
  },
  "actualizadoEn": "2026-07-16T18:04:12.000Z"
}
```

**Errors:**
- `404 NO_ENCONTRADO` — `id` is not a valid UUID, or no draft exists with that ID.

### `PUT /api/registros/draft/:id/fase/:faseId`

Validates and saves the data for a single phase. `faseId` must be one of the `form`-type
phase IDs with a registered Zod schema: `datos_personales`, `domicilio`, `datos_clinicos`,
or `consentimiento` (see `esquemasPorFase` in `server/src/validation/schemas.js`).

**Request body:**
```json
{ "datos": { "nombre": "Ana", "primerApellido": "López", "...": "..." } }
```

**Response `200`:**
```json
{ "ok": true, "faseActual": 3 }
```
`faseActual` is the highest phase index reached so far (monotonically non-decreasing).

Sensitive phases (currently only `datos_clinicos`, flagged `sensible: true` in
`phases.config.json`) are encrypted with AES-256-GCM before being persisted
(`server/src/crypto/cipher.js`).

For `faseId === "consentimiento"`, the server does not trust client-submitted acceptance
data verbatim: it re-derives the stored record as
`{ aceptado: true, versionAviso, timestamp: <server time>, ip: req.ip }`, so the accepted
privacy-notice version, timestamp, and origin IP are always server-generated and traceable.

**Errors:**
- `404 NO_ENCONTRADO` — invalid draft ID or draft not found.
- `404 FASE_INVALIDA` — `faseId` does not exist or is not a form phase (no schema).
- `422 VALIDACION` — request body fails the phase's Zod schema. Response includes a
  `detalles` array of `{ campo, mensaje }` (see [Error Codes](#error-codes)).
- `409 AVISO_DESACTUALIZADO` — for the `consentimiento` phase, the `versionAviso` submitted
  by the client does not match the current `configFases.versionAviso`. This happens when the
  privacy notice changed after the client loaded the form; the client should reload
  `/api/phases` and re-prompt for consent.

#### CURP / personal-data cross-validation (`datos_personales`)

Beyond per-field format checks, `esquemaDatosPersonales` runs a `superRefine` semantic
cross-validation (`server/src/validation/schemas.js`) once `curp` matches `CURP_REGEX` and
`fechaNacimiento` matches `AAAA-MM-DD`:

- **Birth date consistency:** the `YYMMDD` segment embedded in the CURP (positions 4–10)
  must match the submitted `fechaNacimiento`. Mismatch raises a `422 VALIDACION` issue on
  path `curp` with message `"La fecha de nacimiento de la CURP no coincide con la fecha de
  nacimiento capturada"`.
- **Sex consistency:** the sex character embedded in the CURP (position 10, `H` or `M`)
  must match the submitted `sexo`, unless `sexo` is `"NE"` (not specified), which skips this
  check. Mismatch raises a `422 VALIDACION` issue on path `curp` with message `"El sexo de
  la CURP no coincide con el sexo capturado"`.

Both checks are skipped (no issue raised) if the CURP or date fail their own format
validation first — those produce their own field-level format errors instead.

Example `422` response body for a CURP/birth-date mismatch:
```json
{
  "error": "VALIDACION",
  "mensaje": "Los datos enviados no son válidos",
  "detalles": [
    { "campo": "curp", "mensaje": "La fecha de nacimiento de la CURP no coincide con la fecha de nacimiento capturada" }
  ]
}
```

### `POST /api/registros/draft/:id/enviar`

Final submission. Validates that every form phase (`datos_personales`, `domicilio`,
`datos_clinicos`) has already been saved on the draft and that consent was accepted, then
generates a unique folio, creates an immutable record, and deletes the draft.

**Response `201`:**
```json
{ "folio": "CC-2026-4KX9QZ" }
```
Folio format: `CC-<year>-<6 chars from A-Z2-9, excluding 0/O/1/I>` (see
`server/src/utils/folio.js`). Uniqueness is enforced by regenerating until
`repo.existeFolio(folio)` returns `false`.

**Errors:**
- `404 NO_ENCONTRADO` — invalid or missing draft ID.
- `422 INCOMPLETO` — a required form phase (`datos_personales`, `domicilio`, or
  `datos_clinicos`) was never saved on this draft.
- `422 CONSENTIMIENTO_REQUERIDO` — the `consentimiento` phase was not saved or was not
  accepted (`aceptado !== true`).

## ARCO Rights Endpoints

Routes relative to `/api/arco`, defined in `server/src/routes/arco.js`. Both endpoints
authenticate with the same body shape and share the same "not found" behavior to prevent
folio enumeration.

**Shared request body:**
```json
{ "folio": "CC-2026-4KX9QZ", "fechaNacimiento": "1990-05-14" }
```
- `folio` — trimmed and uppercased before validation; must match `^CC-\d{4}-[A-Z0-9]{6}$`.
- `fechaNacimiento` — must match `AAAA-MM-DD`.

**Shared error:**
- `404 NO_ENCONTRADO` — folio does not exist, or the stored `datosPersonales.fechaNacimiento`
  does not match the submitted date. The same message is returned in both cases by design,
  to avoid revealing whether a folio exists (`noEncontrado()` in `arco.js`).
- `422 VALIDACION` — folio or date fail their format regex.

### `POST /api/arco/consulta`

Right of Access: returns the full stored record, with `curp`, `telefono`, and `correo`
masked in the response (`enmascararCurp`, `enmascararTelefono`, `enmascararCorreo` in
`server/src/utils/mask.js`). Clinical data (`datosClinicos`) is decrypted before being
returned.

**Response `200`:**
```json
{
  "folio": "CC-2026-4KX9QZ",
  "creadoEn": "2026-07-10T15:22:01.000Z",
  "datosPersonales": {
    "nombre": "Ana",
    "primerApellido": "López",
    "curp": "AAAA******",
    "telefono": "******1234",
    "correo": "an***@ejemplo.com"
  },
  "domicilio": { "calle": "..." },
  "datosClinicos": { "motivoConsulta": "..." },
  "consentimiento": { "aceptado": true, "versionAviso": "1.0-2026-07", "timestamp": "...", "ip": "..." }
}
```

### `POST /api/arco/eliminar`

Right to be Forgotten: permanently deletes the record matching the authenticated folio.

**Response `200`:**
```json
{ "eliminado": true, "mensaje": "El pre-registro y sus datos fueron eliminados" }
```

## Legacy Endpoint (disabled by default)

### `POST /api/legacy/registro`

Only mounted when the `LEGACY_ENABLED` environment variable is `true` (see
`server/src/index.js`). Backed by `server/legacy/registro_viejo.js`, a deliberately
unrefactored legacy module (string-concatenated SQL, no input validation, in-memory array
storage) kept as practice/reference material — it is not wired to the Zod schemas, the
repository layer, or encryption used by the rest of the API, and is not intended for
production use.

## Request/Response Formats

Form-phase request bodies are validated against the Zod schemas in
`server/src/validation/schemas.js`, all defined with `.strict()` (unknown fields are
rejected as validation errors):

| Phase ID | Schema | Key fields |
|----------|--------|------------|
| `datos_personales` | `esquemaDatosPersonales` | `nombre`, `primerApellido`, `segundoApellido?`, `fechaNacimiento` (`AAAA-MM-DD`, not future, ≥1900-01-01), `sexo` (`H`\|`M`\|`NE`), `curp` (18-char CURP regex, uppercased), `telefono` (10 digits), `correo` (valid email, ≤120 chars) |
| `domicilio` | `esquemaDomicilio` | `calle`, `numero`, `colonia`, `cp` (5 digits), `municipio`, `estado` (entity catalog key) |
| `datos_clinicos` | `esquemaDatosClinicos` | `motivoConsulta` (5–600 chars), `alergias?`, `medicamentosActuales?`, `antecedentes?` (each ≤600 chars) |
| `consentimiento` | `esquemaConsentimiento` | `aceptado` (must be `true`), `versionAviso` (must match current published version) |

All request bodies are capped at 100kb (`express.json({ limit: '100kb' })` in
`server/src/app.js`); an oversized or malformed body returns `400 CUERPO_INVALIDO`.

## Error Codes

All errors follow one of two shapes, produced by the central error handler
(`server/src/middleware/errorHandler.js`):

**Zod validation errors** (`422`):
```json
{ "error": "VALIDACION", "mensaje": "Los datos enviados no son válidos", "detalles": [{ "campo": "curp", "mensaje": "..." }] }
```

**All other application errors:**
```json
{ "error": "<CODIGO>", "mensaje": "<mensaje legible>" }
```

| Status | Error code | Meaning |
|--------|------------|---------|
| 400 | `CUERPO_INVALIDO` | Request body is malformed JSON or exceeds the 100kb limit |
| 404 | `NO_ENCONTRADO` | Resource (draft, record) not found, or ARCO auth mismatch |
| 404 | `FASE_INVALIDA` | Requested phase ID does not exist or has no schema |
| 409 | `AVISO_DESACTUALIZADO` | Submitted privacy-notice version is stale |
| 422 | `VALIDACION` | Request body failed Zod schema validation |
| 422 | `INCOMPLETO` | Final submission attempted with a missing required phase |
| 422 | `CONSENTIMIENTO_REQUERIDO` | Final submission attempted without accepted consent |
| 429 | `RATE_LIMIT` | Too many requests within the rate-limit window |
| 500 | `INTERNO` | Unexpected server error; response includes a random `id` for correlation, never the stack trace or request data |

Route handlers never leak stack traces or personal data to the client; unexpected errors are
logged server-side with a random UUID (`console.error`) and that same UUID is returned to
the client in the `id` field for support correlation.

## Rate Limits

Configured in `server/src/middleware/rateLimit.js` using `express-rate-limit`. Disabled
entirely when `NODE_ENV=test`.

| Limiter | Applies to | Window | Max requests | Response on limit |
|---------|-----------|--------|---------------|--------------------|
| `limiteEscritura` | `POST /api/registros/draft`, `PUT /api/registros/draft/:id/fase/:faseId`, `POST /api/registros/draft/:id/enviar` | 15 minutes | 100 | `429 { "error": "RATE_LIMIT", "mensaje": "Demasiadas solicitudes, intenta de nuevo más tarde" }` |
| `limiteArco` | `POST /api/arco/consulta`, `POST /api/arco/eliminar` | 15 minutes | 15 | `429 { "error": "RATE_LIMIT", "mensaje": "Demasiadas solicitudes ARCO, intenta de nuevo más tarde" }` |

The stricter ARCO limit is intentional — it protects against brute-forcing folio + birth
date combinations. `GET /api/salud`, `GET /api/phases`, and `GET /api/registros/draft/:id`
are not rate limited.
