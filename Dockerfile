# ── Stage 1 : Build du frontend ──────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Layer caching : package.json d'abord
COPY frontend/package*.json ./
RUN npm install

# Sources ensuite (change souvent)
COPY frontend/ .
RUN npm run build

# ── Stage 2 : Image de production ────────────────────
FROM node:22-alpine

# Mise à jour des packages système (sécurité)
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Dépendances production uniquement
COPY backend/package*.json ./
RUN npm install --only=production && npm cache clean --force

# Code backend
COPY backend/ .

# Résultat du build frontend
COPY --from=frontend-builder /app/frontend/build ./public

# Sécurité : utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["node", "server.js"]