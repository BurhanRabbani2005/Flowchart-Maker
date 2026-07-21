import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const standaloneDir = path.join(root, ".next", "standalone");
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");

function copyRecursive(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true, force: true });
}

if (!fs.existsSync(standaloneDir)) {
  console.error(
    "postbuild: missing .next/standalone — run `next build` with output: 'standalone' first",
  );
  process.exit(1);
}

// Keep deploy secrets across rebuilds of out/
const preservedEnv =
  fs.existsSync(path.join(outDir, ".env"))
    ? fs.readFileSync(path.join(outDir, ".env"))
    : fs.existsSync(path.join(root, ".env"))
      ? fs.readFileSync(path.join(root, ".env"))
      : null;

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

copyRecursive(standaloneDir, outDir);
console.log("postbuild: copied .next/standalone → out/");

const outStatic = path.join(outDir, ".next", "static");
fs.mkdirSync(path.join(outDir, ".next"), { recursive: true });
if (fs.existsSync(staticDir)) {
  copyRecursive(staticDir, outStatic);
  console.log("postbuild: copied .next/static → out/.next/static");
}

if (fs.existsSync(publicDir)) {
  copyRecursive(publicDir, path.join(outDir, "public"));
  console.log("postbuild: copied public → out/public");
}

const runtimeDockerfile = `# Serves the prebuilt Next.js standalone app already in this folder.
# Does NOT run \`next build\` — only rebuilds the native SQLite addon for Linux.
FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/data
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \\
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \\
  && rm -rf /var/lib/apt/lists/* \\
  && groupadd --system --gid 1001 nodejs \\
  && useradd --system --uid 1001 --gid nodejs nextjs \\
  && mkdir -p /data \\
  && chown nextjs:nodejs /data

COPY --chown=nextjs:nodejs . .

# Native module was compiled on the build machine; rebuild for this container OS/CPU.
RUN npm rebuild better-sqlite3 \\
  && apt-get purge -y python3 make g++ \\
  && apt-get autoremove -y \\
  && rm -rf /var/lib/apt/lists/*

USER nextjs
EXPOSE 3000
VOLUME ["/data"]
CMD ["node", "server.js"]
`;

fs.writeFileSync(path.join(outDir, "Dockerfile"), runtimeDockerfile);
console.log("postbuild: wrote out/Dockerfile");

const deployCompose = `name: flowdraw-priv

services:
  flowdraw:
    build: .
    container_name: container-flowdraw-priv
    restart: unless-stopped
    env_file:
      - .env
    environment:
      DATA_DIR: /data
      NODE_ENV: production
    volumes:
      - flowdraw-priv-data:/data
    networks:
      - flowdraw-network
    labels:
      - traefik.enable=true
      - traefik.docker.network=flowdraw-network
      - traefik.http.routers.flowdraw-priv.rule=Host(\`\${FLOWDRAW_HOST}\`)
      - traefik.http.routers.flowdraw-priv.entrypoints=websecure
      - traefik.http.routers.flowdraw-priv.tls=true
      - traefik.http.routers.flowdraw-priv.tls.certresolver=mytlschallenge
      - traefik.http.services.flowdraw-priv.loadbalancer.server.port=3000

volumes:
  flowdraw-priv-data:

networks:
  flowdraw-network:
    external: true
`;

fs.writeFileSync(path.join(outDir, "docker-compose.yml"), deployCompose);
console.log("postbuild: wrote out/docker-compose.yml");

if (fs.existsSync(path.join(root, ".env.example"))) {
  fs.copyFileSync(
    path.join(root, ".env.example"),
    path.join(outDir, ".env.example"),
  );
  console.log("postbuild: copied .env.example → out/.env.example");
}

if (preservedEnv) {
  fs.writeFileSync(path.join(outDir, ".env"), preservedEnv);
  console.log("postbuild: restored out/.env");
} else {
  console.warn("postbuild: no .env found to copy into out/");
}

fs.writeFileSync(
  path.join(outDir, ".dockerignore"),
  `.git
data
*.md
.DS_Store
`,
);
console.log("postbuild: wrote out/.dockerignore");
