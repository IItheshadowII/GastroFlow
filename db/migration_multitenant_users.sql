-- ====================================
-- GastroFlow SaaS - Multi-tenant Users/Roles (Global Admin + Tenant Admin)
-- Fecha: 2026-01-20
--
-- Objetivo:
-- - Admin global (puede gestionar todos los tenants)
-- - Admin por tenant (gestiona usuarios/roles dentro de su tenant)
-- - Aislamiento por tenant_id (row-level, con protección por constraints/triggers)
--
-- Recomendación: ejecutar en una ventana de mantenimiento.
-- ====================================

BEGIN;

-- 0) Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Global admins (fuera del ámbito tenant)
CREATE TABLE IF NOT EXISTS global_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2) Roles (asegurar columnas y constraints)
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Evitar roles duplicados por tenant
CREATE UNIQUE INDEX IF NOT EXISTS ux_roles_tenant_name ON roles(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);

-- 3) Users (asegurar columnas)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4) Aislamiento lógico: un user no puede tener un role de otro tenant
-- (FK no puede validar "tenant_id" de ambas tablas, así que usamos trigger)

CREATE OR REPLACE FUNCTION ensure_user_role_same_tenant()
RETURNS TRIGGER AS $$
DECLARE
  role_tenant UUID;
BEGIN
  IF NEW.role_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT tenant_id INTO role_tenant FROM roles WHERE id = NEW.role_id;

  IF role_tenant IS NULL THEN
    RAISE EXCEPTION 'Role % no existe', NEW.role_id;
  END IF;

  IF role_tenant <> NEW.tenant_id THEN
    RAISE EXCEPTION 'Role % pertenece a otro tenant (role.tenant_id=%, user.tenant_id=%)', NEW.role_id, role_tenant, NEW.tenant_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_role_same_tenant'
  ) THEN
    CREATE TRIGGER trg_users_role_same_tenant
    BEFORE INSERT OR UPDATE OF role_id, tenant_id ON users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_role_same_tenant();
  END IF;
END $$;

-- 5) (Opcional) Row Level Security (RLS)
-- Nota: requiere que la app haga SET app.tenant_id por request/transaction.
-- Descomentá y aplicá solo si vas a usar RLS.
--
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY users_tenant_isolation ON users
--   USING (tenant_id::text = current_setting('app.tenant_id', true));
--
-- CREATE POLICY roles_tenant_isolation ON roles
--   USING (tenant_id::text = current_setting('app.tenant_id', true));

COMMIT;
