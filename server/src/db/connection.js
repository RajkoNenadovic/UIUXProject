import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultDatabaseFile = path.resolve(currentDir, '../../data/plain-language-layer.db');
const databaseFile = process.env.DATABASE_FILE
  ? path.resolve(process.cwd(), process.env.DATABASE_FILE)
  : defaultDatabaseFile;

fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

export const db = new Database(databaseFile);
db.pragma('foreign_keys = ON');
