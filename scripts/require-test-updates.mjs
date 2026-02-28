import { execFileSync } from "node:child_process";

const baseRef = process.env.GITHUB_BASE_REF;

if (!baseRef) {
  console.log("Skipping test-update contract (GITHUB_BASE_REF not set).");
  process.exit(0);
}

execFileSync("git", ["fetch", "--no-tags", "--depth=1", "origin", baseRef], {
  stdio: "inherit",
});

const changedFilesOutput = execFileSync(
  "git",
  ["diff", "--name-only", "--diff-filter=AMR", `origin/${baseRef}...HEAD`],
  { encoding: "utf8" },
);

const changedFiles = changedFilesOutput
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean);

if (changedFiles.length === 0) {
  console.log("No changed files detected against base branch.");
  process.exit(0);
}

const isTestFile = (file) =>
  /(^e2e\/.*\.spec\.[cm]?[jt]sx?$)|((^|\/)__tests__\/)|((\.|-)test\.[cm]?[jt]sx?$)|((\.|-)spec\.[cm]?[jt]sx?$)/.test(
    file,
  );

const testExemptFiles = [
  /^src\/test\//,
  /^src\/.*\.d\.ts$/,
  /^next-env\.d\.ts$/,
  /^src\/globals\.d\.ts$/,
  /^README\.md$/,
  /^docs\//,
  /^\.github\//,
  /^\.husky\//,
  /^\.vscode\//,
  /^scripts\//,
  /^Dockerfile$/,
  /^docker-compose(\..+)?\.yml$/,
  /^nginx\.conf$/,
  /^Makefile$/,
  /^package(-lock)?\.json$/,
  /^tsconfig\.json$/,
  /^next\.config\.[cm]?js$/,
  /^vitest\.config\.[cm]?ts$/,
  /^playwright\.config\.[cm]?[jt]s$/,
  /^commitlint\.config\.[cm]?js$/,
  /^CHANGELOG\.md$/,
];

const isCodeFile = (file) => /\.[cm]?[jt]sx?$/.test(file);

const requiresTestUpdate = changedFiles.filter(
  (file) =>
    isCodeFile(file) && !isTestFile(file) && !testExemptFiles.some((pattern) => pattern.test(file)),
);

const hasTestChanges = changedFiles.some(isTestFile);

if (requiresTestUpdate.length > 0 && !hasTestChanges) {
  console.error("PRs that modify production code must include test updates.");
  console.error("Changed code files requiring test coverage:");
  for (const file of requiresTestUpdate) {
    console.error(`  - ${file}`);
  }
  console.error(
    "\nAdd or update at least one relevant test file (*.test.*, *.spec.*, or e2e spec) in the PR.",
  );
  process.exit(1);
}

console.log("Test-update contract check passed.");
