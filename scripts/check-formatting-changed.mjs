import { execSync } from "node:child_process";

const baseRef = process.env.GITHUB_BASE_REF;

if (!baseRef) {
  console.log("Skipping changed-files format check (GITHUB_BASE_REF not set).");
  process.exit(0);
}

execSync(`git fetch --no-tags --depth=1 origin ${baseRef}`, { stdio: "inherit" });

const changedFiles = execSync(`git diff --name-only --diff-filter=AMR origin/${baseRef}...HEAD`, {
  encoding: "utf8",
})
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => /\.(js|jsx|ts|tsx|json|md|yml|yaml|css|html|mjs|cjs)$/.test(file));

if (changedFiles.length === 0) {
  console.log("No changed files requiring prettier check.");
  process.exit(0);
}

const quoted = changedFiles.map((file) => `"${file.replace(/"/g, '\\"')}"`).join(" ");
execSync(`npx prettier --check ${quoted}`, { stdio: "inherit" });
