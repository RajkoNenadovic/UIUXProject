import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './connection.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const schema = fs.readFileSync(path.resolve(currentDir, '../../db/schema.sql'), 'utf8');
db.exec(schema);
console.log('Database schema initialized.');
db.close();
