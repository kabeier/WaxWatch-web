import { execFileSync } from "node:child_process";
import process from "node:process";

const baseRef = process.env.GITHUB_BASE_REF;

if (!baseRef) {
  console.log("Skipping route-status test gate (GITHUB_BASE_REF not set).");
  process.exit(0);
}

try {
  execFileSync("git", ["fetch", "--no-tags", "--depth=1", "origin", baseRef], {
    stdio: "inherit",
  });
} catch {
  console.log("Skipping route-status test gate (unable to fetch base ref from origin).");
  process.exit(0);
}

const compareRef = `origin/${baseRef}`;
const threeDotDiffRange = `${compareRef}...HEAD`;
const twoDotDiffRange = `${compareRef}..HEAD`;
const ROUTE_STATUS_DOC = "docs/DEVELOPER_REFERENCE.md";
const getDiffOutput = (argsForThreeDot, argsForTwoDot) => {
  try {
    return execFileSync("git", argsForThreeDot, { encoding: "utf8" });
  } catch (error) {
    const stderr =
      error && typeof error === "object" && "stderr" in error ? String(error.stderr ?? "") : "";
    if (!stderr.includes("no merge base")) {
      throw error;
    }

    console.log(
      `No merge base found for ${threeDotDiffRange}; falling back to ${twoDotDiffRange} diff.`,
    );

    return execFileSync("git", argsForTwoDot, { encoding: "utf8" });
  }
};

const changedFilesOutput = getDiffOutput(
  ["diff", "--name-only", "--diff-filter=AMR", threeDotDiffRange],
  ["diff", "--name-only", "--diff-filter=AMR", twoDotDiffRange],
);

const changedFiles = changedFilesOutput
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean);

if (!changedFiles.includes(ROUTE_STATUS_DOC)) {
  console.log(`Route-status test gate passed (${ROUTE_STATUS_DOC} route matrix unchanged).`);
  process.exit(0);
}

const routeStatusDocDiff = getDiffOutput(
  ["diff", "-U0", threeDotDiffRange, "--", ROUTE_STATUS_DOC],
  ["diff", "-U0", twoDotDiffRange, "--", ROUTE_STATUS_DOC],
);

const addedProductionReadyRoutes = new Set();
const removedStatusesByRoute = new Map();

const parseRouteStatus = (line) => {
  const match = line.match(/^[-+]\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|/);
  if (!match) {
    return null;
  }

  return {
    route: match[1].trim(),
    status: match[2].trim(),
  };
};

for (const line of routeStatusDocDiff.split("\n")) {
  if (!line.startsWith("-") && !line.startsWith("+")) {
    continue;
  }

  if (line.startsWith("---") || line.startsWith("+++")) {
    continue;
  }

  const parsed = parseRouteStatus(line);
  if (!parsed) {
    continue;
  }

  if (line.startsWith("-")) {
    removedStatusesByRoute.set(parsed.route, parsed.status);
  }

  if (line.startsWith("+") && parsed.status === "production-ready") {
    addedProductionReadyRoutes.add(parsed.route);
  }
}

const promotedRoutes = [...addedProductionReadyRoutes].filter((route) => {
  const previousStatus = removedStatusesByRoute.get(route);
  return previousStatus && previousStatus !== "production-ready";
});

if (promotedRoutes.length === 0) {
  console.log("Route-status test gate passed (no route promoted to production-ready).");
  process.exit(0);
}

const routeLevelTestPatterns = [
  /^app\/.*\/(page|route)\.(test|spec)\.[cm]?[jt]sx?$/,
  /^src\/app\/.*\/(page|route)\.(test|spec)\.[cm]?[jt]sx?$/,
  /^src\/route-.*\.(test|spec)\.[cm]?[jt]sx?$/,
  /^e2e\/.*\.(test|spec)\.[cm]?[jt]sx?$/,
];

const routeLevelTestChange = changedFiles.some((file) =>
  routeLevelTestPatterns.some((pattern) => pattern.test(file)),
);

if (!routeLevelTestChange) {
  console.error(`Detected route promotions to production-ready in ${ROUTE_STATUS_DOC}:`);
  for (const route of promotedRoutes) {
    console.error(`  - ${route}`);
  }
  console.error(
    "\nThis PR must include route-level test updates (for example app/**/page.test.*, src/route-*.test.*, or e2e/**/*.spec.*) when promoting a route to production-ready.",
  );
  process.exit(1);
}

console.log("Route-status test gate passed.");
