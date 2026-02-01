
# RestoFlux - Guía de Migración a Producción

Esta guía detalla los pasos necesarios para transformar la aplicación actual (MVP Client-Side con lógica robusta) a una arquitectura de producción completa utilizando PostgreSQL y Node.js.

El archivo `services/db.ts` actual actúa como un **Adaptador**. Para pasar a producción, no necesitas reescribir la UI, solo reemplazar este adaptador.

## 1. Arquitectura de Datos (PostgreSQL Schema)

Ejecuta el siguiente script SQL para crear la estructura relacional necesaria.

```sql
-- Habilitar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants (SaaS Isolation)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'BASIC', -- 'BASIC', 'PRO', 'ENTERPRISE'
    subscription_status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'
);

-- 2. Roles & Users (RBAC)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    permissions TEXT[], -- Array de strings: ['tables.view', 'kitchen.manage']
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Catalog (Products & Categories)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    category_id UUID REFERENCES categories(id),
    sku VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_enabled BOOLEAN DEFAULT FALSE,
    stock_quantity INT DEFAULT 0,
    stock_min INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT
);

-- 4. Operations (Tables, Orders)
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    number VARCHAR(20) NOT NULL,
    capacity INT DEFAULT 4,
    zone VARCHAR(50), -- 'Interior', 'Exterior'
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'OCCUPIED'
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    table_id UUID REFERENCES tables(id),
    status VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'PAID', 'CANCELLED'
    total DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(20), -- 'CASH', 'CARD', 'TRANSFER'
    opened_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    closed_by UUID REFERENCES users(id)
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL,
    price_at_moment DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PREPARING', 'READY', 'DELIVERED'
    sent_at TIMESTAMP
);

-- 5. Audits & Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    payload JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

## 2. Estrategia de Migración del Frontend

Actualmente, toda la lógica reside en `services/db.ts`. Para conectar con el Backend (API), debes refactorizar este archivo para que use `fetch` o `axios` en lugar de `localStorage`.

### Ejemplo de Refactorización (`services/api.ts`)

```typescript
// Reemplazo futuro para db.ts
const API_URL = import.meta.env.VITE_API_URL;

class ApiService {
  private async request(endpoint: string, method = 'GET', body?: any) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // --- Methods Mapped to Old DB Service ---

  // Antes: db.query('tables', tenantId)
  async getTables() {
    return this.request('/tables');
  }

  // Antes: db.createOrder(...)
  async createOrder(tableId: string) {
    return this.request('/orders', 'POST', { tableId });
  }
  
  // Antes: db.removeTable(...)
  async deleteTable(tableId: string) {
    // El backend se encargará de validar pedidos abiertos y hacer Soft Delete
    return this.request(`/tables/${tableId}`, 'DELETE');
  }
}
```

## 3. Lógica de Backend Necesaria (Node.js)

Al implementar el servidor, debes mover las validaciones que añadimos hoy en `db.ts` hacia los controladores del API.

1.  **Endpoints Críticos:**
    *   `DELETE /tables/:id`: Debe ejecutar la consulta SQL:
        ```sql
        -- Pseudo-código
        IF EXISTS (SELECT 1 FROM orders WHERE table_id = :id AND status = 'OPEN')
           THROW "Mesa con pedidos activos"
        ELSE IF EXISTS (SELECT 1 FROM orders WHERE table_id = :id)
           UPDATE tables SET is_active = false WHERE id = :id
        ELSE
           DELETE FROM tables WHERE id = :id
        ```

2.  **Sincronización en Tiempo Real:**
    *   Para la pantalla de **Cocina (`Kitchen.tsx`)**, se recomienda implementar **WebSockets (Socket.io)** en lugar del `setInterval` actual.
    *   Evento: `order:created` -> Notificar a cocina.
    *   Evento: `item:ready` -> Notificar a mozos.

## 4. Variables de Entorno

Configura tu hosting (Vercel/Netlify + Railway/AWS) con:

```env
# Frontend
VITE_API_URL=https://api.tudominio.com

# Backend
DATABASE_URL=postgresql://restoflux:restoflux@host:5432/restoflux
JWT_SECRET=super_secret_key_production
MP_ACCESS_TOKEN=APP_USR-xxxxxx-xxxxxx (Mercado Pago Production Token)

# IA (Gemini)
# La API key y modelos se configuran desde el panel de Admin Global (/admin) y se guardan en DB.
# No se expone la key al frontend.

### SMTP (notificaciones + recuperación de contraseña)

Configurar en EasyPanel (NO commitear secretos):

- `SMTP_HOST` (ej: `smtp.gmail.com`)
- `SMTP_PORT` (ej: `587`)
- `SMTP_USER` (ej: tu cuenta Gmail)
- `SMTP_PASS` (Gmail App Password)
- `SMTP_FROM` (ej: `RestoFlux <tu-mail@gmail.com>`)
- `PUBLIC_BASE_URL` (ej: `https://restoflux.accesoit.com.ar`)

Notas:
- Para Gmail se recomienda usar *App Password* y tener 2FA habilitado.
- `PUBLIC_BASE_URL` se usa para armar el link de reseteo (`/app/reset-password` y `/admin/reset-password`).
```

## 5. Resumen de pasos

1.  Provisionar base de datos PostgreSQL.
2.  Ejecutar scripts SQL de esquema.
3.  Crear API Node.js/Express que exponga endpoints RESTful equivalentes a los métodos de `db.ts`.
4.  Reemplazar `services/db.ts` por `services/api.ts` en el frontend.
5.  Desplegar.
