# ====================================
# GastroFlow SaaS - Dockerfile
# Para despliegue en EasyPanel
# BUILD: 2026-01-23 v2.1.1
# ====================================

# Etapa 1: Build del Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar TODAS las dependencias (incluyendo devDependencies para build)
RUN npm ci

# Copiar el código fuente
COPY . .

# Construir el frontend (Vite)
RUN npm run build

# ====================================
# Etapa 2: Producción
# ====================================
FROM node:20-alpine AS production

WORKDIR /app

# Copiar package.json y lock
COPY package.json package-lock.json* ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar el servidor Node.js
COPY server.js ./

# Copiar el build del frontend desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Puerto expuesto (EasyPanel lo detecta)
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["node", "server.js"]
