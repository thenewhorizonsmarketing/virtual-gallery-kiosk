import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createTempDir, extractZip } from '../lib/archive.js';
import { ensureContentLayout } from '../lib/paths.js';
import { loadManifest, ensureSemverCompatible, verifyManifestHash, verifyManifestSignature } from '../lib/manifest.js';
import { loadTable } from '../lib/normalise.js';
import { initialiseDatabase, runSqliteScript, buildInsert, escapeValue } from '../lib/sqlite.js';
import { removePath, writeJson } from '../lib/fs.js';
import { syncImageAssets, syncFlipbooks } from '../lib/assets.js';
import { logInfo, logSuccess } from '../lib/logger.js';
import { hashFileSha256 } from '../lib/hash.js';
import { DEFAULT_CONTENT_ROOT } from '../lib/paths.js';
import { generateDerivativesForImages } from './gen-derivatives.js';

const require = createRequire(import.meta.url);
const { version: APP_VERSION = '0.0.0' } = require('../../../package.json');

export async function importPack(options) {
  const packPath = options._?.[0];
  if (!packPath) {
    throw new Error('Specify a pack file: import-pack <path-to-pack.zip>');
  }

  const resolvedPackPath = path.resolve(packPath);
  const contentRoot = options.contentRoot ? path.resolve(options.contentRoot) : DEFAULT_CONTENT_ROOT;
  const skipDerivatives = options.skipDerivatives === true;
  const requireVerification = options.verify === true;
  const forceDerivatives = options.force === true;

  logInfo(`Importing content pack ${resolvedPackPath}`);

  const tempDir = await createTempDir();
  let packSha256 = null;

  try {
    logInfo(`Extracting pack to ${tempDir}`);
    await extractZip(resolvedPackPath, tempDir);

    const { manifest, raw } = await loadManifest(tempDir);
    ensureSemverCompatible(manifest, APP_VERSION);

    const manifestHash = await verifyManifestHash(tempDir, raw);
    let signatureBase64 = null;

    if (requireVerification) {
      const publicKeyPath = options.publicKey ? path.resolve(options.publicKey) : null;
      if (!publicKeyPath) {
        throw new Error('Signature verification requested but --public-key was not provided.');
      }
      const publicKeyBuffer = await readFile(publicKeyPath);
      const signature = await verifyManifestSignature(tempDir, raw, normalisePublicKey(publicKeyBuffer));
      signatureBase64 = Buffer.from(signature).toString('base64');
      logInfo('Signature verification passed.');
    }

    const tables = await loadAllTables(manifest, tempDir);

    const paths = await ensureContentLayout(contentRoot);
    const stagedDbPath = options.stagedDb ? path.resolve(options.stagedDb) : paths.stagedDb;
    await removePath(stagedDbPath);
    await removePath(`${stagedDbPath}-wal`);
    await removePath(`${stagedDbPath}-shm`);
    await initialiseDatabase(stagedDbPath);

    packSha256 = await hashFileSha256(resolvedPackPath);
    const statements = buildStatementsForImport(tables, manifest, { manifestHash, signatureBase64, packSha256 });
    await runSqliteScript(stagedDbPath, statements);
    logInfo('Database staged with imported content.');

    const imageSourceDir = path.join(tempDir, manifest.assets.images.path.replace(/^\//, ''));
    await syncImageAssets(imageSourceDir, paths.imagesDir);

    const flipbookSourceDir = path.join(tempDir, manifest.assets.flipbooks.path.replace(/^\//, ''));
    await syncFlipbooks(flipbookSourceDir, paths.flipbooksDir);

    if (!skipDerivatives) {
      await generateDerivativesForImages({
        imagesDir: paths.imagesDir,
        thumbDir: paths.thumbDir,
        screenDir: paths.screenDir,
        force: forceDerivatives,
      });
    } else {
      logInfo('Skipping derivative generation as requested.');
    }

    const logPath = path.join(paths.logsDir, `import-${Date.now()}.json`);
    const logPayload = {
      pack_id: manifest.pack_id,
      manifest_hash: manifestHash,
      signature: signatureBase64,
      imported_at: new Date().toISOString(),
      tables: Object.fromEntries(Object.entries(tables).map(([key, value]) => [key, value.length])),
      staged_db: stagedDbPath,
      content_root: contentRoot,
      pack_sha256: packSha256,
    };
    await writeJson(logPath, logPayload);
    logSuccess(`Import completed. Review ${logPath} and run activate-staged when ready.`);
  } finally {
    await removePath(tempDir);
  }
}

function normalisePublicKey(buffer) {
  const trimmed = buffer.toString('utf8').trim();
  if (trimmed.includes('-----BEGIN')) {
    return buffer;
  }
  const cleaned = trimmed.replace(/[^A-Za-z0-9+/=]/g, '');
  return Buffer.from(cleaned, 'base64');
}

async function loadAllTables(manifest, tempDir) {
  const tableNames = ['person', 'cohort', 'person_cohort', 'photo', 'person_photo', 'publication', 'archive_item'];
  const entries = await Promise.all(tableNames.map(async (tableName) => {
    const rows = await loadTable(manifest, tempDir, tableName);
    return [tableName, rows];
  }));
  return Object.fromEntries(entries);
}

function buildStatementsForImport(tables, manifest, context) {
  const statements = [
    'DELETE FROM person;',
    'DELETE FROM cohort;',
    'DELETE FROM person_cohort;',
    'DELETE FROM photo;',
    'DELETE FROM person_photo;',
    'DELETE FROM publication;',
    'DELETE FROM archive_item;',
    'DELETE FROM meta;',
    'DELETE FROM person_fts;',
  ];

  statements.push(
    ...buildInsert(
      'person',
      ['id', 'first_name', 'middle_name', 'last_name', 'suffix', 'display_name', 'slug', 'bio', 'is_faculty', 'created_at', 'updated_at'],
      tables.person,
    ),
  );

  statements.push(
    ...buildInsert('cohort', ['id', 'year', 'label'], tables.cohort),
  );

  statements.push(
    ...buildInsert('person_cohort', ['person_id', 'cohort_id', 'is_class_president', 'homeroom', 'notes'], tables.person_cohort),
  );

  statements.push(
    ...buildInsert('photo', ['id', 'sha256', 'ext', 'width', 'height', 'bytes', 'caption', 'credit', 'created_at'], tables.photo),
  );

  statements.push(
    ...buildInsert('person_photo', ['person_id', 'photo_id', 'kind', 'is_primary'], tables.person_photo),
  );

  statements.push(
    ...buildInsert('publication', ['id', 'title', 'issue_date', 'volume', 'number', 'slug', 'cover_photo_id', 'flipbook_manifest_path'], tables.publication),
  );

  statements.push(
    ...buildInsert('archive_item', ['id', 'title', 'year', 'kind', 'photo_id', 'flipbook_manifest_path', 'description'], tables.archive_item),
  );

  statements.push(`INSERT INTO meta (key, value) VALUES ('content_version', ${escapeValue(String(manifest.content_version))});`);
  statements.push(`INSERT INTO meta (key, value) VALUES ('pack_id', ${escapeValue(manifest.pack_id)});`);
  statements.push(`INSERT INTO meta (key, value) VALUES ('manifest_hash', ${escapeValue(context.manifestHash)});`);
  if (context.packSha256) {
    statements.push(`INSERT INTO meta (key, value) VALUES ('pack_sha256', ${escapeValue(context.packSha256)});`);
  }
  if (context.signatureBase64) {
    statements.push(`INSERT INTO meta (key, value) VALUES ('pack_signature', ${escapeValue(context.signatureBase64)});`);
  }
  statements.push(`INSERT INTO meta (key, value) VALUES ('imported_at', ${escapeValue(new Date().toISOString())});`);

  statements.push(`INSERT INTO person_fts(rowid, display_name, last_name, first_name)
    SELECT id, display_name, last_name, first_name FROM person;`);

  return statements;
}
