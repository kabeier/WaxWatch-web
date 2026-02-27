import { readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const forbiddenTemplateNames = ['ProjectRainbows', 'projectsparks'];
const repoRoot = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', '.next']);
const ignoredFiles = new Set([resolve(repoRoot, 'scripts/release-checklist.mjs')]);

function listFiles(dir) {
  const files = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = resolve(dir, entry);

    if (ignoredFiles.has(fullPath)) {
      continue;
    }

    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (ignoredDirs.has(entry)) {
        continue;
      }
      files.push(...listFiles(fullPath));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function findMatches(token) {
  const matches = [];

  for (const filePath of listFiles(repoRoot)) {
    let content = '';

    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    if (!content.includes(token)) {
      continue;
    }

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes(token)) {
        matches.push(`${relative(repoRoot, filePath)}:${index + 1}:${line}`);
      }
    });
  }

  return matches;
}

for (const name of forbiddenTemplateNames) {
  const result = findMatches(name);
  if (result.length > 0) {
    throw new Error(`Template copy cleanup failed. Found leftover token: ${name}\n${result.join('\n')}`);
  }
}

console.log('Release checklist naming check passed.');
