import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { hashBufferSha256 } from './hash.js';

const TableSchema = z.object({
  name: z.string(),
  format: z.enum(['csv', 'parquet']).default('csv'),
  path: z.string(),
  hash: z.string().optional(),
});

const ManifestSchema = z.object({
  pack_id: z.string(),
  content_version: z.number(),
  created_utc: z.string(),
  tables: z.array(TableSchema),
  assets: z.object({
    images: z.object({
      count: z.number().optional(),
      path: z.string(),
    }),
    flipbooks: z.object({
      count: z.number().optional(),
      path: z.string(),
    }),
  }),
  compat: z.object({
    min_app_semver: z.string(),
  }).optional(),
});

export async function loadManifest(rootDir) {
  const manifestPath = path.join(rootDir, 'manifest.json');
  const raw = await readFile(manifestPath);
  const manifest = ManifestSchema.parse(JSON.parse(raw.toString('utf8')));
  return { manifest, raw };
}

export function findTable(manifest, tableName) {
  return manifest.tables.find((table) => table.name === tableName);
}

export function ensureSemverCompatible(manifest, currentSemver) {
  if (!manifest.compat?.min_app_semver) {
    return;
  }
  const min = manifest.compat.min_app_semver;
  if (!isSemverSatisfied(currentSemver, min)) {
    throw new Error(`Pack requires app version >= ${min}, current ${currentSemver}`);
  }
}

function isSemverSatisfied(current, minimum) {
  const currentParts = current.split('.').map((value) => Number.parseInt(value, 10));
  const minParts = minimum.split('.').map((value) => Number.parseInt(value, 10));
  for (let index = 0; index < Math.max(currentParts.length, minParts.length); index += 1) {
    const cur = currentParts[index] ?? 0;
    const min = minParts[index] ?? 0;
    if (cur > min) return true;
    if (cur < min) return false;
  }
  return true;
}

export async function verifyManifestHash(rootDir, rawManifest) {
  const checksumPath = path.join(rootDir, 'checksums', 'manifest.sha256');
  const checksumContent = await readFile(checksumPath, 'utf8');
  const expectedHash = checksumContent.trim().split(/\s+/)[0];
  const actualHash = hashBufferSha256(rawManifest);
  if (expectedHash && actualHash !== expectedHash) {
    throw new Error(`Manifest hash mismatch: expected ${expectedHash} received ${actualHash}`);
  }
  return actualHash;
}

export async function verifyManifestSignature(rootDir, rawManifest, publicKeyBuffer) {
  const signaturePath = path.join(rootDir, 'signature.sig');
  const signature = await readFile(signaturePath);
  const { subtle } = globalThis.crypto ?? await import('node:crypto').then((module) => module.webcrypto);
  const key = await subtle.importKey(
    'raw',
    publicKeyBuffer,
    { name: 'Ed25519' },
    false,
    ['verify']
  );
  const ok = await subtle.verify('Ed25519', key, signature, rawManifest);
  if (!ok) {
    throw new Error('Manifest signature verification failed.');
  }
  return signature;
}
