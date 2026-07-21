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

## Deploy on VPS (no Next.js build on the server)

Build once on your machine (or CI), then deploy the prebuilt `out/` folder:

```bash
# on your computer
npm run build          # fills out/ with standalone app + Docker files
git add out && git commit && git push
```

On the VPS (Traefik must already be on `flowdraw-network`):

```bash
cd out                 # or clone repo and cd out
# edit .env if needed (FLOWDRAW_HOST, SESSION_SECRET, ADMIN_*)
docker compose -p flowdraw-priv up -d --build
```

Docker only packages the uploaded files and runs `node server.js`. It does **not** run `next build`. The only compile step is rebuilding the SQLite native addon for Linux.

- Container: `container-flowdraw-priv`
- Volume: `flowdraw-priv-data` → `/data`
- Traefik cert resolver: `mytlschallenge`
- Entrypoint: `websecure`

## Optional: build from source on the VPS

From the repo root (slower; runs a full Next.js build inside Docker):

```bash
docker compose -p flowdraw-priv up -d --build
```

## Project structure

```
src/                    # app source
out/                    # prebuilt deploy package (committed after npm run build)
Dockerfile              # source build (repo root)
docker-compose.yml
```
