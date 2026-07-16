# External Integrations

**Analysis Date:** 2026-07-15

## APIs & External Services

**None detected** - This is a self-contained training project with no external API integrations (no Stripe, Auth0, Twilio, etc.).

## Data Storage

**Databases:**
- PostgreSQL (optional)
  - Connection: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` environment variables
  - Client: `pg` 8.12.0
  - Connection pool: 10 max connections
  - Schema location: `server/db/schema.sql`
  - Tables: `drafts`, `pre_registros`

- In-Memory Mock Repository (built-in)
  - Implementation: `server/src/repositories/memoryRepo.js`
  - Fully interchangeable with PostgreSQL
  - Selected via `DATA_SOURCE=mock` environment variable
  - No persistence across server restarts

**File Storage:**
- Local filesystem only - No cloud storage integration (S3, Azure Blob, etc.)

**Caching:**
- None detected - No Redis, Memcached, or other caching layer

## Authentication & Identity

**Auth Provider:**
- Custom/None - This is a public pre-registration portal with no user authentication
- No JWT, OAuth2, or session management detected
- No login system - direct access to form by citizens

**Consent & Privacy:**
- Consent tracking stored with registration: `{ aceptado, versionAviso, timestamp, ip }`
- Privacy notice version tracked in `consentimiento` JSONB field

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, Bugsnag, or third-party error monitoring

**Logs:**
- Console-based logging only (`console.log`, `console.warn`)
- Centralized error handler in `server/src/middleware/errorHandler.js`
- No structured logging, no external log aggregation
- Error stack traces never exposed to client (security measure per LFPDPPP)

**Metrics & Analytics:**
- None detected - No Google Analytics, Mixpanel, or telemetry

## CI/CD & Deployment

**Hosting:**
- Not preconfigured - Project is a development training exercise
- No GitHub Actions, GitLab CI, Jenkins, or deployment automation detected
- Manual deployment expected

**Package Management:**
- npm (local private registry not detected)
- Lockfile: `package-lock.json` committed to git

## Environment Configuration

**Required env vars (server/.env):**

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | 'development' | Runtime environment |
| `PORT` | 4000 | Express server port |
| `DATA_SOURCE` | 'mock' | 'mock' or 'postgres' |
| `CORS_ORIGIN` | 'http://localhost:5173' | Allowed frontend origin |
| `ENCRYPTION_KEY` | '' | AES-256-GCM key for clinical data |
| `SEED_MOCK` | false | Load sample patients on startup |
| `LEGACY_ENABLED` | false | Enable legacy endpoint (training) |
| `PGHOST` | 'localhost' | PostgreSQL hostname |
| `PGPORT` | 5432 | PostgreSQL port |
| `PGDATABASE` | 'clinicconnect' | Database name |
| `PGUSER` | 'postgres' | PostgreSQL user |
| `PGPASSWORD` | '' | PostgreSQL password |

**Secrets location:**
- `server/.env` (git-ignored) - Not committed
- Template: `server/.env.example` (reference only, contains no real secrets)

**Localization:**
- Not detected - Single language (Spanish) hardcoded in UI/config

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected - No external systems are notified of registrations

## Security & Compliance

**Encryption:**
- AES-256-GCM for clinical data at rest (`server/src/crypto/cipher.js`)
- SQL injection prevention via parameterized queries (`pg` client)
- HTTPS not enforced in development (configured externally in production via reverse proxy)

**Rate Limiting:**
- express-rate-limit on ARCO endpoints (`server/src/routes/arco.js`)
- Standard rate limits on registration submission

**CORS:**
- Helmet headers for security
- CORS restricted to `CORS_ORIGIN` environment variable
- Allowed methods: GET, POST, PUT, DELETE
- Allowed headers: Content-Type only

**Compliance:**
- Simulates NOM-024-SSA3-2012 (Mexican health data standard)
- Simulates LFPDPPP (Mexican data protection law)
- See `README.md` "Cumplimiento" section for details

## Dependencies at Risk

**None identified:**
- All direct dependencies are actively maintained
- No deprecated or high-risk packages detected
- No known CVEs in current dependency versions

---

*Integration audit: 2026-07-15*
