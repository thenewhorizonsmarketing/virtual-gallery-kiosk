import path from 'node:path';
import { resolveContentPaths, DEFAULT_CONTENT_ROOT } from '../lib/paths.js';
import { runQuery } from '../lib/sqlite.js';
import { pathExists } from '../lib/fs.js';
import { logSuccess, logWarn } from '../lib/logger.js';

export async function checkIntegrity(options) {
  const contentRoot = options.contentRoot ? path.resolve(options.contentRoot) : DEFAULT_CONTENT_ROOT;
  const level = typeof options.level === 'string' ? options.level.toLowerCase() : 'basic';
  const paths = resolveContentPaths(contentRoot);
  const useStaged = options.staged === true || options.target === 'staged';
  const dbPath = useStaged ? (options.stagedDb ? path.resolve(options.stagedDb) : paths.stagedDb) : (options.activeDb ? path.resolve(options.activeDb) : paths.activeDb);

  if (!(await pathExists(dbPath))) {
    throw new Error(`Database not found at ${dbPath}`);
  }

  const report = {
    database: dbPath,
    level,
    people: {},
    cohorts: {},
    photos: {},
    flipbooks: {},
    meta: {},
    issues: [],
  };

  report.people.total = await scalar(dbPath, 'SELECT COUNT(*) as value FROM person;');
  const missingDisplay = await runQuery(dbPath, "SELECT id FROM person WHERE display_name IS NULL OR TRIM(display_name) = '' LIMIT 50;");
  if (missingDisplay.length > 0) {
    report.people.missingDisplayName = missingDisplay.map((row) => row.id);
    report.issues.push('Persons missing display_name');
  }

  report.cohorts.total = await scalar(dbPath, 'SELECT COUNT(*) as value FROM cohort;');
  const orphanCohorts = await runQuery(dbPath, `SELECT pc.person_id, pc.cohort_id FROM person_cohort pc
    LEFT JOIN person p ON p.id = pc.person_id
    LEFT JOIN cohort c ON c.id = pc.cohort_id
    WHERE p.id IS NULL OR c.id IS NULL
    LIMIT 50;`);
  if (orphanCohorts.length > 0) {
    report.cohorts.orphans = orphanCohorts;
    report.issues.push('Person-cohort relations referencing missing rows');
  }

  const photos = await runQuery(dbPath, 'SELECT id, sha256, ext FROM photo;');
  const missingPhotos = [];
  for (const row of photos) {
    if (!row.sha256) {
      missingPhotos.push({ id: row.id, reason: 'missing sha256' });
      continue;
    }
    const ext = row.ext ? row.ext.replace('.', '') : 'jpg';
    const filePath = path.join(paths.imagesDir, `${row.sha256}.${ext}`);
    if (!(await pathExists(filePath))) {
      missingPhotos.push({ id: row.id, sha256: row.sha256, expected: filePath });
    }
  }
  if (missingPhotos.length > 0) {
    report.photos.missingFiles = missingPhotos;
    report.issues.push('Missing image assets on disk');
  }
  report.photos.total = photos.length;

  const flipbookRefs = await runQuery(dbPath, `SELECT flipbook_manifest_path AS path FROM publication WHERE flipbook_manifest_path IS NOT NULL
    UNION
    SELECT flipbook_manifest_path AS path FROM archive_item WHERE flipbook_manifest_path IS NOT NULL;`);
  const missingFlipbooks = [];
  for (const row of flipbookRefs) {
    const manifestPath = typeof row.path === 'string' ? row.path.trim() : '';
    if (!manifestPath) continue;
    const relative = manifestPath.replace(/^\//, '');
    const filePath = path.join(contentRoot, relative);
    if (!(await pathExists(filePath))) {
      missingFlipbooks.push(filePath);
    }
  }
  if (missingFlipbooks.length > 0) {
    report.flipbooks.missingManifests = missingFlipbooks;
    report.issues.push('Missing flipbook manifests');
  }

  const metaRows = await runQuery(dbPath, 'SELECT key, value FROM meta;');
  report.meta.entries = Object.fromEntries(metaRows.map((row) => [row.key, row.value]));

  if (level === 'strict') {
    const duplicatePersonSlugs = await runQuery(dbPath, 'SELECT slug, COUNT(*) as count FROM person GROUP BY slug HAVING count > 1;');
    if (duplicatePersonSlugs.length > 0) {
      report.people.duplicateSlugs = duplicatePersonSlugs;
      report.issues.push('Duplicate person slugs detected');
    }
    const duplicatePhotos = await runQuery(dbPath, 'SELECT sha256, COUNT(*) as count FROM photo GROUP BY sha256 HAVING count > 1;');
    if (duplicatePhotos.length > 0) {
      report.photos.duplicateHashes = duplicatePhotos;
      report.issues.push('Duplicate photo sha256 entries');
    }
  }

  if (report.issues.length === 0) {
    logSuccess('Integrity checks passed.');
  } else {
    logWarn(`Integrity issues found: ${report.issues.join(', ')}`);
  }

  console.log(JSON.stringify(report, null, 2));
}

async function scalar(databasePath, query) {
  const rows = await runQuery(databasePath, query);
  if (!rows || rows.length === 0) {
    return 0;
  }
  const value = rows[0].value;
  const numberValue = typeof value === 'number' ? value : Number.parseInt(value, 10);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}
