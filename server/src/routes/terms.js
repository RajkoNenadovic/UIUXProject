import { Router } from 'express';
import { db } from '../db/connection.js';
import { httpError } from '../lib/httpError.js';
import { lookupTerm } from '../services/dictionary.js';

const router = Router();

// GET /api/terms/define?term=forbearance -> dictionary lookup (cached, see services/dictionary.js)
router.get('/define', async (request, response, next) => {
  try {
    response.json(await lookupTerm(request.query.term));
  } catch (error) {
    next(error);
  }
});

// Saved glossary
router.get('/', (request, response) => {
  const terms = db.prepare(`
    SELECT t.id, t.term, t.definition, t.example_in_context, t.source_document_id, t.created_at,
           d.title AS source_title
    FROM saved_terms t
    LEFT JOIN documents d ON d.id = t.source_document_id
    ORDER BY t.created_at DESC, t.id DESC
  `).all();
  response.json({ terms });
});

router.post('/', (request, response, next) => {
  try {
    const { term, definition, example_in_context: example } = request.body ?? {};
    const cleanTerm = typeof term === 'string' ? term.normalize('NFC').trim().toLowerCase() : '';
    const cleanDefinition = typeof definition === 'string' ? definition.trim() : '';
    if (cleanTerm.length < 1 || cleanTerm.length > 80) throw httpError(400, 'TERM_REQUIRED');
    if (cleanDefinition.length < 1 || cleanDefinition.length > 1000) throw httpError(400, 'DEFINITION_REQUIRED');
    const cleanExample = typeof example === 'string' && example.trim() ? example.trim().slice(0, 500) : null;

    try {
      const info = db.prepare(
        'INSERT INTO saved_terms (term, definition, example_in_context) VALUES (?, ?, ?)'
      ).run(cleanTerm, cleanDefinition, cleanExample);
      const saved = db.prepare('SELECT * FROM saved_terms WHERE id = ?').get(info.lastInsertRowid);
      response.status(201).json({ term: saved });
    } catch (dbError) {
      if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE') throw httpError(409, 'TERM_EXISTS');
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (request, response) => {
  const info = db.prepare('DELETE FROM saved_terms WHERE id = ?').run(Number(request.params.id));
  if (info.changes === 0) {
    return response.status(404).json({ error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' } });
  }
  return response.status(204).end();
});

export default router;
