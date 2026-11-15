import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

// scrypt is a memory-hard password hash that ships with Node, so no extra dependency is needed.
// The stored string carries its own parameters, so they can be raised later without breaking old hashes:
//   scrypt$N$r$p$<salt base64>$<hash base64>
const PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

const normalise = (password) => password.normalize('NFKC');

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(normalise(password), salt, KEY_LENGTH, PARAMS);
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password, stored) {
  const [scheme, N, r, p, saltB64, keyB64] = String(stored).split('$');
  if (scheme !== 'scrypt' || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scrypt(normalise(password), Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p)
  });
  return crypto.timingSafeEqual(actual, expected);
}

// Used when the email is unknown, so "no such account" costs the same time as "wrong password".
let dummyHash;
export async function burnPasswordTime(password) {
  dummyHash ??= await hashPassword('not-a-real-password');
  await verifyPassword(password, dummyHash);
}
