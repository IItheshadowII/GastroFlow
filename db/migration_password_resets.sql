-- ====================================
-- RestoFlux SaaS - Password Resets (tenant + global)
-- Fecha: 2026-01-21
--
-- Objetivo:
-- - Soportar recuperación de contraseña para usuarios tenant y admin global
-- - Token hasheado (sha256) con expiración y uso único
-- ====================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope VARCHAR(10) NOT NULL,          -- 'tenant' | 'global'
  email VARCHAR(255) NOT NULL,
  tenant_id UUID,
  user_id UUID,
  admin_id UUID,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_created ON password_resets(created_at DESC);

COMMIT;
