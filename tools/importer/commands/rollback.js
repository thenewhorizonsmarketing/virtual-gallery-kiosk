import path from 'node:path';
import { rename } from 'node:fs/promises';
import { resolveContentPaths, DEFAULT_CONTENT_ROOT } from '../lib/paths.js';
import { pathExists, removePath } from '../lib/fs.js';
import { logInfo, logSuccess } from '../lib/logger.js';

export async function rollbackActive(options) {
  const contentRoot = options.contentRoot ? path.resolve(options.contentRoot) : DEFAULT_CONTENT_ROOT;
  const paths = resolveContentPaths(contentRoot);

  const activeDb = options.activeDb ? path.resolve(options.activeDb) : paths.activeDb;
  const backupDb = path.join(path.dirname(activeDb), 'app.db.previous');

  if (!(await pathExists(backupDb))) {
    throw new Error(`No backup database found at ${backupDb}`);
  }

  const failedDb = `${activeDb}.failed-${Date.now()}`;
  if (await pathExists(activeDb)) {
    await rename(activeDb, failedDb);
    await removePath(`${activeDb}-wal`);
    await removePath(`${activeDb}-shm`);
    logInfo(`Current active database moved to ${failedDb}`);
  }

  await rename(backupDb, activeDb);
  await removePath(`${backupDb}-wal`);
  await removePath(`${backupDb}-shm`);
  logSuccess(`Rollback complete. Active database restored from ${backupDb}`);
}
