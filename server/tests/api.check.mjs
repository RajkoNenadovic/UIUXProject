// Black-box checks against a running server (see run.mjs). Prints PASS/FAIL per check.
import Database from 'better-sqlite3';

const API = 'http://localhost:3101/api';
const results = [];
const check = (name, ok, extra = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`);
};
// Each "browser" has its own cookie jar, so two signed-in users can be tested side by side.
const jarA = { cookie: '' };
const jarB = { cookie: '' };
let lastSetCookie = [];
const call = async (path, opts = {}) => {
  const jar = opts.jar ?? jarA;
  const response = await fetch(API + path, {
    method: opts.method,
    headers: { 'content-type': 'application/json', ...(jar.cookie ? { cookie: jar.cookie } : {}) },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
  });
  lastSetCookie = response.headers.getSetCookie();
  for (const line of lastSetCookie) {
    const pair = line.split(';')[0];
    const [name, value] = pair.split('=');
    jar.cookie = value ? `${name}=${value}` : '';
  }
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
};
const hits = async () => Number(await (await fetch('http://localhost:3199/__hits')).text());

let r;


// ---- authentication (screens 01 and 02)
for (const path of ['/documents', '/documents/1', '/settings', '/terms', '/terms/define?term=forbearance']) {
  r = await call(path);
  check(`signed out: GET ${path.split('?')[0]} -> 401 UNAUTHENTICATED`, r.status === 401 && r.body.error.code === 'UNAUTHENTICATED');
}
r = await call('/documents', { method: 'POST', body: { title: 'x', doc_type: 'other', original_text: 'x' } });
check('signed out: POST /documents -> 401', r.status === 401);
r = await call('/health'); check('health stays public', r.status === 200);
r = await call('/auth/me'); check('signed out: /auth/me answers 200 with user null (no error in the console)', r.status === 200 && r.body.user === null);

const ana = { display_name: '  Ana   Horvat ', email: ' Ana.Horvat@Example.com ', password: 'correct horse battery', locale: 'hr' };
r = await call('/auth/register', { method: 'POST', body: { ...ana, display_name: '' } }); check('register: empty name -> NAME_REQUIRED', r.status === 400 && r.body.error.code === 'NAME_REQUIRED');
r = await call('/auth/register', { method: 'POST', body: { ...ana, display_name: 'x'.repeat(61) } }); check('register: long name -> NAME_TOO_LONG', r.body.error.code === 'NAME_TOO_LONG');
for (const bad of ['', 'no-at-sign', 'a@b', 'a b@c.de', 'x'.repeat(250) + '@e.com']) {
  r = await call('/auth/register', { method: 'POST', body: { ...ana, email: bad } });
  check(`register: bad email "${bad.slice(0, 12)}" -> EMAIL_INVALID`, r.status === 400 && r.body.error.code === 'EMAIL_INVALID');
}
r = await call('/auth/register', { method: 'POST', body: { ...ana, password: 'short' } }); check('register: short password', r.body.error.code === 'PASSWORD_TOO_SHORT');
r = await call('/auth/register', { method: 'POST', body: { ...ana, password: 'p'.repeat(129) } }); check('register: very long password', r.body.error.code === 'PASSWORD_TOO_LONG');
check('failed registrations set no cookie', jarA.cookie === '');

r = await call('/auth/register', { method: 'POST', body: ana });
const setCookie = lastSetCookie.join('\n');
check('register ok: 201, name tidied, email lower-cased, no hash in response', r.status === 201 && r.body.user.display_name === 'Ana Horvat' && r.body.user.email === 'ana.horvat@example.com' && !JSON.stringify(r.body).includes('hash'));
check('register ok: new user has no role yet and starts in their language', r.body.user.role === null && r.body.user.onboarded === false && r.body.user.locale === 'hr');
check('session cookie is HttpOnly + SameSite=Lax and a browser-session cookie by default', /pll_session=/.test(setCookie) && /HttpOnly/.test(setCookie) && /SameSite=Lax/.test(setCookie) && !/Max-Age/.test(setCookie));
r = await call('/auth/me'); check('GET /auth/me with the cookie', r.status === 200 && r.body.user.email === 'ana.horvat@example.com');
r = await call('/auth/register', { method: 'POST', jar: jarB, body: { ...ana, email: 'ANA.HORVAT@example.com' } }); check('duplicate email (any case) -> 409 EMAIL_TAKEN', r.status === 409 && r.body.error.code === 'EMAIL_TAKEN');

const peek = new Database(process.env.DATABASE_FILE, { readonly: true });
const row = peek.prepare("SELECT password_hash FROM users WHERE email = 'ana.horvat@example.com'").get();
const token = decodeURIComponent(jarA.cookie.split('=')[1]);
const stored = peek.prepare('SELECT token_hash FROM sessions').all().map((x) => x.token_hash);
check('password is stored as a salted scrypt hash, never the password', row.password_hash.startsWith('scrypt$') && !row.password_hash.includes(ana.password));
check('database holds only a hash of the session token', stored.length >= 1 && !stored.includes(token) && stored.every((h) => /^[0-9a-f]{64}$/.test(h)));

const oldCookie = jarA.cookie;
r = await call('/auth/logout', { method: 'POST' }); check('logout -> 204 and cookie cleared', r.status === 204 && /Max-Age=0/.test(lastSetCookie.join()));
r = await call('/auth/me', { jar: { cookie: oldCookie } }); check('a logged-out session cookie no longer works', r.status === 200 && r.body.user === null);
r = await call('/auth/logout', { method: 'POST' }); check('logout while signed out is harmless (204)', r.status === 204);

r = await call('/auth/login', { method: 'POST', body: { email: 'ana.horvat@example.com', password: 'wrong password' } });
const wrongPassword = r;
r = await call('/auth/login', { method: 'POST', body: { email: 'nobody@example.com', password: 'wrong password' } });
check('wrong password and unknown email give the same answer (no account enumeration)', wrongPassword.status === 401 && r.status === 401 && wrongPassword.body.error.code === 'INVALID_CREDENTIALS' && r.body.error.code === 'INVALID_CREDENTIALS');
r = await call('/auth/login', { method: 'POST', body: { email: '', password: '' } }); check('login: empty fields -> CREDENTIALS_REQUIRED', r.status === 400 && r.body.error.code === 'CREDENTIALS_REQUIRED');
r = await call('/auth/login', { method: 'POST', body: { email: 'ana.horvat@example.com', password: 'x'.repeat(5000) } }); check('login: huge password is refused cheaply', r.status === 401);
check('failed logins set no cookie', jarA.cookie === '');

r = await call('/auth/login', { method: 'POST', body: { email: 'ANA.Horvat@example.com', password: ana.password, remember: true } });
check('login ok (email case does not matter); "keep me signed in" -> persistent cookie', r.status === 200 && r.body.user.display_name === 'Ana Horvat' && /Max-Age=2592000/.test(lastSetCookie.join()));

// lock-out after repeated failures (a different, throw-away account so Ana is unaffected)
await call('/auth/register', { method: 'POST', jar: jarB, body: { display_name: 'Lock', email: 'lock@example.com', password: 'a long enough pass' } });
await call('/auth/logout', { method: 'POST', jar: jarB });
for (let i = 0; i < 5; i += 1) await call('/auth/login', { method: 'POST', jar: jarB, body: { email: 'lock@example.com', password: 'nope nope nope' } });
r = await call('/auth/login', { method: 'POST', jar: jarB, body: { email: 'lock@example.com', password: 'a long enough pass' } });
check('5 failures lock sign-in for that email: 429 TOO_MANY_ATTEMPTS (even with the right password)', r.status === 429 && r.body.error.code === 'TOO_MANY_ATTEMPTS');
r = await call('/auth/login', { method: 'POST', jar: jarB, body: { email: 'ana.horvat@example.com', password: ana.password } });
check('...but other accounts can still sign in', r.status === 200);

// screen 02: role + reading level
r = await call('/auth/profile', { method: 'PUT', body: { role: 'wizard', reading_level: 6 } }); check('profile: bad role -> INVALID_ROLE', r.status === 400 && r.body.error.code === 'INVALID_ROLE');
r = await call('/auth/profile', { method: 'PUT', body: { role: 'student', reading_level: 13 } }); check('profile: level 13 -> INVALID_READING_LEVEL', r.body.error.code === 'INVALID_READING_LEVEL');
r = await call('/auth/profile', { method: 'PUT', body: { role: 'student', reading_level: '8' } }); check('profile: level must be a number', r.body.error.code === 'INVALID_READING_LEVEL');
r = await call('/auth/profile', { method: 'PUT', body: { role: 'student', reading_level: 8 } });
check('profile ok: role + level saved, user is now onboarded', r.status === 200 && r.body.user.role === 'student' && r.body.user.reading_level === 8 && r.body.user.onboarded === true);
const firstOnboarded = peek.prepare("SELECT onboarded_at FROM users WHERE email = 'ana.horvat@example.com'").get().onboarded_at;
r = await call('/auth/profile', { method: 'PUT', body: { role: 'professional', reading_level: 10 } });
check('profile can be changed again later (re-triggerable)', r.status === 200 && r.body.user.role === 'professional' && peek.prepare("SELECT onboarded_at FROM users WHERE email = 'ana.horvat@example.com'").get().onboarded_at === firstOnboarded);
r = await call('/auth/profile', { method: 'PUT', jar: { cookie: '' }, body: { role: 'student', reading_level: 8 } }); check('profile while signed out -> 401', r.status === 401);
r = await call('/settings'); check('level chosen in onboarding shows up in settings', r.body.settings.reading_level === 10);

// sessions: forged and expired cookies
r = await call('/auth/me', { jar: { cookie: 'pll_session=not-a-real-token' } }); check('forged cookie is treated as signed out', r.status === 200 && r.body.user === null);
r = await call('/auth/me', { jar: { cookie: 'pll_session=%E0%A4%A' } }); check('malformed cookie is treated as signed out, not a crash', r.status === 200 && r.body.user === null);
const editor = new Database(process.env.DATABASE_FILE);
editor.prepare("UPDATE sessions SET expires_at = datetime('now', '-1 minute')").run();
r = await call('/documents'); check('expired session -> 401', r.status === 401);
editor.close();
r = await call('/auth/login', { method: 'POST', body: { email: 'ana.horvat@example.com', password: ana.password } }); check('signing in again after expiry works', r.status === 200);

// preferences are per user
r = await call('/auth/register', { method: 'POST', jar: jarB, body: { display_name: 'Bo', email: 'bo@example.com', password: 'another long pass', locale: 'xx' } });
check('unknown locale at sign-up falls back to en', r.status === 201 && r.body.user.locale === 'en');
await call('/settings', { method: 'PUT', body: { locale: 'es', font_size: 'large' } });
r = await call('/settings', { jar: jarB });
check("one user's settings do not change another's", r.body.settings.locale === 'en' && r.body.settings.font_size === 'medium');
r = await call('/settings'); check('and are still there for the first user', r.body.settings.locale === 'es' && r.body.settings.font_size === 'large');
await call('/settings', { method: 'PUT', body: { locale: 'en', font_size: 'medium', reading_level: 6 } });
peek.close();

// ---- documents
r = await call('/documents');
check('list documents', r.status === 200 && r.body.documents.length >= 8, `n=${r.body.documents.length}`);
const lease = r.body.documents.find((d) => d.id === 1);
check('summary counts are not multiplied by joins', lease.sentence_count === 3 && lease.uncertain_count === 1 && lease.open_action_count === 3, JSON.stringify([lease.sentence_count, lease.uncertain_count, lease.open_action_count]));
r = await call('/documents/1'); check('get one with sentences and actions', r.status === 200 && r.body.sentences.length === 3 && r.body.actions.length === 5);
r = await call('/documents/999'); check('get missing -> 404 NOT_FOUND', r.status === 404 && r.body.error.code === 'NOT_FOUND');
r = await call('/documents/abc'); check('get bad id -> 404', r.status === 404);
r = await call('/documents', { method: 'POST', body: { title: '', doc_type: 'lease', original_text: 'x' } }); check('create: empty title -> TITLE_REQUIRED', r.status === 400 && r.body.error.code === 'TITLE_REQUIRED');
r = await call('/documents', { method: 'POST', body: { title: 'T', doc_type: 'bogus', original_text: 'x' } }); check('create: bad type', r.body.error.code === 'INVALID_DOC_TYPE');
r = await call('/documents', { method: 'POST', body: { title: 'T', doc_type: 'tax', original_text: '  ' } }); check('create: empty text', r.body.error.code === 'TEXT_REQUIRED');
r = await call('/documents', { method: 'POST', body: { title: 'x'.repeat(121), doc_type: 'tax', original_text: 'a' } }); check('create: long title', r.body.error.code === 'TITLE_TOO_LONG');
r = await call('/documents', { method: 'POST', body: { title: '  Čakovec – obavijest  ', doc_type: 'other', original_text: 'Prva rečenica je ovdje. Druga rečenica je ovdje! Treća?' } });
check('create ok (trimmed, diacritics kept, 3 sentences)', r.status === 201 && r.body.document.title === 'Čakovec – obavijest' && r.body.document.sentence_count === 3 && r.body.document.page_count === 1);
const newId = r.body.document.id;
r = await call(`/documents/${newId}`, { method: 'PUT', body: { title: 'Ćuprija ugovor' } }); check('update title keeps type', r.status === 200 && r.body.document.title === 'Ćuprija ugovor' && r.body.document.doc_type === 'other');
r = await call(`/documents/${newId}`, { method: 'PUT', body: {} }); check('update nothing -> NO_CHANGES', r.body.error.code === 'NO_CHANGES');
r = await call(`/documents/${newId}`, { method: 'PUT', body: { doc_type: 'nope' } }); check('update bad type', r.body.error.code === 'INVALID_DOC_TYPE');
r = await call('/documents/999', { method: 'PUT', body: { title: 'a' } }); check('update missing -> 404', r.status === 404);
r = await call(`/documents/${newId}`, { method: 'DELETE' }); check('delete -> 204', r.status === 204);
r = await call(`/documents/${newId}`); check('deleted document is gone', r.status === 404);
r = await call('/documents/1', { method: 'DELETE' });
const afterDelete = await call('/documents/1');
const orphans = new Database(process.env.DATABASE_FILE, { readonly: true }).prepare('SELECT (SELECT COUNT(*) FROM sentences WHERE document_id = 1) + (SELECT COUNT(*) FROM action_items WHERE document_id = 1) AS n').get().n;
check('delete cascades to sentences and action items', r.status === 204 && afterDelete.status === 404 && orphans === 0, `orphans=${orphans}`);
const raw = await fetch(API + '/documents', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
const rawBody = await raw.json();
check('malformed JSON -> 400 BAD_REQUEST', raw.status === 400 && rawBody.error.code === 'BAD_REQUEST');

// ---- settings
r = await call('/settings'); check('get settings', r.status === 200 && Boolean(r.body.settings.locale));
r = await call('/settings', { method: 'PUT', body: { locale: 'hr', reading_level: 8, dyslexia_friendly: true, font_size: 'large' } });
check('update several settings', r.body.settings.locale === 'hr' && r.body.settings.reading_level === 8 && r.body.settings.dyslexia_friendly === 1 && r.body.settings.font_size === 'large');
r = await call('/settings', { method: 'PUT', body: { locale: 'xx' } }); check('bad locale -> INVALID_LOCALE', r.body.error.code === 'INVALID_LOCALE');
r = await call('/settings', { method: 'PUT', body: { reading_level: 99 } }); check('bad reading level', r.body.error.code === 'INVALID_READING_LEVEL');
r = await call('/settings', { method: 'PUT', body: {} }); check('empty -> NO_CHANGES', r.body.error.code === 'NO_CHANGES');
await call('/settings', { method: 'PUT', body: { locale: 'en', reading_level: 6, dyslexia_friendly: false, font_size: 'medium' } });

// ---- saved glossary
r = await call('/terms'); check('list saved terms', r.body.terms.length >= 4);
r = await call('/terms', { method: 'POST', body: { term: '  Estoppel ', definition: 'A rule that stops you contradicting yourself.' } }); check('save term (lowercased, trimmed)', r.status === 201 && r.body.term.term === 'estoppel');
const termId = r.body.term.id;
r = await call('/terms', { method: 'POST', body: { term: 'estoppel', definition: 'dup' } }); check('duplicate -> 409 TERM_EXISTS', r.status === 409 && r.body.error.code === 'TERM_EXISTS');
r = await call('/terms', { method: 'POST', body: { term: '', definition: 'x' } }); check('empty term', r.body.error.code === 'TERM_REQUIRED');
r = await call('/terms', { method: 'POST', body: { term: 'a', definition: '' } }); check('empty definition', r.body.error.code === 'DEFINITION_REQUIRED');
r = await call(`/terms/${termId}`, { method: 'DELETE' }); check('delete term', r.status === 204);
r = await call(`/terms/${termId}`, { method: 'DELETE' }); check('delete term again -> 404', r.status === 404);

// ---- dictionary integration
r = await call('/terms/define?term=Forbearance');
check('define ok (normalised, simplified, licence kept)', r.status === 200 && r.body.status === 'success' && r.body.cached === false && r.body.result.meanings[0].definitions.length === 2 && r.body.result.source.license === 'CC BY-SA 3.0');
const h1 = await hits();
r = await call('/terms/define?term=forbearance'); check('second lookup is served from cache', r.body.cached === true && (await hits()) === h1);
r = await call('/terms/define?term=missing'); check('unknown word is a normal 200 not_found state', r.status === 200 && r.body.status === 'not_found');
const h2 = await hits();
r = await call('/terms/define?term=missing'); check('not_found is cached too', r.body.cached === true && (await hits()) === h2);
const failures = [['limited', 'UPSTREAM_RATE_LIMITED', 429], ['broken', 'UPSTREAM_DOWN', 502], ['garbage', 'UPSTREAM_BAD_RESPONSE', 502], ['emptyarr', 'UPSTREAM_BAD_RESPONSE', 502], ['weird', 'UPSTREAM_BAD_RESPONSE', 502], ['teapot', 'UPSTREAM_ERROR', 502], ['slow', 'UPSTREAM_TIMEOUT', 504], ['reset', 'UPSTREAM_UNAVAILABLE', 502]];
for (const [word, code, status] of failures) {
  r = await call(`/terms/define?term=${word}`);
  check(`provider failure "${word}" -> ${code}`, r.status === status && r.body.error.code === code, `got ${r.status} ${r.body.error?.code}`);
}
for (const bad of ['', 'a', 'x'.repeat(61), '123', 'a;drop', '../etc']) {
  r = await call(`/terms/define?term=${encodeURIComponent(bad)}`);
  check(`invalid term "${bad.slice(0, 12)}" -> INVALID_TERM`, r.status === 400 && r.body.error.code === 'INVALID_TERM');
}
r = await call('/terms/define'); check('missing term parameter', r.body.error.code === 'INVALID_TERM');

// stale fallback: an expired cached definition is shown when the provider is down
const writer = new Database(process.env.DATABASE_FILE);
writer.prepare("INSERT OR REPLACE INTO term_cache (term, payload, status, fetched_at) VALUES ('broken', ?, 'success', '2026-01-01 00:00:00')").run(JSON.stringify({ word: 'broken', phonetic: null, meanings: [{ partOfSpeech: 'adj', definitions: [{ definition: 'old cached', example: null }] }], source: { name: 'x', url: null, license: null, licenseUrl: null } }));
writer.close();
r = await call('/terms/define?term=broken');
check('expired cache is served (stale: true) when the provider is down', r.status === 200 && r.body.cached === true && r.body.stale === true);

r = await call('/nope'); check('unknown route -> 404', r.status === 404);

console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
process.exit(results.every(Boolean) ? 0 : 1);
