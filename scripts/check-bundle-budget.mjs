/* eslint-env node */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const routeBudgetBytes = Number(process.env.BUNDLE_ROUTE_BUDGET_BYTES ?? 185000);
const appSharedBudgetBytes = Number(process.env.BUNDLE_SHARED_BUDGET_BYTES ?? 360000);
const appOwnedBudgetBytes = Number(process.env.BUNDLE_BUDGET_BYTES ?? 500000);
const frameworkBudgetBytes = Number(process.env.BUNDLE_FRAMEWORK_BUDGET_BYTES ?? 525000);
const reportLimit = Number(process.env.BUNDLE_REPORT_LIMIT ?? 8);
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

function readFileSize(file) {
  if (!file.endsWith(".js")) {
    return 0;
  }

  const fullPath = join(buildDir, file);
  return existsSync(fullPath) ? statSync(fullPath).size : 0;
}

function isBudgetRoute(route) {
  return route.startsWith("/") && !route.startsWith("/_") && !route.startsWith("/api");
}

function formatBytes(bytes) {
  return `${bytes.toLocaleString()} bytes`;
}

function formatChunkList(files) {
  return files
    .slice(0, 3)
    .map(({ file, bytes }) => `${formatBytes(bytes)} ${file}`)
    .join(", ");
}

function buildRouteCandidates({ appManifestPages, buildManifestPages, frameworkSharedFiles }) {
  const routeEntries = [];

  for (const [route, files] of Object.entries(appManifestPages ?? {})) {
    if (isBudgetRoute(route)) {
      routeEntries.push({ route, files: [...new Set(files)] });
    }
  }

  for (const [route, files] of Object.entries(buildManifestPages ?? {})) {
    if (isBudgetRoute(route)) {
      routeEntries.push({ route, files: [...new Set(files)] });
    }
  }

  const sharedUsageCounts = new Map();
  for (const { files } of routeEntries) {
    for (const file of files) {
      if (frameworkSharedFiles.has(file) || !file.endsWith(".js")) {
        continue;
      }

      sharedUsageCounts.set(file, (sharedUsageCounts.get(file) ?? 0) + 1);
    }
  }

  const appSharedFiles = new Set(
    [...sharedUsageCounts.entries()].filter(([, count]) => count > 1).map(([file]) => file),
  );

  const frameworkSharedPayload = [...frameworkSharedFiles]
    .map((file) => ({ file, bytes: readFileSize(file) }))
    .filter(({ bytes }) => bytes > 0)
    .sort((a, b) => b.bytes - a.bytes);

  const frameworkSharedBytes = frameworkSharedPayload.reduce(
    (total, file) => total + file.bytes,
    0,
  );
  const appSharedBytes = [...appSharedFiles].reduce((total, file) => total + readFileSize(file), 0);

  const routeCandidates = routeEntries.map(({ route, files }) => {
    const appShared = [];
    const exclusive = [];

    for (const file of files) {
      const bytes = readFileSize(file);
      if (bytes === 0 || frameworkSharedFiles.has(file)) {
        continue;
      }

      const payload = { file, bytes };
      if (appSharedFiles.has(file)) {
        appShared.push(payload);
      } else {
        exclusive.push(payload);
      }
    }

    const routeAppSharedBytes = appShared.reduce((total, file) => total + file.bytes, 0);
    const exclusiveBytes = exclusive.reduce((total, file) => total + file.bytes, 0);
    const appOwnedBytes = routeAppSharedBytes + exclusiveBytes;

    return {
      route,
      frameworkSharedBytes,
      appSharedBytes: routeAppSharedBytes,
      exclusiveBytes,
      appOwnedBytes,
      totalBytes: frameworkSharedBytes + appOwnedBytes,
      frameworkSharedFiles: frameworkSharedPayload,
      appSharedFiles: appShared.sort((a, b) => b.bytes - a.bytes),
      exclusiveFiles: exclusive.sort((a, b) => b.bytes - a.bytes),
    };
  });

  return {
    routeCandidates: routeCandidates.sort((a, b) => b.totalBytes - a.totalBytes),
    frameworkSharedBytes,
    appSharedBytes,
  };
}

