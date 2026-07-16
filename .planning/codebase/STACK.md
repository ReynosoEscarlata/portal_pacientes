# Technology Stack

**Analysis Date:** 2026-07-15

## Languages

**Primary:**
- TypeScript ~5.6.2 - Client-side frontend (React components, configuration)
- JavaScript (ES Modules) - Backend API and build scripts

**Secondary:**
- SQL - PostgreSQL schema and migrations

## Runtime

**Environment:**
- Node.js 20+ (tested with 22)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Express 4.19.2 - REST API backend, request routing, middleware
- React 18.3.1 - Frontend UI framework

**Build/Dev:**
- Vite 5.4.8 - Client bundler and dev server (`client/vite.config.ts`)
- @vitejs/plugin-react 4.3.1 - React JSX support in Vite

**Testing:**
- node:test (Node.js built-in) - Backend unit tests
- Supertest 7.0.0 - HTTP assertion library for Express integration tests

## Key Dependencies

**Critical:**
- pg 8.12.0 - PostgreSQL client (parameterized queries prevent SQL injection)
- Zod 3.23.8 - Schema validation and type inference (both frontend and backend)
- dotenv 16.4.5 - Environment variable management
- express-rate-limit 7.4.0 - Rate limiting middleware for API endpoints

**Security & Infrastructure:**
- Helmet 8.0.0 - HTTP headers hardening (disables x-powered-by, CSP, X-Frame-Options, etc.)
- CORS 2.8.5 - Cross-Origin Resource Sharing middleware (restricted to `CORS_ORIGIN` env var)

**Frontend:**
- react-dom 18.3.1 - React DOM rendering
- @types/react 18.3.5 - TypeScript definitions for React
- @types/react-dom 18.3.0 - TypeScript definitions for React DOM

**Monorepo/Dev:**
- concurrently 9.0.1 - Run multiple npm scripts in parallel (dev server and client simultaneously)

## Configuration

**Environment:**
- Configured via `dotenv` loading `.env` file in server directory
- Key variables in `server/src/config/env.js`:
  - `NODE_ENV` - development/production
  - `PORT` - Express server port (default: 4000)
  - `DATA_SOURCE` - 'mock' or 'postgres'
  - `CORS_ORIGIN` - Allowed origin for CORS (default: http://localhost:5173)
  - `ENCRYPTION_KEY` - AES-256-GCM encryption key for sensitive data
  - `SEED_MOCK` - Enable mock data seeding
  - `LEGACY_ENABLED` - Enable legacy endpoints for training
  - `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` - PostgreSQL connection

**Build:**
- Client: TypeScript strict mode with no-emit (type-check only), Vite configuration in `client/vite.config.ts`
- Client dev server proxies `/api` requests to `http://localhost:4000`
- Server: ES Modules (import/export), no build step required

**Frontend Port:** 5173 (Vite default)
**Backend Port:** 4000 (configurable via `PORT` env var)

## Platform Requirements

**Development:**
- Node.js 20+ or higher
- npm (included with Node.js)
- PostgreSQL (optional - mock data repository available)
- Windows, macOS, or Linux

**Production:**
- Node.js 20+
- PostgreSQL instance (or use mock repository)

## Database

**Primary:** PostgreSQL (optional)
- Client: `pg` 8.12.0
- Connection pooling: max 10 connections
- Encryption: AES-256-GCM for sensitive clinical data at rest
- Schema: `server/db/schema.sql` (pgcrypto extension)

**Fallback:** In-memory mock repository (`server/src/repositories/memoryRepo.js`)
- No external database required for development/testing
- Data persists only during server runtime

## Monorepo Structure

```
.
├── server/              # Backend (Node.js + Express)
│   ├── package.json     # Backend dependencies
│   └── src/
│       ├── config/      # Environment and phases configuration
│       ├── crypto/      # AES-256-GCM encryption (cipher.js)
│       ├── middleware/  # Helmet, CORS, rate limiting, error handling
│       ├── repositories/# postgres and mock data access
│       ├── routes/      # API endpoints
│       ├── seed/        # Mock data generation
│       ├── utils/       # Helper functions
│       ├── validation/  # Zod schemas and data catalogs
│       └── index.js     # Server entry point
├── client/              # Frontend (React + Vite)
│   ├── package.json     # Frontend dependencies
│   ├── vite.config.ts   # Vite configuration
│   ├── tsconfig.json    # TypeScript configuration
│   └── src/
│       ├── api/         # Fetch client (typed)
│       ├── components/  # React components (wizard, topbar, etc.)
│       ├── context/     # React Context for wizard state
│       ├── pages/       # Page components
│       └── styles/      # CSS (Facebook-style colorimetry)
└── package.json         # Root scripts (concurrently)
```

---

*Stack analysis: 2026-07-15*
