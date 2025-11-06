import path from 'node:path';
import { resolveContentPaths, DEFAULT_CONTENT_ROOT } from '../lib/paths.js';
import { pathExists } from '../lib/fs.js';
import { runSqliteScript } from '../lib/sqlite.js';
import { logSuccess } from '../lib/logger.js';

export async function reindexFts(options) {
  const contentRoot = options.contentRoot ? path.resolve(options.contentRoot) : DEFAULT_CONTENT_ROOT;
  const paths = resolveContentPaths(contentRoot);
  const dbPath = options.activeDb ? path.resolve(options.activeDb) : paths.activeDb;

  if (!(await pathExists(dbPath))) {
    throw new Error(`Database not found at ${dbPath}`);
  }

  const statements = [
    'DELETE FROM person_fts;',
    `INSERT INTO person_fts(rowid, display_name, last_name, first_name)
      SELECT id, display_name, last_name, first_name FROM person;`,
  ];

  await runSqliteScript(dbPath, statements);
  logSuccess('FTS index refreshed.');
}
