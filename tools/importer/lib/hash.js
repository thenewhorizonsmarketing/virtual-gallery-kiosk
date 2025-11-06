import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export async function hashFileSha256(filePath) {
  const buffer = await readFile(filePath);
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

export function hashBufferSha256(buffer) {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}
