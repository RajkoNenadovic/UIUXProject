// Checks that en / es / hr have the same keys, the same {{variables}} and every plural form the language needs.
// Run from the client folder:  node scripts/check-i18n.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const locales = ['en', 'es', 'hr'];
const SUFFIXES = ['zero', 'one', 'two', 'few', 'many', 'other'];
// Spanish has a "many" category (for 1,000,000) that i18next falls back from; the base key covers it.
const IGNORED_FORMS = { es: ['many'] };

const flatten = (object, prefix = '') => Object.entries(object).flatMap(([key, value]) => (
  value && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [[`${prefix}${key}`, String(value)]]
));
const split = (key) => {
  const match = key.match(new RegExp(`^(.*)_(${SUFFIXES.join('|')})$`));
  return match ? { base: match[1], form: match[2] } : { base: key, form: null };
};
const variables = (text) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort().join(',');

const data = {};
for (const code of locales) {
  const entries = flatten(JSON.parse(fs.readFileSync(path.resolve(here, `../src/i18n/locales/${code}/translation.json`), 'utf8')));
  const bases = new Map();
  for (const [key, text] of entries) {
    const { base, form } = split(key);
    if (!bases.has(base)) bases.set(base, { forms: new Set(), vars: new Set(), plural: false });
    const item = bases.get(base);
    if (form) { item.forms.add(form); item.plural = true; }
    item.vars.add(variables(text));
  }
  data[code] = bases;
}

let problems = 0;
const fail = (message) => { problems += 1; console.log(`FAIL  ${message}`); };

const reference = data.en;
for (const code of locales) {
  const bases = data[code];
  for (const base of reference.keys()) if (!bases.has(base)) fail(`${code}: missing key "${base}"`);
  for (const base of bases.keys()) if (!reference.has(base)) fail(`${code}: extra key "${base}" (not in en)`);
  const required = new Intl.PluralRules(code).resolvedOptions().pluralCategories.filter((c) => !(IGNORED_FORMS[code] || []).includes(c));
  for (const [base, item] of bases) {
    if (item.plural) {
      for (const form of required) if (!item.forms.has(form)) fail(`${code}: "${base}" needs plural form "${form}"`);
    }
    const en = reference.get(base);
    if (en) {
      const union = (set) => [...set].flatMap((v) => v.split(',')).filter(Boolean);
      const a = [...new Set(union(en.vars))].sort().join(',');
      const b = [...new Set(union(item.vars))].sort().join(',');
      if (a !== b) fail(`${code}: "${base}" uses {{${b}}} but en uses {{${a}}}`);
    }
  }
  console.log(`${code}: ${bases.size} keys, plural forms required: ${required.join('/')}`);
}
console.log(problems === 0 ? '\nAll locale files are consistent.' : `\n${problems} problem(s).`);
process.exit(problems === 0 ? 0 : 1);
