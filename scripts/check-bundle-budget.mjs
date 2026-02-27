import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const budgetBytes = Number(process.env.BUNDLE_BUDGET_BYTES ?? 500000);

function sumJsSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      total += sumJsSize(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.js')) {
      total += statSync(fullPath).size;
    }
  }
  return total;
}

const total = sumJsSize('.next/static');
if (total > budgetBytes) {
  throw new Error(`Bundle budget exceeded: ${total} bytes > ${budgetBytes} bytes`);
}

console.log(`Bundle budget ok: ${total} bytes <= ${budgetBytes} bytes`);