function formatRouteSummary(routeResult) {
  const sections = [
    `${routeResult.route}: total=${formatBytes(routeResult.totalBytes)}, framework=${formatBytes(routeResult.frameworkSharedBytes)}, app-shared=${formatBytes(routeResult.appSharedBytes)}, exclusive=${formatBytes(routeResult.exclusiveBytes)}, app-owned=${formatBytes(routeResult.appOwnedBytes)}`,
  ];

  const frameworkContributors = formatChunkList(routeResult.frameworkSharedFiles);
  if (frameworkContributors) {
    sections.push(`  framework shared: ${frameworkContributors}`);
  }

  const appSharedContributors = formatChunkList(routeResult.appSharedFiles);
  if (appSharedContributors) {
    sections.push(`  app shared: ${appSharedContributors}`);
  }

  const exclusiveContributors = formatChunkList(routeResult.exclusiveFiles);
  if (exclusiveContributors) {
    sections.push(`  exclusive: ${exclusiveContributors}`);
  }

  return sections.join("\n");
}

if (!existsSync(staticDir)) {
  throw new Error(
    `Missing build output at ${staticDir}. Run \`npm run build\` before \`npm run bundle:check\`.`,
  );
}

const buildManifest = readJsonIfExists(join(buildDir, "build-manifest.json"));
const appBuildManifest = readJsonIfExists(join(buildDir, "app-build-manifest.json"));

const frameworkSharedFiles = new Set([
  ...(buildManifest?.polyfillFiles ?? []),
  ...(buildManifest?.rootMainFiles ?? []),
]);

const { routeCandidates, frameworkSharedBytes, appSharedBytes } = buildRouteCandidates({
  appManifestPages: appBuildManifest?.pages,
  buildManifestPages: buildManifest?.pages,
  frameworkSharedFiles,
});

if (routeCandidates.length === 0) {
  const total = sumJsSize(staticDir);
  if (total > appOwnedBudgetBytes) {
    throw new Error(
      `Bundle budget exceeded: ${formatBytes(total)} > ${formatBytes(appOwnedBudgetBytes)}`,
    );
  }

  console.log(
    `Bundle budget ok (total static JS): ${formatBytes(total)} <= ${formatBytes(appOwnedBudgetBytes)}`,
  );
  process.exit(0);
}

const heaviestExclusiveRoute = [...routeCandidates].sort(
  (a, b) => b.exclusiveBytes - a.exclusiveBytes,
)[0];
const heaviestAppOwnedRoute = [...routeCandidates].sort(
  (a, b) => b.appOwnedBytes - a.appOwnedBytes,
)[0];
const failures = [];

if (frameworkSharedBytes > frameworkBudgetBytes) {
  failures.push(
    `Framework shared JS uses ${formatBytes(frameworkSharedBytes)} > ${formatBytes(frameworkBudgetBytes)}.`,
  );
}

if (appSharedBytes > appSharedBudgetBytes) {
  failures.push(
    `App-shared JS uses ${formatBytes(appSharedBytes)} > ${formatBytes(appSharedBudgetBytes)}.`,
  );
}

if (heaviestExclusiveRoute.exclusiveBytes > routeBudgetBytes) {
  failures.push(
    `Route-exclusive JS budget exceeded: route "${heaviestExclusiveRoute.route}" uses ${formatBytes(heaviestExclusiveRoute.exclusiveBytes)} > ${formatBytes(routeBudgetBytes)}.`,
  );
}

if (heaviestAppOwnedRoute.appOwnedBytes > appOwnedBudgetBytes) {
  failures.push(
    `App-owned route JS budget exceeded: route "${heaviestAppOwnedRoute.route}" uses ${formatBytes(heaviestAppOwnedRoute.appOwnedBytes)} > ${formatBytes(appOwnedBudgetBytes)}.`,
  );
}

const report = routeCandidates.slice(0, reportLimit).map(formatRouteSummary).join("\n");

if (failures.length > 0) {
  throw new Error([...failures, "Top route bundle breakdown:", report].join("\n"));
}

console.log(
  [
    `Bundle budget ok: framework shared=${formatBytes(frameworkSharedBytes)} <= ${formatBytes(frameworkBudgetBytes)}; app shared=${formatBytes(appSharedBytes)} <= ${formatBytes(appSharedBudgetBytes)}; heaviest app-owned route=${formatBytes(heaviestAppOwnedRoute.appOwnedBytes)} (${heaviestAppOwnedRoute.route}) <= ${formatBytes(appOwnedBudgetBytes)}; heaviest exclusive=${formatBytes(heaviestExclusiveRoute.exclusiveBytes)} (${heaviestExclusiveRoute.route}) <= ${formatBytes(routeBudgetBytes)}.`,
    "Top route bundle breakdown:",
    report,
  ].join("\n"),
);
