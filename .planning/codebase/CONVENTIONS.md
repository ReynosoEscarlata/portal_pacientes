# Coding Conventions

**Analysis Date:** 2026-07-15

## Naming Patterns

**Files:**
- Server: camelCase for modules (`errorHandler.js`, `memoryRepo.js`)
- Client: PascalCase for components (`TopBar.tsx`, `PreRegistro.tsx`), camelCase for utilities (`client.ts`, `mask.ts`)
- Configuration: lowercase with descriptive names (`env.js`, `fases.js`)

**Functions:**
- Verb + Noun pattern in Spanish: `crearApp()`, `obtenerRepositorio()`, `guardarFase()`, `validarId()`
- Descriptive names with Spanish language throughout codebase
- Helper/private functions: `cargarDraft()`, `validarId()` in route handlers

**Variables:**
- camelCase throughout: `faseActual`, `datosValidados`, `datosPersonales`, `primerApellido`
- Boolean prefixes: `estaCifrado`, `draftId`, `cargando`, `errorGeneral`
- Collection names describe content: `datos`, `personales`, `domicilio`, `clinicos`

**Types/Interfaces:**
- PascalCase for interfaces and types: `Props`, `WizardContextValor`, `ConfigPortal`, `DatosFases`
- Descriptive suffix for error classes: `ApiError`, `AppError`
- Type imports use `type` keyword: `import type { Pagina } from '../App'`

**Constants:**
- UPPER_SNAKE_CASE for regex: `CURP_REGEX`, `UUID_REGEX`, `CLAVES_SEXO`
- camelCase for config constants: `CLAVE_DRAFT`, `BASE`
- Catalog exports use UPPER_SNAKE_CASE: `SEXO`, `ENTIDADES`, `CLAVES_SEXO`

**CSS Classes:**
- BEM (Block Element Modifier): `topbar__contenido`, `topbar__enlace`, `topbar__enlace--activo`
- Prefix component name as block: `topbar__buscador`, `topbar__marca`
- Modifiers use double dash for state: `--activo`, `--desactivo`

## Code Style

**Formatting:**
- No ESLint/Prettier config present—code follows implicit conventions
- Indentation: 2 spaces (observed across all files)
- Semicolons: Required (used consistently)
- Quotes: Single quotes in JavaScript/TypeScript imports and strings

**Module System:**
- ESM only: `import`/`export` exclusively (no CommonJS)
- Server: `"type": "module"` in `package.json`
- Client: TypeScript with JSX (`jsx: "react-jsx"`)
- Dynamic imports for conditional loading: `const { criarApp } = await import('../src/app.js')`

**Linting:**
- No active linter config in project root—linting constraints are implicit in conventions
- Client TypeScript strict mode enabled: `"strict": true` in `tsconfig.json`
- Strict mode checks active: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`

## Import Organization

**Order (observed pattern):**
1. Built-in Node modules (`import { test } from 'node:test'`)
2. Third-party packages (`import express from 'express'`, `import { useState } from 'react'`)
3. Local application code (`import { crearApp } from './app.js'`)
4. Type imports separated with `type` keyword (`import type { Pagina } from '../App'`)

**Path Aliases:**
- No path aliases configured (relative imports used throughout)
- Paths are relative and explicit: `'./app.js'`, `'../config/env.js'`

**Re-exports:**
- Single default export per file is common: `export default function App() {}`
- Named exports for utilities and functions: `export class AppError`, `export const api = { ... }`
- Barrel files use index.js: `export function obtenerRepositorio()`

## Error Handling

**Pattern: Custom Error Classes**
- `AppError` class in `src/utils/errors.js`: extends Error with `status`, `codigo` (machine-readable error code), and `message`
- Constructor: `new AppError(status, codigo, mensaje)`
- Example: `new AppError(404, 'NO_ENCONTRADO', 'Borrador no encontrado')`
- Codes are UPPER_SNAKE_CASE and Spanish: `VALIDACION`, `FASE_INVALIDA`, `AVISO_DESACTUALIZADO`

**Server Error Handling:**
- Try-catch in route handlers with `next(err)` delegation
- Central error middleware processes different error types:
  - `ZodError`: responds with 422 and validation details
  - `AppError`: responds with status from error instance
  - Parsing errors: responds with 400 CUERPO_INVALIDO
  - Unhandled errors: responds with 500 and generic message + unique UUID for logging

**Client Error Handling:**
- `ApiError` class in `src/api/client.ts`: wraps HTTP response errors
- Properties: `status`, `codigo`, `detalles` (array of validation errors)
- Errors caught and thrown in fetch wrapper, caught by callers with try-catch

**Never expose stack traces to client** — documented in error handler comments

## Logging

**Framework:** Plain `console` (no logging library)

**Patterns:**
- Info: `console.log()` with semantic tags: `[legacy]`, `[seed]`, `[error ...]`
- Warnings: `console.warn()` with context: `[legacy] Endpoint legacy...`
- Errors: `console.error()` with unique ID and stack info (not exposed to client)
- Example: `console.log(`[seed] ${folios.length} pacientes ficticios...`)`

**No personal data logged** — noted in error handler: "nunca exponer stack traces al cliente ni loguear datos personales"

## Comments

**When to Comment:**
- Explain WHY, not WHAT—code should be self-documenting
- Complex business logic: seen in encryption/decryption flows, ARCO access rules
- Security/compliance notes: `// Consentimiento trazable: versión aceptada, momento e IP de origen`
- Config alignment: `// Catálogos alineados a claves estándar (RENAPO / NOM-024)`
- Repository pattern explanation: `// Patrón Repository: la implementación se elige por DATA_SOURCE...`

