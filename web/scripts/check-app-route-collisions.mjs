/**
 * Falha o build se existirem duas page.tsx para a mesma rota pública
 * (ex.: `[locale]/ferramentas` e `[locale]/(marketing)/ferramentas`).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localeApp = path.join(webRoot, "src", "app", "[locale]");

function routeKey(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  const withoutPage = normalized.replace(/\/page\.tsx$/, "");
  const segments = withoutPage.split("/").filter(Boolean);
  const routeSegments = segments.filter(
    (seg) => !(seg.startsWith("(") && seg.endsWith(")")),
  );
  return routeSegments.join("/") || "/";
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else if (entry.name === "page.tsx") {
      acc.push(full);
    }
  }
  return acc;
}

const pages = walk(localeApp);
const byRoute = new Map();

for (const file of pages) {
  const rel = path.relative(localeApp, file);
  const key = routeKey(rel);
  const list = byRoute.get(key) ?? [];
  list.push(rel);
  byRoute.set(key, list);
}

const collisions = [...byRoute.entries()].filter(([, files]) => files.length > 1);

if (collisions.length > 0) {
  console.error("Colisões de rota detectadas em src/app/[locale]:");
  for (const [route, files] of collisions) {
    console.error(`  /${route === "/" ? "" : route}`);
    for (const f of files) console.error(`    - ${f}`);
  }
  process.exit(1);
}

console.log(`OK: ${pages.length} páginas, 0 colisões.`);
