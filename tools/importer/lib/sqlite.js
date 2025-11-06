import { spawn } from 'node:child_process';
import { logInfo } from './logger.js';

export function runSqliteScript(databasePath, statements, { wrapTransaction = true } = {}) {
  const script = Array.isArray(statements) ? statements.join('\n') : statements;
  return new Promise((resolve, reject) => {
    const child = spawn('sqlite3', ['-batch', databasePath], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `sqlite3 exited with code ${code}`));
      } else {
        resolve();
      }
    });
    if (wrapTransaction) {
      child.stdin.write('PRAGMA foreign_keys = ON;\nBEGIN;\n');
    }
    child.stdin.write(`${script}\n`);
    if (wrapTransaction) {
      child.stdin.write('COMMIT;\n');
    }
    child.stdin.end();
  });
}

export async function initialiseDatabase(databasePath) {
  const schemaStatements = [
    'PRAGMA journal_mode=WAL;',
    `CREATE TABLE IF NOT EXISTS person (
      id TEXT PRIMARY KEY,
      first_name TEXT,
      middle_name TEXT,
      last_name TEXT,
      suffix TEXT,
      display_name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      bio TEXT,
      is_faculty INTEGER NOT NULL DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS cohort (
      id TEXT PRIMARY KEY,
      year INTEGER UNIQUE,
      label TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS person_cohort (
      person_id TEXT NOT NULL,
      cohort_id TEXT NOT NULL,
      is_class_president INTEGER NOT NULL DEFAULT 0,
      homeroom TEXT,
      notes TEXT,
      PRIMARY KEY (person_id, cohort_id)
    );`,
    `CREATE TABLE IF NOT EXISTS photo (
      id TEXT PRIMARY KEY,
      sha256 TEXT NOT NULL UNIQUE,
      ext TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      bytes INTEGER,
      caption TEXT,
      credit TEXT,
      created_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS person_photo (
      person_id TEXT NOT NULL,
      photo_id TEXT NOT NULL,
      kind TEXT CHECK(kind IN ('portrait','candid','other')),
      is_primary INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (person_id, photo_id)
    );`,
    `CREATE TABLE IF NOT EXISTS publication (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      issue_date TEXT,
      volume TEXT,
      number TEXT,
      slug TEXT NOT NULL UNIQUE,
      cover_photo_id TEXT,
      flipbook_manifest_path TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS archive_item (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      year INTEGER,
      kind TEXT CHECK(kind IN ('photo','flipbook')),
      photo_id TEXT,
      flipbook_manifest_path TEXT,
      description TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_person_display_name ON person(display_name);`,
    `CREATE INDEX IF NOT EXISTS idx_person_cohort_cohort_id ON person_cohort(cohort_id);`,
    `CREATE INDEX IF NOT EXISTS idx_person_cohort_president ON person_cohort(is_class_president);`,
    `CREATE INDEX IF NOT EXISTS idx_publication_issue_date ON publication(issue_date DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_archive_item_year ON archive_item(year DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_archive_item_kind ON archive_item(kind);`,
    `CREATE VIRTUAL TABLE IF NOT EXISTS person_fts USING fts5(
      display_name, last_name, first_name,
      content='person', content_rowid='id'
    );`,
  ];
  await runSqliteScript(databasePath, schemaStatements, { wrapTransaction: false });
  logInfo(`Initialised SQLite schema at ${databasePath}`);
}

export function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  const stringValue = String(value).replace(/'/g, "''");
  return `'${stringValue}'`;
}

export function buildInsert(tableName, columns, rows) {
  if (!rows || rows.length === 0) {
    return [];
  }
  const columnList = columns.join(', ');
  return rows.map((row) => {
    const values = columns.map((column) => escapeValue(row[column]));
    return `INSERT INTO ${tableName} (${columnList}) VALUES (${values.join(', ')});`;
  });
}

export async function runQuery(databasePath, query) {
  return new Promise((resolve, reject) => {
    const child = spawn('sqlite3', ['-json', databasePath, query], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    let stdout = '';
    child.stderr.setEncoding('utf8');
    child.stdout.setEncoding('utf8');
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `sqlite3 exited with code ${code}`));
      } else {
        try {
          resolve(JSON.parse(stdout || '[]'));
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}
