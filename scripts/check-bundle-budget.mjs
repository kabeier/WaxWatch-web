import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const budgetBytes = Number(process.env.BUNDLE_BUDGET_BYTES ?? 500000);
const buildDir = process.env.NEXT_BUILD_DIR ?? ".next";
const staticDir = join(buildDir, "static");

function sumJsSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      total += sumJsSize(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      total += statSync(fullPath).size;
    }
  }
  return total;
}

function readJsonIfExists(path) {
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function sumManifestFiles(files) {
  let total = 0;
  for (const file of files) {
    if (!file.endsWith(".js")) {
      continue;
    }

    const fullPath = join(buildDir, file);
    if (existsSync(fullPath)) {
      total += statSync(fullPath).size;
    }
  }
  return total;
}

if (!existsSync(staticDir)) {
  throw new Error(
    `Missing build output at ${staticDir}. Run \`npm run build\` before \`npm run bundle:check\`.`,
  );
}

const buildManifest = readJsonIfExists(join(buildDir, "build-manifest.json"));
const appBuildManifest = readJsonIfExists(join(buildDir, "app-build-manifest.json"));

const sharedFiles = new Set([
  ...(buildManifest?.polyfillFiles ?? []),
  ...(buildManifest?.rootMainFiles ?? []),
]);

const routeCandidates = [];
for (const [route, files] of Object.entries(appBuildManifest?.pages ?? {})) {
  routeCandidates.push({ route, files: [...sharedFiles, ...files] });
}

for (const [route, files] of Object.entries(buildManifest?.pages ?? {})) {
  routeCandidates.push({ route, files: [...sharedFiles, ...files] });
}

if (routeCandidates.length === 0) {
  const total = sumJsSize(staticDir);
  if (total > budgetBytes) {
    throw new Error(`Bundle budget exceeded: ${total} bytes > ${budgetBytes} bytes`);
  }

  console.log(`Bundle budget ok (total static JS): ${total} bytes <= ${budgetBytes} bytes`);
  process.exit(0);
}

let maxRoute = { route: "(none)", bytes: 0 };
for (const candidate of routeCandidates) {
  const bytes = sumManifestFiles(new Set(candidate.files));
  if (bytes > maxRoute.bytes) {
    maxRoute = { route: candidate.route, bytes };
  }
}

if (maxRoute.bytes > budgetBytes) {
  throw new Error(
    `Bundle budget exceeded: route "${maxRoute.route}" uses ${maxRoute.bytes} bytes > ${budgetBytes} bytes`,
  );
}

console.log(
  `Bundle budget ok (max route JS): route "${maxRoute.route}" uses ${maxRoute.bytes} bytes <= ${budgetBytes} bytes`,
);
