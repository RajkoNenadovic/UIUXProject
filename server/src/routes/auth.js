import crypto from 'node:crypto';
import { Router } from 'express';
import { db } from '../db/connection.js';
import { httpError } from '../lib/httpError.js';
import { burnPasswordTime, hashPassword, verifyPassword } from '../lib/passwords.js';
import { clearFailures, isBlocked, recordFailure } from '../lib/rateLimit.js';
import {
  clearSessionCookie, findSession, hashToken, requireAuth, setSessionCookie
} from '../middleware/requireAuth.js';

const router = Router();

export const ROLES = ['adult', 'student', 'professional'];
const LOCALES = ['en', 'es', 'hr'];
const MAX_NAME = 60;
const MAX_EMAIL = 254;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128; // scrypt cost grows with input size, so very long passwords are refused
const REMEMBER_SECONDS = 30 * 24 * 60 * 60;
const SHORT_SESSION_SECONDS = 12 * 60 * 60; // browser-session cookie; the server still ends it after 12 h
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

// What the browser may see about a user. The password hash never leaves the server.
function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    role: row.role,
    onboarded: Boolean(row.onboarded_at),
    locale: row.locale,
    reading_level: row.reading_level
  };
}

function cleanEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!email || email.length > MAX_EMAIL || !EMAIL_PATTERN.test(email)) throw httpError(400, 'EMAIL_INVALID');
  return email;
}

function cleanName(value) {
  const name = typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/gu, ' ') : '';
  if (!name) throw httpError(400, 'NAME_REQUIRED');
  if (name.length > MAX_NAME) throw httpError(400, 'NAME_TOO_LONG');
  return name;
}

function cleanNewPassword(value) {
  if (typeof value !== 'string' || value.length < MIN_PASSWORD) throw httpError(400, 'PASSWORD_TOO_SHORT');
  if (value.length > MAX_PASSWORD) throw httpError(400, 'PASSWORD_TOO_LONG');
  return value;
}

function startSession(response, userId, remember) {
  const token = crypto.randomBytes(32).toString('base64url');
  const seconds = remember ? REMEMBER_SECONDS : SHORT_SESSION_SECONDS;
  db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run(); // housekeeping
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', ?))")
    .run(hashToken(token), userId, `+${seconds} seconds`);
  // "Keep me signed in" -> persistent cookie. Otherwise a session cookie that goes when the browser closes.
  setSessionCookie(response, token, remember ? seconds : null);
}

// New accounts start from the shared defaults in the old `settings` table.
function defaultsFor(locale) {
  const defaults = db.prepare('SELECT reading_level, dyslexia_friendly, font_size, spacing FROM settings WHERE id = 1').get()
    || { reading_level: 6, dyslexia_friendly: 0, font_size: 'medium', spacing: 'comfortable' };
  return { ...defaults, locale: LOCALES.includes(locale) ? locale : 'en' };
}

router.post('/register', async (request, response, next) => {
  try {
    const body = request.body ?? {};
    const displayName = cleanName(body.display_name);
    const email = cleanEmail(body.email);
    const password = cleanNewPassword(body.password);
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw httpError(409, 'EMAIL_TAKEN');

    const passwordHash = await hashPassword(password);
    const d = defaultsFor(body.locale);
    let info;
    try {
      info = db.prepare(`
        INSERT INTO users (email, display_name, password_hash, reading_level, dyslexia_friendly, font_size, spacing, locale)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(email, displayName, passwordHash, d.reading_level, d.dyslexia_friendly, d.font_size, d.spacing, d.locale);
    } catch (dbError) {
      // Two sign-ups with the same email at the same moment: the UNIQUE index decides.
      if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE') throw httpError(409, 'EMAIL_TAKEN');
      throw dbError;
    }
    startSession(response, info.lastInsertRowid, body.remember === true);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    response.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (request, response, next) => {
  try {
    const body = request.body ?? {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) throw httpError(400, 'CREDENTIALS_REQUIRED');

    const key = `${request.ip}|${email}`;
    if (isBlocked(key)) throw httpError(429, 'TOO_MANY_ATTEMPTS');

    const user = password.length <= MAX_PASSWORD
      ? db.prepare('SELECT * FROM users WHERE email = ?').get(email)
      : null;
    // Same answer and about the same time for "no such account" and "wrong password".
    const ok = user ? await verifyPassword(password, user.password_hash) : (await burnPasswordTime(password), false);
    if (!ok) {
      recordFailure(key);
      throw httpError(401, 'INVALID_CREDENTIALS');
    }

    clearFailures(key);
    startSession(response, user.id, body.remember === true);
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

// Safe to call when not signed in (the browser may already have lost the session).
router.post('/logout', (request, response) => {
  const session = findSession(request);
  if (session) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(session.tokenHash);
  clearSessionCookie(response);
  response.status(204).end();
});

// "Who is signed in?" is a normal question with a normal answer when nobody is: 200 with user: null.
// (A 401 here would put a red error in the browser console on every first visit.)
router.get('/me', (request, response) => {
  const session = findSession(request);
  response.json({ user: session ? publicUser(session.user) : null });
});

// Screen 02: role and starting reading level. Also used later from Settings to change them
// (answers the D1 open question "only once, or re-triggerable?" -> re-triggerable).
router.put('/profile', requireAuth, (request, response, next) => {
  try {
    const { role, reading_level: level } = request.body ?? {};
    if (!ROLES.includes(role)) throw httpError(400, 'INVALID_ROLE');
    if (!Number.isInteger(level) || level < 1 || level > 12) throw httpError(400, 'INVALID_READING_LEVEL');
    db.prepare(`
      UPDATE users SET role = ?, reading_level = ?, onboarded_at = COALESCE(onboarded_at, datetime('now')) WHERE id = ?
    `).run(role, level, request.user.id);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(request.user.id);
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
