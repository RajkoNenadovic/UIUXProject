import { Router } from 'express';
import { db } from '../db/connection.js';

const router = Router();
const supportedLocales = new Set(['en', 'es', 'hr']);

router.get('/', (request, response) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  response.json({ settings: settings || null });
});

router.put('/', (request, response) => {
  const { locale, readingLevel, dyslexiaFriendly, fontSize, spacing, theme } = request.body || {};
  if (locale !== undefined && (typeof locale !== 'string' || !supportedLocales.has(locale))) {
    return response.status(400).json({
      error: { code: 'INVALID_LOCALE', message: 'The locale is not supported.' }
    });
  }
  if (readingLevel !== undefined && ![6, 8, 10].includes(readingLevel)) {
    return response.status(400).json({ error: { code: 'INVALID_READING_LEVEL', message: 'The reading level is invalid.' } });
  }
  if (dyslexiaFriendly !== undefined && ![true, false, 0, 1].includes(dyslexiaFriendly)) {
    return response.status(400).json({ error: { code: 'INVALID_ACCESSIBILITY_SETTING', message: 'The accessibility setting is invalid.' } });
  }
  const current = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  db.prepare(`
    UPDATE settings
    SET locale = ?, reading_level = ?, dyslexia_friendly = ?, font_size = ?, spacing = ?, theme = ?
    WHERE id = 1
  `).run(
    locale ?? current.locale,
    readingLevel ?? current.reading_level,
    dyslexiaFriendly === undefined ? current.dyslexia_friendly : Number(Boolean(dyslexiaFriendly)),
    fontSize ?? current.font_size,
    spacing ?? current.spacing,
    theme ?? current.theme
  );
  return response.json({ settings: db.prepare('SELECT * FROM settings WHERE id = 1').get() });
});

export default router;
