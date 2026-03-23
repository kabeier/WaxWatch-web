/* eslint-env node */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const totalBudgetBytes = Number(process.env.BUNDLE_BUDGET_BYTES ?? 500000);
const sharedBudgetBytes = Number(process.env.BUNDLE_SHARED_BUDGET_BYTES ?? 360000);
const routeBudgetBytes = Number(process.env.BUNDLE_ROUTE_BUDGET_BYTES ?? 185000);
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

  const sharedBytes = [...new Set([...frameworkSharedFiles, ...appSharedFiles])].reduce(
    (total, file) => total + readFileSize(file),
    0,
  );

  const routeCandidates = routeEntries.map(({ route, files }) => {
    const frameworkShared = [...frameworkSharedFiles]
      .map((file) => ({ file, bytes: readFileSize(file) }))
      .filter(({ bytes }) => bytes > 0);
    const appShared = [];
    const exclusive = [];

    for (const file of files) {
      const bytes = readFileSize(file);
      if (bytes === 0) {
        continue;
      }

      const payload = { file, bytes };
      if (frameworkSharedFiles.has(file)) {
        continue;
      }

      if (appSharedFiles.has(file)) {
        appShared.push(payload);
      } else {
        exclusive.push(payload);
      }
    }

    const frameworkSharedBytes = frameworkShared.reduce((total, file) => total + file.bytes, 0);
    const appSharedBytes = appShared.reduce((total, file) => total + file.bytes, 0);
    const exclusiveBytes = exclusive.reduce((total, file) => total + file.bytes, 0);

    return {
      route,
      frameworkSharedBytes,
      appSharedBytes,
      exclusiveBytes,
      sharedBytes: frameworkSharedBytes + appSharedBytes,
      totalBytes: frameworkSharedBytes + appSharedBytes + exclusiveBytes,
      frameworkSharedFiles: frameworkShared.sort((a, b) => b.bytes - a.bytes),
      appSharedFiles: appShared.sort((a, b) => b.bytes - a.bytes),
      exclusiveFiles: exclusive.sort((a, b) => b.bytes - a.bytes),
    };
  });

  return {
    routeCandidates: routeCandidates.sort((a, b) => b.totalBytes - a.totalBytes),
    sharedBytes,
  };
}

function formatRouteSummary(routeResult) {
  const sections = [
    `${routeResult.route}: total=${formatBytes(routeResult.totalBytes)}, shared=${formatBytes(routeResult.sharedBytes)}, exclusive=${formatBytes(routeResult.exclusiveBytes)}`,
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

const { routeCandidates, sharedBytes } = buildRouteCandidates({
  appManifestPages: appBuildManifest?.pages,
  buildManifestPages: buildManifest?.pages,
  frameworkSharedFiles,
});

if (routeCandidates.length === 0) {
  const total = sumJsSize(staticDir);
  if (total > totalBudgetBytes) {
    throw new Error(
      `Bundle budget exceeded: ${formatBytes(total)} > ${formatBytes(totalBudgetBytes)}`,
    );
  }

  console.log(
    `Bundle budget ok (total static JS): ${formatBytes(total)} <= ${formatBytes(totalBudgetBytes)}`,
  );
  process.exit(0);
}

const heaviestTotalRoute = routeCandidates[0];
const heaviestExclusiveRoute = [...routeCandidates].sort(
  (a, b) => b.exclusiveBytes - a.exclusiveBytes,
)[0];
const failures = [];

if (sharedBytes > sharedBudgetBytes) {
  failures.push(
    `Shared app/framework JS uses ${formatBytes(sharedBytes)} > ${formatBytes(sharedBudgetBytes)}.`,
  );
}

if (heaviestExclusiveRoute.exclusiveBytes > routeBudgetBytes) {
  failures.push(
    `Route-exclusive JS budget exceeded: route "${heaviestExclusiveRoute.route}" uses ${formatBytes(heaviestExclusiveRoute.exclusiveBytes)} > ${formatBytes(routeBudgetBytes)}.`,
  );
}

if (heaviestTotalRoute.totalBytes > totalBudgetBytes) {
  failures.push(
    `Total route JS budget exceeded: route "${heaviestTotalRoute.route}" uses ${formatBytes(heaviestTotalRoute.totalBytes)} > ${formatBytes(totalBudgetBytes)}.`,
  );
}

const report = routeCandidates.slice(0, reportLimit).map(formatRouteSummary).join("\n");

if (failures.length > 0) {
  throw new Error([...failures, "Top route bundle breakdown:", report].join("\n"));
}

console.log(
  [
    `Bundle budget ok: shared=${formatBytes(sharedBytes)} <= ${formatBytes(sharedBudgetBytes)}; heaviest total=${formatBytes(heaviestTotalRoute.totalBytes)} (${heaviestTotalRoute.route}) <= ${formatBytes(totalBudgetBytes)}; heaviest exclusive=${formatBytes(heaviestExclusiveRoute.exclusiveBytes)} (${heaviestExclusiveRoute.route}) <= ${formatBytes(routeBudgetBytes)}.`,
    "Top route bundle breakdown:",
    report,
  ].join("\n"),
);
