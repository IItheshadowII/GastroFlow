# RestroFlux - Deploy en Portainer y GHCR

## Qué cambió

- La app ya no depende de una imagen local `restroflux-app:latest`.
- El stack usa por defecto `ghcr.io/iitheshadowii/restroflux-app:latest`.
- El build y publish de la app se hace con GitHub Actions a GHCR.
- MinIO usa `minio/minio:latest`, que es un tag válido y existente.

## Workflow de GitHub Actions

El workflow está en [.github/workflows/publish-ghcr.yml](.github/workflows/publish-ghcr.yml) y publica:

- `latest` cuando hay push a `main`
- `sha-<commit>` en cada build
- el nombre del tag git cuando publicas un release/tag

## Cómo habilitar GHCR

1. En GitHub, entra al repositorio y habilita GitHub Actions si todavía no está habilitado.
2. En Settings > Actions > General, deja permitido el uso del `GITHUB_TOKEN` con permisos de lectura y escritura.
3. En Settings > Packages, verifica que el paquete `restroflux-app` exista después del primer workflow.
4. Si quieres desplegar desde Portainer sin credenciales de registry, marca el paquete GHCR como público.
5. Si prefieres mantenerlo privado, crea un access token o usa credenciales de GitHub en Portainer Registry.

## Permisos que necesita el workflow

- `contents: read`
- `packages: write`

Esos permisos ya quedan declarados en el workflow.

## Variables opcionales de build

Si quieres personalizar el frontend compilado en la imagen desde GitHub Actions, crea Repository Variables en GitHub:

- `VITE_APP_MODE`
- `VITE_API_URL`
- `VITE_CLOUD_URL`
- `VITE_LICENSE_KEY`
- `VITE_INSTANCE_ID`
- `VITE_LICENSE_CHECK_INTERVAL_DAYS`
- `VITE_LICENSE_GRACE_DAYS`

Si no las defines, el workflow usa defaults seguros.

## Desplegar desde Portainer Repository

Usa [docker-compose.yml](docker-compose.yml).

1. Espera a que el workflow publique la imagen en GHCR.
2. En Portainer crea un stack desde Git repository.
3. Selecciona este repositorio y el archivo `docker-compose.yml`.
4. Carga en variables del stack, como mínimo:
   - `JWT_SECRET`
   - `DB_PASSWORD` o `DATABASE_URL`
   - `PUBLIC_BASE_URL`
5. Opcionalmente define:
   - `RESTROFLUX_IMAGE` si quieres fijar una imagen por `sha-...` o por tag
   - `MINIO_IMAGE`
   - `GEMINI_API_KEY`
   - `MP_ACCESS_TOKEN`
   - `MP_WEBHOOK_SECRET`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
6. Despliega el stack.

## Desplegar en Portainer Swarm

Usa [stack.yml](stack.yml).

1. Publica primero la imagen con GitHub Actions.
2. En Portainer Stack/Web editor o Repository usa `stack.yml`.
3. Si quieres inmovilizar versión, define `RESTROFLUX_IMAGE=ghcr.io/iitheshadowii/restroflux-app:sha-<commit>`.
4. Carga las mismas variables de entorno del despliegue normal.

## Notas operativas

- El hostname interno de PostgreSQL es `restroflux-postgres`.
- PostgreSQL y MinIO quedan internos al stack por defecto.
- Si usas PostgreSQL interno del stack, deja `DATABASE_SSL=false`.
- No publiques `5432`, `9000` ni `9001` salvo necesidad operativa concreta.
