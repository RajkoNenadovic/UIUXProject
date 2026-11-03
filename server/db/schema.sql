PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1,
  original_text TEXT NOT NULL,
  reading_level INTEGER NOT NULL DEFAULT 6,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'error')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sentences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  section_ref TEXT NOT NULL,
  original_text TEXT NOT NULL,
  plain_text TEXT NOT NULL,
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL CHECK (status IN ('match', 'uncertain', 'skipped')),
  uncertain_reason TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  example_in_context TEXT,
  source_document_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS action_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('must', 'can')),
  title TEXT NOT NULL,
  deadline TEXT,
  consequence TEXT,
  source_ref TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  reading_level INTEGER NOT NULL DEFAULT 6,
  dyslexia_friendly INTEGER NOT NULL DEFAULT 0 CHECK (dyslexia_friendly IN (0, 1)),
  font_size TEXT NOT NULL DEFAULT 'medium',
  spacing TEXT NOT NULL DEFAULT 'comfortable',
  theme TEXT NOT NULL DEFAULT 'light',
  locale TEXT NOT NULL DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS term_cache (
  term TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'not_found')),
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
