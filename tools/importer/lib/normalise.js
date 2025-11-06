import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { parseCsv } from './csv.js';
import { findTable } from './manifest.js';

const TABLE_NORMALISERS = {
  person: normalisePerson,
  cohort: normaliseCohort,
  person_cohort: normalisePersonCohort,
  photo: normalisePhoto,
  person_photo: normalisePersonPhoto,
  publication: normalisePublication,
  archive_item: normaliseArchiveItem,
};

export async function loadTable(manifest, rootDir, tableName) {
  const tableEntry = findTable(manifest, tableName);
  if (!tableEntry) {
    return [];
  }
  const filePath = path.join(rootDir, tableEntry.path.replace(/^\//, ''));
  let raw;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read ${tableName} table at ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const { records } = parseCsv(raw);
  const normaliser = TABLE_NORMALISERS[tableName];
  if (!normaliser) {
    return records;
  }
  return records.map(normaliser).filter(Boolean);
}

function emptyToNull(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  if (trimmed === '') {
    return null;
  }
  return trimmed;
}

function parseBoolean(value) {
  const trimmed = String(value ?? '').trim().toLowerCase();
  if (trimmed === '1' || trimmed === 'true' || trimmed === 'yes') {
    return true;
  }
  if (trimmed === '0' || trimmed === 'false' || trimmed === 'no') {
    return false;
  }
  return null;
}

function parseNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  if (trimmed === '') {
    return null;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalisePerson(record) {
  const isFaculty = parseBoolean(record.is_faculty);
  const now = new Date().toISOString();
  return {
    id: record.id || generateDeterministicId(record.slug || record.display_name),
    first_name: emptyToNull(record.first_name),
    middle_name: emptyToNull(record.middle_name),
    last_name: emptyToNull(record.last_name),
    suffix: emptyToNull(record.suffix),
    display_name: record.display_name?.trim() || buildDisplayName(record),
    slug: record.slug?.trim() || slugify(buildDisplayName(record)),
    bio: emptyToNull(record.bio),
    is_faculty: isFaculty === null ? 0 : (isFaculty ? 1 : 0),
    created_at: record.created_at?.trim() || now,
    updated_at: record.updated_at?.trim() || now,
  };
}

function buildDisplayName(record) {
  const parts = [record.first_name, record.middle_name, record.last_name, record.suffix]
    .map((part) => (part ? part.trim() : ''))
    .filter((part) => part.length > 0);
  return parts.join(' ').trim();
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function generateDeterministicId(seed) {
  if (!seed) {
    return `auto-${Math.random().toString(36).slice(2, 10)}`;
  }
  return `auto-${Buffer.from(seed).toString('hex').slice(0, 16)}`;
}

function normaliseCohort(record) {
  return {
    id: record.id || generateDeterministicId(record.year || record.label),
    year: parseNumber(record.year) ?? null,
    label: record.label?.trim() || (record.year ? `Class of ${record.year}` : null),
  };
}

function normalisePersonCohort(record) {
  const isPresident = parseBoolean(record.is_class_president);
  return {
    person_id: record.person_id?.trim(),
    cohort_id: record.cohort_id?.trim(),
    is_class_president: isPresident === null ? 0 : (isPresident ? 1 : 0),
    homeroom: emptyToNull(record.homeroom),
    notes: emptyToNull(record.notes),
  };
}

function normalisePhoto(record) {
  return {
    id: record.id || generateDeterministicId(record.sha256),
    sha256: record.sha256?.trim(),
    ext: (record.ext?.trim() || '').replace('.', '').toLowerCase(),
    width: parseNumber(record.width),
    height: parseNumber(record.height),
    bytes: parseNumber(record.bytes),
    caption: emptyToNull(record.caption),
    credit: emptyToNull(record.credit),
    created_at: record.created_at?.trim() || null,
  };
}

function normalisePersonPhoto(record) {
  const isPrimary = parseBoolean(record.is_primary);
  return {
    person_id: record.person_id?.trim(),
    photo_id: record.photo_id?.trim(),
    kind: record.kind?.trim() || 'portrait',
    is_primary: isPrimary === null ? 0 : (isPrimary ? 1 : 0),
  };
}

function normalisePublication(record) {
  return {
    id: record.id?.trim() || generateDeterministicId(record.slug || record.title),
    title: record.title?.trim() || 'Untitled Publication',
    issue_date: emptyToNull(record.issue_date),
    volume: emptyToNull(record.volume),
    number: emptyToNull(record.number),
    slug: record.slug?.trim() || slugify(record.title ?? 'publication'),
    cover_photo_id: emptyToNull(record.cover_photo_id),
    flipbook_manifest_path: emptyToNull(record.flipbook_manifest_path),
  };
}

function normaliseArchiveItem(record) {
  return {
    id: record.id?.trim() || generateDeterministicId(record.slug || record.title),
    title: record.title?.trim() || 'Archive Item',
    year: parseNumber(record.year),
    kind: (record.kind?.trim() || 'photo').toLowerCase(),
    photo_id: emptyToNull(record.photo_id),
    flipbook_manifest_path: emptyToNull(record.flipbook_manifest_path),
    description: emptyToNull(record.description),
  };
}
