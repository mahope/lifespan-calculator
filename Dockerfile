# Stage 1: build the static site (Astro) into /app/dist.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Caddy serves dist/ on :3000 as a non-root user (config: Caddyfile).
FROM caddy:2.11.7-alpine
# curl for the Dokploy/Swarm healthcheck command (`curl -fsS http://127.0.0.1:3000/api/health`).
RUN apk add --no-cache curl \
 && addgroup -S web && adduser -S -G web -H web \
 && mkdir -p /data /config && chown web:web /data /config
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build --chown=web:web /app/dist /srv
USER web
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
