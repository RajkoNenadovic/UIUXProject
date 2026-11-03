import { Router } from 'express';
import { db } from '../db/connection.js';

const router = Router();
const supportedLocales = new Set(['en', 'es', 'hr']);

router.get('/', (request, response) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  response.json({ settings: settings || null });
});

router.put('/', (request, response) => {
  const { locale } = request.body;
  if (typeof locale !== 'string' || !supportedLocales.has(locale)) {
    return response.status(400).json({
      error: { code: 'INVALID_LOCALE', message: 'The locale is not supported.' }
    });
  }

  db.prepare('UPDATE settings SET locale = ? WHERE id = 1').run(locale);
  return response.json({ settings: db.prepare('SELECT * FROM settings WHERE id = 1').get() });
});

export default router;
