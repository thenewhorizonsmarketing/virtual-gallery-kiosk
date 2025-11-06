import { mkdir, stat, rm, writeFile, readFile, readdir, copyFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

export async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

export async function pathExists(targetPath) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function removePath(targetPath) {
  await rm(targetPath, { recursive: true, force: true });
}

export async function readJson(filePath) {
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content);
}

export async function writeJson(filePath, data) {
  const payload = JSON.stringify(data, null, 2);
  await writeFile(filePath, payload, 'utf8');
}

export async function listFilesRecursive(directory) {
  const result = [];
  const queue = [''];
  while (queue.length > 0) {
    const relative = queue.shift();
    const dirPath = relative ? path.join(directory, relative) : directory;
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryRelative = relative ? path.join(relative, entry.name) : entry.name;
      if (entry.isDirectory()) {
        queue.push(entryRelative);
      } else if (entry.isFile()) {
        result.push(entryRelative);
      }
    }
  }
  return result;
}

export async function copyFileIfChanged(source, target) {
  try {
    const [sourceStat, targetStat] = await Promise.all([
      stat(source),
      stat(target).catch(() => null),
    ]);
    if (targetStat && targetStat.size === sourceStat.size && targetStat.mtimeMs >= sourceStat.mtimeMs) {
      return false;
    }
  } catch {
    // ignore stat errors, fallback to copy
  }
  await ensureDir(path.dirname(target));
  await copyFile(source, target);
  return true;
}
