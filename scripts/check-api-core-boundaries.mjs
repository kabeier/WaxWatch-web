import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const rootDir = process.cwd();
const apiCoreDir = join(rootDir, "src/lib/api");
const disallowedImportPatterns = [
  /^react(?:\/|$)/,
  /^next(?:\/|$)/,
  /^@\/components(?:\/|$)/,
  /^@\/lib\/query(?:\/|$)/,
  /^@web-query(?:\/|$)/,
  /^client-only(?:\/|$)/,
];

const disallowedIdentifierPatterns = [
  /\bwindow\b/,
  /\bdocument\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
];

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function walkFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      files.push(...walkFiles(path));
      continue;
    }

    const ext = path.slice(path.lastIndexOf("."));
    if (sourceExtensions.has(ext)) {
      files.push(path);
    }
  }

  return files;
}

function collectImportSpecifiers(source) {
  const specs = [];
  const importRegex = /(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["'`]([^"'`]+)["'`]/g;
  const dynamicImportRegex = /import\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

  let match;
  while ((match = importRegex.exec(source)) !== null) {
    specs.push(match[1]);
  }
  while ((match = dynamicImportRegex.exec(source)) !== null) {
    specs.push(match[1]);
  }

  return specs;
}

const files = walkFiles(apiCoreDir);
const violations = [];

for (const file of files) {
  const relPath = relative(rootDir, file);
  if (/\.(test|spec)\.[jt]sx?$/.test(relPath)) {
    continue;
  }

  const source = readFileSync(file, "utf8");

  for (const specifier of collectImportSpecifiers(source)) {
    if (disallowedImportPatterns.some((pattern) => pattern.test(specifier))) {
      violations.push(`${relPath}: disallowed import \"${specifier}\"`);
    }
  }

  for (const pattern of disallowedIdentifierPatterns) {
    if (pattern.test(source)) {
      violations.push(`${relPath}: disallowed browser global matched ${pattern}`);
    }
  }
}

if (violations.length > 0) {
  console.error("\nAPI core boundary violations detected:\n");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("API core boundary check passed.");
