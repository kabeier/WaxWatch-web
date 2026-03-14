import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = process.cwd();
const runtimeContractPath = resolve(repoRoot, "src/config/env.ts");
const envExamplePath = resolve(repoRoot, ".env.example");
const envSamplePath = resolve(repoRoot, ".env.sample");

function getKeysFromRuntimeContractObject(source, objectName, filePath) {
  const contractMatch = source.match(
    new RegExp(`const\\s+${objectName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`),
  );

  if (!contractMatch) {
    if (objectName === "optionalEnv") {
      return [];
    }
    throw new Error(`Unable to find ${objectName} object in ${filePath}`);
  }

  const keys = [];
  const keyPattern = /^\s*([A-Z][A-Z0-9_]+):/gm;
  let match;

  while ((match = keyPattern.exec(contractMatch[1])) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

function getRuntimeContractKeys(filePath) {
  const source = readFileSync(filePath, "utf8");
  const requiredKeys = getKeysFromRuntimeContractObject(source, "requiredEnv", filePath);
  const optionalKeys = getKeysFromRuntimeContractObject(source, "optionalEnv", filePath);

  if (requiredKeys.length === 0) {
    throw new Error(`No environment keys found in requiredEnv object in ${filePath}`);
  }

  return {
    requiredKeys,
    optionalKeys,
    allowedKeys: [...requiredKeys, ...optionalKeys],
  };
}

function getKeysFromTemplate(filePath) {
  const content = readFileSync(filePath, "utf8");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("=")[0]?.trim())
    .filter(Boolean);
}

function diffKeys(expectedKeys, actualKeys) {
  const expected = new Set(expectedKeys);
  const actual = new Set(actualKeys);

  const missing = expectedKeys.filter((key) => !actual.has(key));
  const extra = actualKeys.filter((key) => !expected.has(key));

  return { missing, extra };
}

const { requiredKeys, optionalKeys, allowedKeys } = getRuntimeContractKeys(runtimeContractPath);
const envExampleKeys = getKeysFromTemplate(envExamplePath);
const { missing } = diffKeys(requiredKeys, envExampleKeys);
const allowedKeySet = new Set(allowedKeys);
const envExampleKeySet = new Set(envExampleKeys);
const extra = envExampleKeys.filter((key) => !allowedKeySet.has(key));

const errors = [];
if (missing.length > 0) {
  errors.push(`.env.example is missing required keys: ${missing.join(", ")}`);
}
if (extra.length > 0) {
  errors.push(`.env.example contains keys not in runtime contract: ${extra.join(", ")}`);
}
if (optionalKeys.length > 0) {
  const missingOptional = optionalKeys.filter((key) => !envExampleKeySet.has(key));
  if (missingOptional.length > 0) {
    errors.push(
      `.env.example is missing optional runtime keys (recommended for discoverability): ${missingOptional.join(", ")}`,
    );
  }
}
if (existsSync(envSamplePath)) {
  errors.push(
    "Found deprecated .env.sample. Remove it and keep .env.example as the single template source.",
  );
}

if (errors.length > 0) {
  throw new Error(`Environment template sync check failed:\n${errors.join("\n")}`);
}

console.log("Environment template sync check passed.");
