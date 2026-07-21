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

const runtimeDockerfile = `# Runtime image for the prebuilt standalone app in this folder.
# Rebuilds better-sqlite3 for the container CPU/OS.
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

for (const file of ["docker-compose.yml", ".env.example", ".env", ".dockerignore"]) {
  const from = path.join(root, file);
  if (!fs.existsSync(from)) {
    console.warn(`postbuild: skip missing ${file}`);
    continue;
  }
  fs.copyFileSync(from, path.join(outDir, file));
  console.log(`postbuild: copied ${file} → out/${file}`);
}

// Prefer an existing out/.env if root has none (already handled by copy above).
// Do not exclude env from the deploy image context.
fs.writeFileSync(
  path.join(outDir, ".dockerignore"),
  `.git
data
*.md
.DS_Store
`,
);
console.log("postbuild: wrote out/.dockerignore");

const leakedData = path.join(outDir, "data");
if (fs.existsSync(leakedData)) {
  fs.rmSync(leakedData, { recursive: true, force: true });
  console.log("postbuild: removed out/data (runtime volume only)");
}
