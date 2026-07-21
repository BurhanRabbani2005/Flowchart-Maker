import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");

fs.mkdirSync(outDir, { recursive: true });

const files = ["Dockerfile", "docker-compose.yml"];

for (const file of files) {
  const from = path.join(root, file);
  const to = path.join(outDir, file);
  if (!fs.existsSync(from)) {
    console.warn(`postbuild: skip missing ${file}`);
    continue;
  }
  fs.copyFileSync(from, to);
  console.log(`postbuild: copied ${file} → out/${file}`);
}
