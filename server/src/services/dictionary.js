import { db } from '../db/connection.js';
import { httpError } from '../lib/httpError.js';

// Service layer for the Free Dictionary API (https://dictionaryapi.dev).
// No key is needed. The provider documents no rate limit, so we cache aggressively,
// time out quickly and fall back to stale data when the service is unavailable.
const BASE_URL = process.env.DICTIONARY_API_BASE || 'https://api.dictionaryapi.dev/api/v2/entries/en';
const TIMEOUT_MS = Number(process.env.DICTIONARY_TIMEOUT_MS || 5000);
const SUCCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // definitions rarely change
const NOT_FOUND_TTL_MS = 24 * 60 * 60 * 1000; // a missing word may be added later
const MAX_MEANINGS = 4;
const MAX_DEFINITIONS = 3;

// SQLite CURRENT_TIMESTAMP is UTC without a zone marker ("2026-11-14 18:30:00").
function parseUtc(value) {
  return Date.parse(`${value.replace(' ', 'T')}Z`);
}

export function normalizeTerm(raw) {
  if (typeof raw !== 'string') return null;
  const term = raw.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
  if (term.length < 2 || term.length > 60) return null;
  // Letters, combining marks, apostrophe, hyphen and spaces only.
  if (!/^[\p{L}\p{M}][\p{L}\p{M}' -]*$/u.test(term)) return null;
  return term;
}

function simplify(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw httpError(502, 'UPSTREAM_BAD_RESPONSE');
  }
  const first = entries[0];
  const meanings = [];
  for (const entry of entries) {
    if (!Array.isArray(entry?.meanings)) continue;
    for (const meaning of entry.meanings) {
      const definitions = (Array.isArray(meaning?.definitions) ? meaning.definitions : [])
        .filter((item) => typeof item?.definition === 'string' && item.definition.trim())
        .slice(0, MAX_DEFINITIONS)
        .map((item) => ({
          definition: item.definition.trim(),
          example: typeof item.example === 'string' ? item.example.trim() : null
        }));
      if (definitions.length > 0 && typeof meaning.partOfSpeech === 'string') {
        meanings.push({ partOfSpeech: meaning.partOfSpeech, definitions });
      }
      if (meanings.length >= MAX_MEANINGS) break;
    }
    if (meanings.length >= MAX_MEANINGS) break;
  }
  if (meanings.length === 0) {
    throw httpError(502, 'UPSTREAM_BAD_RESPONSE');
  }
  const phonetic = first.phonetic
    || (Array.isArray(first.phonetics) ? first.phonetics.find((item) => item?.text)?.text : null)
    || null;
  return {
    word: typeof first.word === 'string' ? first.word : null,
    phonetic,
    meanings,
    source: {
      name: 'Wiktionary via Free Dictionary API',
      url: Array.isArray(first.sourceUrls) ? first.sourceUrls[0] || null : null,
      license: first.license?.name || null,
      licenseUrl: first.license?.url || null
    }
  };
}

async function fetchUpstream(term) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let status;
  let text;
  try {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(term)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'PlainLanguageLayer-university-project' }
    });
    status = response.status;
    text = await response.text(); // the timer also covers a stalled body
  } catch (error) {
    if (error.name === 'AbortError') throw httpError(504, 'UPSTREAM_TIMEOUT');
    throw httpError(502, 'UPSTREAM_UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }

  if (status === 404) return { status: 'not_found' };
  if (status === 429) throw httpError(429, 'UPSTREAM_RATE_LIMITED');
  if (status >= 500) throw httpError(502, 'UPSTREAM_DOWN');
  if (status !== 200) throw httpError(502, 'UPSTREAM_ERROR');

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw httpError(502, 'UPSTREAM_BAD_RESPONSE');
  }
  return { status: 'success', result: simplify(parsed) };
}

function fromCache(row, term, stale) {
  if (row.status === 'not_found') {
    return { status: 'not_found', term, cached: true, stale };
  }
  try {
    return { status: 'success', term, result: JSON.parse(row.payload), cached: true, stale };
  } catch {
    return null; // corrupt cache row: treat as a miss
  }
}

export async function lookupTerm(rawTerm) {
  const term = normalizeTerm(rawTerm);
  if (!term) throw httpError(400, 'INVALID_TERM');

  const cached = db.prepare('SELECT * FROM term_cache WHERE term = ?').get(term);
  if (cached) {
    const ttl = cached.status === 'success' ? SUCCESS_TTL_MS : NOT_FOUND_TTL_MS;
    if (Date.now() - parseUtc(cached.fetched_at) < ttl) {
      const hit = fromCache(cached, term, false);
      if (hit) return hit;
    }
  }

  try {
    const upstream = await fetchUpstream(term);
    db.prepare(
      'INSERT OR REPLACE INTO term_cache (term, payload, status, fetched_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(term, JSON.stringify(upstream.result ?? {}), upstream.status);
    return { ...upstream, term, cached: false, stale: false };
  } catch (error) {
    // Better to show an old definition than an error screen.
    if (cached?.status === 'success') {
      const stale = fromCache(cached, term, true);
      if (stale) return stale;
    }
    throw error;
  }
}
