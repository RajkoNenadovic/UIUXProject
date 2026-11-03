import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './connection.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const seed = fs.readFileSync(path.resolve(currentDir, '../../db/seed.sql'), 'utf8');
db.exec(seed);
console.log('Sample data seeded.');
db.close();
