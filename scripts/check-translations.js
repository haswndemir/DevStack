// scripts/check-translations.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const trPath = path.resolve(__dirname, '../src/i18n/tr.json');
const enPath = path.resolve(__dirname, '../src/i18n/en.json');

const tr = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const trKeys = new Set(flattenKeys(tr));
const enKeys = new Set(flattenKeys(en));

let hasErrors = false;

// Check keys in TR missing from EN
for (const key of trKeys) {
  if (!enKeys.has(key)) {
    console.error(`❌ Missing English translation for key: "${key}"`);
    hasErrors = true;
  }
}

// Check keys in EN missing from TR
for (const key of enKeys) {
  if (!trKeys.has(key)) {
    console.error(`❌ Missing Turkish translation for key: "${key}"`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n💥 Translation validation FAILED. Critical keys are missing!');
  process.exit(1);
} else {
  console.log(`✅ All ${trKeys.size} localization keys are perfectly synchronized across Turkish and English!`);
  process.exit(0);
}
