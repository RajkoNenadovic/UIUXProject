import { Router } from 'express';
import { db } from '../db/connection.js';
import { httpError } from '../lib/httpError.js';

const router = Router();

export const DOC_TYPES = ['lease', 'tax', 'residence', 'medical', 'education', 'other'];
const MAX_TITLE = 120;
const MAX_TEXT = 100000;
const CHARS_PER_PAGE = 3000; // rough estimate used when the user pastes text

// Correlated subqueries (not JOINs) so each count is computed on its own:
// joining sentences and action_items together would multiply rows.
const SUMMARY_SQL = `
  SELECT d.id, d.title, d.doc_type, d.page_count, d.reading_level, d.status,
         d.created_at, d.updated_at,
         (SELECT COUNT(*) FROM sentences s WHERE s.document_id = d.id) AS sentence_count,
         (SELECT COUNT(*) FROM sentences s WHERE s.document_id = d.id AND s.status = 'uncertain') AS uncertain_count,
         (SELECT COUNT(*) FROM action_items a WHERE a.document_id = d.id AND a.kind = 'must' AND a.done = 0) AS open_action_count
  FROM documents d`;

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw httpError(404, 'NOT_FOUND');
  return id;
}

function cleanTitle(value) {
  const title = typeof value === 'string' ? value.normalize('NFC').trim() : '';
  if (!title) throw httpError(400, 'TITLE_REQUIRED');
  if (title.length > MAX_TITLE) throw httpError(400, 'TITLE_TOO_LONG');
  return title;
}

function cleanType(value) {
  if (!DOC_TYPES.includes(value)) throw httpError(400, 'INVALID_DOC_TYPE');
  return value;
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?…])\s+/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 500);
}

const getSummary = (id) => db.prepare(`${SUMMARY_SQL} WHERE d.id = ?`).get(id);

router.get('/', (request, response) => {
  const documents = db.prepare(`${SUMMARY_SQL} ORDER BY d.updated_at DESC, d.id DESC`).all();
  response.json({ documents });
});

router.get('/:id', (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    const document = getSummary(id);
    if (!document) throw httpError(404, 'NOT_FOUND');
    const sentences = db.prepare('SELECT * FROM sentences WHERE document_id = ? ORDER BY position').all(id);
    const actions = db.prepare('SELECT * FROM action_items WHERE document_id = ? ORDER BY id').all(id);
    response.json({ document, sentences, actions });
  } catch (error) {
    next(error);
  }
});

router.post('/', (request, response, next) => {
  try {
    const body = request.body ?? {};
    const title = cleanTitle(body.title);
    const docType = cleanType(body.doc_type);
    const text = typeof body.original_text === 'string' ? body.original_text.normalize('NFC').trim() : '';
    if (!text) throw httpError(400, 'TEXT_REQUIRED');
    if (text.length > MAX_TEXT) throw httpError(400, 'TEXT_TOO_LONG');

    const pageCount = Math.max(1, Math.ceil(text.length / CHARS_PER_PAGE));
    const insertDocument = db.prepare(
      'INSERT INTO documents (title, doc_type, page_count, original_text) VALUES (?, ?, ?, ?)'
    );
    // Sentences are stored as "skipped" with empty plain text until the rewrite engine processes them.
    const insertSentence = db.prepare(`
      INSERT INTO sentences (document_id, position, section_ref, original_text, plain_text, confidence, status)
      VALUES (?, ?, ?, ?, '', 0, 'skipped')`);

    const create = db.transaction(() => {
      const { lastInsertRowid } = insertDocument.run(title, docType, pageCount, text);
      splitSentences(text).forEach((sentence, index) => {
        insertSentence.run(lastInsertRowid, index + 1, `#${index + 1}`, sentence);
      });
      return Number(lastInsertRowid);
    });

    response.status(201).json({ document: getSummary(create()) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    if (!getSummary(id)) throw httpError(404, 'NOT_FOUND');
    const body = request.body ?? {};
    const hasTitle = body.title !== undefined;
    const hasType = body.doc_type !== undefined;
    if (!hasTitle && !hasType) throw httpError(400, 'NO_CHANGES');

    const title = hasTitle ? cleanTitle(body.title) : null;
    const docType = hasType ? cleanType(body.doc_type) : null;
    db.prepare(`
      UPDATE documents
      SET title = COALESCE(?, title), doc_type = COALESCE(?, doc_type), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`).run(title, docType, id);
    response.json({ document: getSummary(id) });
  } catch (error) {
    next(error);
  }
});

// ON DELETE CASCADE removes the document's sentences and action items.
router.delete('/:id', (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    const info = db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    if (info.changes === 0) throw httpError(404, 'NOT_FOUND');
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
