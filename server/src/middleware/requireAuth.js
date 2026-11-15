import crypto from 'node:crypto';
import { db } from '../db/connection.js';
import { httpError } from '../lib/httpError.js';

export const COOKIE_NAME = 'pll_session';
const SECURE = process.env.NODE_ENV === 'production';

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function readCookie(request, name) {
  for (const part of (request.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0 && part.slice(0, index).trim() === name) {
      try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return null; }
    }
  }
  return null;
}

// HttpOnly: scripts on the page cannot read the cookie. SameSite=Lax: other sites cannot make the
// browser send it with a POST/PUT/DELETE. Secure is switched on when NODE_ENV=production (HTTPS).
export function setSessionCookie(response, token, maxAgeSeconds) {
  const parts = [`${COOKIE_NAME}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (maxAgeSeconds) parts.push(`Max-Age=${maxAgeSeconds}`);
  if (SECURE) parts.push('Secure');
  response.append('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(response) {
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (SECURE) parts.push('Secure');
  response.append('Set-Cookie', parts.join('; '));
}

export function findSession(request) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;
  const tokenHash = hashToken(token);
  const user = db.prepare(`
    SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')
  `).get(tokenHash);
  return user ? { user, tokenHash } : null;
}

export function requireAuth(request, response, next) {
  const session = findSession(request);
  if (!session) return next(httpError(401, 'UNAUTHENTICATED'));
  request.user = session.user;
  request.sessionTokenHash = session.tokenHash;
  return next();
}
