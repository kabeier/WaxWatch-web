import { execSync } from 'node:child_process';

const forbiddenTemplateNames = ['ProjectRainbows', 'projectsparks'];

function findMatches(token) {
  try {
    return execSync(`rg -n --hidden --glob '!.git' --glob '!scripts/release-checklist.mjs' "${token}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    if (error.status === 1) {
      return '';
    }
    throw error;
  }
}

for (const name of forbiddenTemplateNames) {
  const result = findMatches(name);
  if (result.trim().length > 0) {
    throw new Error(`Template copy cleanup failed. Found leftover token: ${name}\n${result}`);
  }
}

console.log('Release checklist naming check passed.');