**Comment Style:**
- Single-line comments for brief notes: `// eslint-disable-next-line no-unused-vars`
- Block comments for complex sections are minimal
- No JSDoc/TSDoc observed—types speak for themselves in TypeScript

## Function Design

**Size:** 
- Small, focused functions: `validarId()`, `cargarDraft()` are 5-10 lines
- Route handlers are 10-20 lines with clear flow
- Async handlers use try-catch for error propagation

**Parameters:**
- Positional for required params: `obtenerRepositorio()`
- Options objects for optional configs: `{ legacy } = {}` in `crearApp`
- Destructuring in function signatures: `{ faseId } = req.params`

**Return Values:**
- Explicit returns, no implicit undefined
- Async functions always return Promise
- Middleware returns early with response or delegates to `next(err)`

**Async Patterns:**
- All data-access functions are async: `await repo.crearDraft()`
- Error handling in async routes: try-catch with `next(err)`
- No promise chains—all async/await

## Module Design

**Exports:**
- Default exports for components: `export default function TopBar() {}`
- Named exports for utilities, functions, classes: `export class AppError`, `export const api = {}`
- Config modules export single default or named object: `export const configFases = {}`

**Single Responsibility:**
- Routes in `routes/` handle endpoints only
- Repositories in `repositories/` handle data access (abstraction)
- Middleware in `middleware/` handle cross-cutting concerns
- Utils in `utils/` are stateless helpers

**Dependency Injection:**
- App receives `legacy` option: `crearApp({ legacy })`
- Repository injected via function call: `obtenerRepositorio()` 
- No class constructors for singleton pattern—factory functions preferred

**Factories and Singletons:**
- Singleton pattern: `let repositorio = null` with lazy initialization
- Factory functions: `crearRepositorioMemoria()`, `crearRepositorioPostgres()`, `crearApp()`
- Stateless utilities: mask functions, validation schemas

## React Component Patterns

**Functional Components:**
- React hooks only: `useState`, `useCallback`, `useContext`, `useMemo`, `useEffect`
- No class components
- Hooks used for state management and side effects

**Props:**
- Interface named `Props`: small, focused
- Destructure in parameter: `function Component({ prop1, prop2 }: Props)`
- Type imports for shared types: `import type { ConfigPortal } from '../types'`

**Context Pattern:**
- Context created with `createContext<ValueType | null>(null)`
- Provider component wraps children: `export function WizardProvider({ children })`
- Explicit null return type allows safe checking in components

**State Management:**
- Local state with `useState` for component-level state
- Context for shared state: `WizardContext` holds form data, phase tracking, loading state
- localStorage for persistence: `CLAVE_DRAFT` for draft ID recovery

## Validation

**Schema Validation:**
- Zod library (`import { ZodError } from 'zod'`)
- Schemas defined per phase: `esquemasPorFase[faseId]`
- Parsed with `.parse()`: throws error on validation failure
- Safer parsing with `.safeParse()`: returns `{ success: boolean, data?, error? }`
- Normalization within schemas: CURP converted to uppercase

**Error Details:**
- Validation errors include field path and message: `{ campo: e.path.join('.'), mensaje: e.message }`
- Detalles array returned in API response for client-side field-level errors

## Encryption/Sensitive Data

**Pattern:** 
- Sensitive phases marked with `fase.sensible` flag
- Data encrypted before storage: `const aGuardar = fase.sensible ? cifrar(datosValidados) : datosValidados`
- Decrypted on retrieval: `if (fase.sensible && estaCifrado(datos[fase.id])) { datos[fase.id] = descifrar(...) }`

**Masking in ARCO:**
- CURP masked: first 4 chars visible + asterisks
- Phone: last 4 digits visible, rest masked
- Applied at API response level, not in database

---

*Convention analysis: 2026-07-15*
