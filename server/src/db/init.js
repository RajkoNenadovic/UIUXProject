import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './connection.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const schema = fs.readFileSync(path.resolve(currentDir, '../../db/schema.sql'), 'utf8');

const tableNames = [
	'term_cache',
	'settings',
	'action_items',
	'saved_terms',
	'sentences',
	'documents'
];

db.pragma('foreign_keys = OFF');
db.transaction(() => {
	tableNames.forEach((tableName) => {
		db.prepare(`DROP TABLE IF EXISTS ${tableName}`).run();
	});
	db.exec(schema);
})();
db.pragma('foreign_keys = ON');
console.log('Database schema initialized.');
db.close();
