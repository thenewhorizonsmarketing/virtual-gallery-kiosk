import path from 'node:path';
import { ensureDir } from './fs.js';

export const DEFAULT_CONTENT_ROOT = path.resolve('content');

export function resolveContentPaths(contentRoot = DEFAULT_CONTENT_ROOT) {
  const root = path.resolve(contentRoot);
  const dbDir = path.join(root, 'db');
  const assetsDir = path.join(root, 'assets');
  const imagesDir = path.join(assetsDir, 'img');
  const flipbooksDir = path.join(assetsDir, 'flipbooks');
  const derivativesDir = path.join(root, 'derivatives');
  const thumbDir = path.join(derivativesDir, 'thumb');
  const screenDir = path.join(derivativesDir, 'screen');
  const logsDir = path.join(root, 'logs');
  return {
    root,
    dbDir,
    stagedDb: path.join(dbDir, 'app.db.staging'),
    activeDb: path.join(dbDir, 'app.db'),
    backupDb: path.join(dbDir, 'app.db.backup'),
    assetsDir,
    imagesDir,
    flipbooksDir,
    derivativesDir,
    thumbDir,
    screenDir,
    logsDir,
  };
}

export async function ensureContentLayout(contentRoot = DEFAULT_CONTENT_ROOT) {
  const paths = resolveContentPaths(contentRoot);
  await Promise.all([
    ensureDir(paths.root),
    ensureDir(paths.dbDir),
    ensureDir(paths.imagesDir),
    ensureDir(paths.flipbooksDir),
    ensureDir(paths.thumbDir),
    ensureDir(paths.screenDir),
    ensureDir(paths.logsDir),
  ]);
  return paths;
}
