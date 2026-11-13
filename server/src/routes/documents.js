import { Router } from 'express';
import { db } from '../db/connection.js';

const router = Router();

router.get('/', (request, response) => {
  const search = typeof request.query.search === 'string' ? request.query.search.trim() : '';
  const documents = search
    ? db.prepare('SELECT id, title, doc_type, page_count, reading_level, status, created_at, updated_at FROM documents WHERE title LIKE ? ORDER BY updated_at DESC').all(`%${search}%`)
    : db.prepare('SELECT id, title, doc_type, page_count, reading_level, status, created_at, updated_at FROM documents ORDER BY updated_at DESC').all();
  response.json({ documents });
});

router.post('/', (request, response) => {
  const { title, docType = 'Document', originalText, pageCount = 1, readingLevel = 6 } = request.body || {};
  if (typeof title !== 'string' || !title.trim() || typeof originalText !== 'string' || !originalText.trim()) {
    return response.status(400).json({
      error: { code: 'INVALID_DOCUMENT', message: 'A title and document text are required.' }
    });
  }
  if (!Number.isInteger(pageCount) || pageCount < 1 || ![6, 8, 10].includes(readingLevel)) {
    return response.status(400).json({
      error: { code: 'INVALID_DOCUMENT_OPTIONS', message: 'Page count or reading level is invalid.' }
    });
  }

  const result = db.prepare(`
    INSERT INTO documents (title, doc_type, page_count, original_text, reading_level, status)
    VALUES (?, ?, ?, ?, ?, 'ready')
  `).run(title.trim(), String(docType).trim() || 'Document', pageCount, originalText.trim(), readingLevel);
  const document = db.prepare('SELECT id, title, doc_type, page_count, reading_level, status, created_at, updated_at FROM documents WHERE id = ?').get(result.lastInsertRowid);
  return response.status(201).json({ document });
});

router.get('/:id', (request, response) => {
  const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(request.params.id);
  if (!document) {
    return response.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' } });
  }
  return response.json({ document });
});

export default router;
