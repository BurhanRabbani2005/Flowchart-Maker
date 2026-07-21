# FlowDraw (self-hosted)

Private, multi-user flowchart editor for your own VPS. Users sign in; admins create accounts; flowcharts and revision history live on a Docker volume.

## Features

- Login (admin creates users — no public signup)
- Home page listing server-stored flowcharts
- Soft edit locks (alert if someone else has the file open; read-only option)
- Save history / revisions (who + when; restore)
- Traefik-friendly Docker stack on external network `flowdraw-network`

## Local development

```bash
cp .env.example .env
# set SESSION_SECRET and ADMIN_PASSWORD

npm install
DATA_DIR=./data SESSION_SECRET=dev-secret-at-least-16 ADMIN_PASSWORD=admin npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the seeded admin.

## Docker / Traefik (stack `flowdraw-priv`)

Requires Traefik already running and attached to Docker network `flowdraw-network`.

```bash
cp .env.example .env
# set FLOWDRAW_HOST, SESSION_SECRET, ADMIN_PASSWORD

docker compose -p flowdraw-priv up -d --build
```

- Container name: `container-flowdraw-priv`
- Volume: `flowdraw-priv-data` → `/data`
- TLS cert resolver: `mytlschallenge`
- Entrypoint: `websecure`

## Project structure

```
src/
  app/                  # pages + API routes
  components/           # editor UI
  lib/                  # auth, db, storage, locks
  proxy.ts              # session gate (Next.js proxy)
Dockerfile
docker-compose.yml
```
