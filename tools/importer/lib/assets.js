import path from 'node:path';
import { stat, copyFile, cp } from 'node:fs/promises';
import { ensureDir, listFilesRecursive } from './fs.js';
import { hashFileSha256 } from './hash.js';
import { logInfo, logWarn } from './logger.js';

export async function syncImageAssets(sourceDir, targetDir) {
  await ensureDir(targetDir);
  const files = await listFilesRecursive(sourceDir);
  let copied = 0;
  for (const relativePath of files) {
    const filename = path.basename(relativePath);
    const match = filename.match(/^([a-f0-9]{64})\.(\w+)$/);
    if (!match) {
      logWarn(`Skipping unexpected image file name: ${filename}`);
      continue;
    }
    const [_, hash] = match;
    const absoluteSource = path.join(sourceDir, relativePath);
    const computed = await hashFileSha256(absoluteSource);
    if (computed !== hash) {
      throw new Error(`Hash mismatch for ${filename}: expected ${hash} actual ${computed}`);
    }
    const destination = path.join(targetDir, relativePath);
    await ensureDir(path.dirname(destination));
    await copyFile(absoluteSource, destination);
    copied += 1;
  }
  logInfo(`Synced ${copied} image assets.`);
}

export async function syncFlipbooks(sourceDir, targetDir) {
  await ensureDir(targetDir);
  const stats = await stat(sourceDir).catch(() => null);
  if (!stats) {
    logWarn('No flipbook assets found in pack.');
    return;
  }
  await cp(sourceDir, targetDir, { recursive: true, force: true });
  logInfo('Flipbook assets updated.');
}
