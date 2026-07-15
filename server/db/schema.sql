-- ClinicConnect: esquema PostgreSQL
-- Aplicar con: psql -d clinicconnect -f server/db/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Borradores del wizard (retomables por id).
CREATE TABLE IF NOT EXISTS drafts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_actual    INTEGER NOT NULL DEFAULT 0,
  -- datos por fase; la fase de datos clínicos se guarda como cadena cifrada (AES-256-GCM)
  datos          JSONB NOT NULL DEFAULT '{}'::jsonb,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pre-registros finalizados.
CREATE TABLE IF NOT EXISTS pre_registros (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio            TEXT NOT NULL UNIQUE,
  datos_personales JSONB NOT NULL,
  domicilio        JSONB NOT NULL,
  -- cadena cifrada AES-256-GCM (cifrado en reposo de datos sensibles)
  datos_clinicos   TEXT NOT NULL,
  -- consentimiento trazable: { aceptado, versionAviso, timestamp, ip }
  consentimiento   JSONB NOT NULL,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pre_registros_folio ON pre_registros (folio);
