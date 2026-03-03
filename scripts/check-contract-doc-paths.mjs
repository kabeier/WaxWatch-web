import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const docsToScan = ['README.md', 'docs/AGENT_GUIDE.md', 'contracts/README.md'];
const contractPathPattern = /`((?:contracts|docs)\/[A-Za-z0-9._/-]+)`/g;

const documentedPaths = new Set();
for (const doc of docsToScan) {
  const content = fs.readFileSync(path.join(repoRoot, doc), 'utf8');
  const matches = content.matchAll(contractPathPattern);
  for (const match of matches) {
    const relPath = match[1];
    if (
      relPath === 'docs/FRONTEND_API_CONTRACT.md' ||
      relPath.endsWith('openapi.snapshot.json')
    ) {
      documentedPaths.add(relPath);
    }
  }
}

if (documentedPaths.size === 0) {
  console.error('No documented contract paths were found in expected docs.');
  process.exit(1);
}

const missing = [];
for (const relPath of documentedPaths) {
  if (!fs.existsSync(path.join(repoRoot, relPath))) {
    missing.push(relPath);
  }
}

if (missing.length > 0) {
  console.error('Missing documented contract path(s):');
  for (const relPath of missing) {
    console.error(`- ${relPath}`);
  }
  process.exit(1);
}

console.log('Documented contract paths are present:');
for (const relPath of [...documentedPaths].sort()) {
  console.log(`- ${relPath}`);
}
