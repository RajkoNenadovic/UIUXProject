import { Router } from 'express';
import { db } from '../db/connection.js';
import { httpError } from '../lib/httpError.js';

const router = Router();

// Allow-list: each column is validated, and only these names ever reach the SQL string.
const rules = {
  locale: (value) => ['en', 'es', 'hr'].includes(value),
  reading_level: (value) => Number.isInteger(value) && value >= 1 && value <= 12,
  dyslexia_friendly: (value) => value === 0 || value === 1 || typeof value === 'boolean',
  font_size: (value) => ['small', 'medium', 'large'].includes(value),
  spacing: (value) => ['compact', 'comfortable', 'relaxed'].includes(value)
};

// Preferences belong to the signed-in user (columns on the users table).
const read = (userId) => db.prepare(
  'SELECT reading_level, dyslexia_friendly, font_size, spacing, locale FROM users WHERE id = ?'
).get(userId);

router.get('/', (request, response) => {
  response.json({ settings: read(request.user.id) });
});

// Partial update: send only the fields that changed.
router.put('/', (request, response, next) => {
  try {
    const body = request.body ?? {};
    const fields = Object.keys(rules).filter((key) => body[key] !== undefined);
    if (fields.length === 0) throw httpError(400, 'NO_CHANGES');

    for (const key of fields) {
      if (!rules[key](body[key])) throw httpError(400, `INVALID_${key.toUpperCase()}`);
    }
    const values = fields.map((key) => (typeof body[key] === 'boolean' ? Number(body[key]) : body[key]));
    db.prepare(`UPDATE users SET ${fields.map((key) => `${key} = ?`).join(', ')} WHERE id = ?`).run(...values, request.user.id);
    response.json({ settings: read(request.user.id) });
  } catch (error) {
    next(error);
  }
});

export default router;
