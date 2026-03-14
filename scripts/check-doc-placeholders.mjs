#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CANONICAL_DOCS = ["docs/DESIGN_SYSTEM.md", "docs/DESIGN_GUIDE_INTAKE_CHECKLIST.md"];

const unresolvedPlaceholderPattern =
  /<(add\b[^>]*|team\b[^>]*|@(?=\b|>)|route-or-file\b[^>]*|temporary\s+ref\b[^>]*|official\s+ref\b[^>]*|notes\b[^>]*|token_or_primitive_name\b[^>]*|new_reference_name_or_link\b[^>]*|deprecated\s+temporary\s+mapping\b[^>]*|n\/a\b[^>]*|route-level\s+canonical\s+mapping\b[^>]*)>/gi;

const findings = [];

for (const docPath of CANONICAL_DOCS) {
  const absolutePath = resolve(docPath);
  const content = readFileSync(absolutePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    unresolvedPlaceholderPattern.lastIndex = 0;
    if (unresolvedPlaceholderPattern.test(line)) {
      findings.push({
        path: docPath,
        line: index + 1,
        text: line.trim(),
      });
    }
  });
}

if (findings.length > 0) {
  console.error("Unresolved docs placeholder markers found in canonical docs:");
  for (const finding of findings) {
    console.error(`- ${finding.path}:${finding.line} -> ${finding.text}`);
  }
  process.exit(1);
}

console.log("No unresolved placeholder markers found in canonical docs.");
