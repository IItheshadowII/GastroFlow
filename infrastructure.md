
# GastroFlow Infrastructure & Deployment

## 1. Local Infrastructure (Docker Compose)

Create a `docker-compose.yml` in the project root:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: gastroflow
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://admin:password123@db:5432/gastroflow
      JWT_SECRET: your_ultra_secret_key
      MP_ACCESS_TOKEN: your_mercadopago_token
    ports:
      - "4000:4000"
    depends_on:
      - db

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:4000
```

## 2. Cloud Deployment (Google Cloud Run / Railway)

### Backend
1. Containerize the Express/Node app using a `Dockerfile`.
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy gastroflow-api --image gcr.io/project/api --platform managed
   ```
3. Set Env Vars: `DATABASE_URL`, `JWT_SECRET`, `MP_WEBHOOK_SECRET`.

### Database
- Use **Managed PostgreSQL** (Cloud SQL or Railway DB).
- Run migrations: `npx prisma migrate deploy`.

### Mercado Pago Webhooks
1. Configure your endpoint in MP Dashboard: `https://api.gastroflow.com/v1/webhooks/mercadopago`.
2. Secure the endpoint verifying the IP and token.

## 3. RBAC & Multi-tenant isolation
The system enforces `tenant_id` at the Prisma level using a middleware or by always including it in queries:
`prisma.product.findMany({ where: { tenantId: currentUser.tenantId } })`.
