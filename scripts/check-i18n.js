import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(currentDir, '../client/src/i18n/locales');
const locales = ['en', 'es', 'hr'];

function flattenKeys(value, prefix = '') {
  return Object.entries(value).reduce((keys, [key, nestedValue]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
      return keys.concat(flattenKeys(nestedValue, fullKey));
    }
    keys.push(fullKey);
    return keys;
  }, []);
}

const localeKeys = Object.fromEntries(locales.map((locale) => {
  const filePath = path.join(localesDir, locale, 'translation.json');
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return [locale, new Set(flattenKeys(content))];
}));

const allKeys = new Set(locales.flatMap((locale) => [...localeKeys[locale]]));
let hasMissingKeys = false;

for (const locale of locales) {
  const missingKeys = [...allKeys].filter((key) => !localeKeys[locale].has(key)).sort();
  if (missingKeys.length > 0) {
    hasMissingKeys = true;
    console.error(`Missing keys in ${locale}:`);
    missingKeys.forEach((key) => console.error(`- ${key}`));
  }
}

if (hasMissingKeys) {
  process.exitCode = 1;
} else {
  console.log(`i18n keys match across ${locales.join(', ')}.`);
}
