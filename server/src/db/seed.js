import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './connection.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const seed = fs.readFileSync(path.resolve(currentDir, '../../db/seed.sql'), 'utf8');
db.exec(seed);

const fixturesDir = path.resolve(currentDir, '../../data/fixtures');
const fixtureTypes = {
  aviso_beca: 'Administrative notice',
  course_enrollment: 'Academic guide',
  medical_appointment: 'Medical instructions',
  student_financial_aid: 'Financial aid notice'
};

const insertDocument = db.prepare(`
  INSERT INTO documents (title, doc_type, page_count, original_text, reading_level, status)
  VALUES (?, ?, ?, ?, 6, 'ready')
`);
const addFixtures = db.transaction(() => {
  for (const filename of fs.readdirSync(fixturesDir).filter((file) => file.endsWith('.txt')).sort()) {
    const title = filename.replace(/\.txt$/i, '');
    if (db.prepare('SELECT 1 FROM documents WHERE title = ?').get(title)) continue;
    const originalText = fs.readFileSync(path.join(fixturesDir, filename), 'utf8').trim();
    const pageCount = Math.max(1, Math.ceil(originalText.length / 2200));
    insertDocument.run(title, fixtureTypes[title] || 'Uploaded document', pageCount, originalText);
  }
});
addFixtures();
console.log('Sample data and text fixtures seeded.');
db.close();
