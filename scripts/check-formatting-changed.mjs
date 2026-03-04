import { execFileSync } from "node:child_process";

const baseRef = process.env.GITHUB_BASE_REF;

if (!baseRef) {
  console.log("Skipping changed-files format check (GITHUB_BASE_REF not set).");
  process.exit(0);
}

execFileSync("git", ["fetch", "--no-tags", "--depth=1", "origin", baseRef], {
  stdio: "inherit",
});

const getChangedFilesOutput = () => {
  const diffArgs = ["diff", "--name-only", "--diff-filter=AMR"];

  try {
    return execFileSync("git", [...diffArgs, `origin/${baseRef}...HEAD`], {
      encoding: "utf8",
    });
  } catch (error) {
    const stderr =
      error && typeof error === "object" && "stderr" in error ? String(error.stderr ?? "") : "";

    if (!stderr.includes("no merge base")) {
      throw error;
    }

    console.warn(`No merge base between origin/${baseRef} and HEAD; falling back to two-dot diff.`);

    return execFileSync("git", [...diffArgs, `origin/${baseRef}..HEAD`], {
      encoding: "utf8",
    });
  }
};

const changedFiles = getChangedFilesOutput()
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => /\.(js|jsx|ts|tsx|json|md|yml|yaml|css|html|mjs|cjs)$/.test(file));

if (changedFiles.length === 0) {
  console.log("No changed files requiring prettier check.");
  process.exit(0);
}

execFileSync("npx", ["prettier", "--check", ...changedFiles], { stdio: "inherit" });
