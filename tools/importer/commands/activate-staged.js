import path from 'node:path';
import { rename } from 'node:fs/promises';
import { resolveContentPaths, DEFAULT_CONTENT_ROOT } from '../lib/paths.js';
import { pathExists, removePath } from '../lib/fs.js';
import { logInfo, logSuccess } from '../lib/logger.js';

export async function activateStaged(options) {
  const contentRoot = options.contentRoot ? path.resolve(options.contentRoot) : DEFAULT_CONTENT_ROOT;
  const paths = resolveContentPaths(contentRoot);

  const stagedDb = options.stagedDb ? path.resolve(options.stagedDb) : paths.stagedDb;
  const activeDb = options.activeDb ? path.resolve(options.activeDb) : paths.activeDb;
  const backupDb = path.join(path.dirname(activeDb), 'app.db.previous');

  if (!(await pathExists(stagedDb))) {
    throw new Error(`Staged database not found at ${stagedDb}`);
  }

  if (await pathExists(backupDb)) {
    await removePath(backupDb);
  }

  if (await pathExists(activeDb)) {
    await rename(activeDb, backupDb);
    await removePath(`${activeDb}-wal`);
    await removePath(`${activeDb}-shm`);
    logInfo(`Active database backed up to ${backupDb}`);
  }

  await rename(stagedDb, activeDb);
  await removePath(`${stagedDb}-wal`);
  await removePath(`${stagedDb}-shm`);
  logSuccess(`Activated staged database at ${activeDb}`);
}
