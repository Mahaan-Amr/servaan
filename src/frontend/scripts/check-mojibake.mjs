/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TARGETS = ['app', 'components'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);
const MOJIBAKE = /Ã|Ø|Ù|â€|ï¿½|\?f\?/;

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) {
      out.push(fullPath);
    }
  }
  return out;
}

function main() {
  const files = TARGETS.flatMap((target) => walk(path.join(ROOT, target)));
  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (MOJIBAKE.test(content)) {
      violations.push(path.relative(ROOT, file));
    }
  }

  if (violations.length > 0) {
    console.error('Found potential mojibake text in:');
    for (const item of violations) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log('Encoding check passed: no mojibake patterns found.');
}

main();
