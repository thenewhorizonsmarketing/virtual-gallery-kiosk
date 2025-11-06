import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';

export async function createTempDir(prefix = 'kiosk-pack-') {
  const base = path.join(tmpdir(), prefix);
  return mkdtemp(base);
}

export async function extractZip(zipPath, destination) {
  await new Promise((resolve, reject) => {
    const child = execFile('unzip', ['-q', zipPath, '-d', destination], (error) => {
      if (error) {
        reject(new Error(`Failed to extract ${zipPath}: ${error.message}`));
      } else {
        resolve();
      }
    });
    child.on('error', (error) => {
      reject(new Error(`Unable to launch unzip: ${error.message}`));
    });
  });
}
