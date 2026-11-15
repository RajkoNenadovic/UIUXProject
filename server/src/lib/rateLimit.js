// Tiny in-memory limiter for failed sign-ins: 5 failures per 15 minutes per (address, email).
// It lives in this process, so it resets when the server restarts and is not shared between
// several server processes. A real deployment would use a shared store such as Redis.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map();

const fresh = (list, now) => list.filter((time) => now - time < WINDOW_MS);

export function isBlocked(key, now = Date.now()) {
  const list = fresh(failures.get(key) ?? [], now);
  if (list.length === 0) failures.delete(key);
  else failures.set(key, list);
  return list.length >= MAX_FAILURES;
}

export function recordFailure(key, now = Date.now()) {
  failures.set(key, [...fresh(failures.get(key) ?? [], now), now]);
  if (failures.size > 10000) failures.clear(); // memory guard against a flood of different emails
}

export function clearFailures(key) {
  failures.delete(key);
}
