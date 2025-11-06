import type { AlumniRecord } from '@/types/alumni';

const DB_NAME = 'virtual-gallery-alumni';
const STORE_NAME = 'alumni';
const DB_VERSION = 1;
const FULL_NAME_INDEX = 'by_full_name';

const memoryStore = new Map<string, AlumniRecord>();
let dbPromise: Promise<IDBDatabase> | null = null;

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

async function openDatabase(): Promise<IDBDatabase | null> {
  if (!hasIndexedDb()) {
    return null;
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex(FULL_NAME_INDEX, 'full_name', { unique: true });
        } else {
          const store = request.transaction?.objectStore(STORE_NAME);
          if (store && !store.indexNames.contains(FULL_NAME_INDEX)) {
            store.createIndex(FULL_NAME_INDEX, 'full_name', { unique: true });
          }
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open alumni database'));
    });
  }

  try {
    return await dbPromise;
  } catch (error) {
    console.error('Unable to open IndexedDB. Falling back to in-memory store.', error);
    return null;
  }
}

function sortRecords(records: AlumniRecord[]): AlumniRecord[] {
  return records
    .slice()
    .sort((a, b) => {
      const yearA = typeof a.class_year === 'number' ? a.class_year : -Infinity;
      const yearB = typeof b.class_year === 'number' ? b.class_year : -Infinity;
      if (yearA !== yearB) {
        return yearB - yearA;
      }
      return a.full_name.localeCompare(b.full_name);
    });
}

export async function getAllAlumni(): Promise<AlumniRecord[]> {
  const db = await openDatabase();
  if (!db) {
    return sortRecords(Array.from(memoryStore.values()));
  }

  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const records = await requestToPromise(store.getAll());
  await transactionComplete(tx);
  return sortRecords(records as AlumniRecord[]);
}

export async function getAlumnusByFullName(fullName: string): Promise<AlumniRecord | null> {
  const db = await openDatabase();
  if (!db) {
    for (const record of memoryStore.values()) {
      if (record.full_name === fullName) {
        return record;
      }
    }
    return null;
  }

  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  let record: AlumniRecord | undefined;
  try {
    const index = store.index(FULL_NAME_INDEX);
    record = (await requestToPromise(index.get(fullName))) as AlumniRecord | undefined;
  } catch (error) {
    console.warn('Failed to look up alumni by full name, falling back to scan.', error);
    const all = (await requestToPromise(store.getAll())) as AlumniRecord[];
    record = all.find((item) => item.full_name === fullName);
  }
  await transactionComplete(tx);
  return record ?? null;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `alum-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveAlumnus(record: AlumniRecord): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    memoryStore.set(record.id, record);
    return;
  }

  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.put(record);
  await transactionComplete(tx);
}

export async function upsertAlumnus(
  data: Omit<AlumniRecord, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
    created_at?: string | null;
    updated_at?: string | null;
  }
): Promise<AlumniRecord> {
  const existing = data.id
    ? await getAlumnusById(data.id)
    : await getAlumnusByFullName(data.full_name);

  const now = new Date().toISOString();
  const record: AlumniRecord = {
    id: existing?.id ?? generateId(),
    full_name: data.full_name,
    title: data.title ?? null,
    class_year: typeof data.class_year === 'number' ? data.class_year : null,
    bio: data.bio ?? null,
    photo_url: data.photo_url ?? existing?.photo_url ?? null,
    created_at: existing?.created_at ?? data.created_at ?? now,
    updated_at: data.updated_at ?? now,
  };

  await saveAlumnus(record);
  return record;
}

export async function getAlumnusById(id: string): Promise<AlumniRecord | null> {
  const db = await openDatabase();
  if (!db) {
    return memoryStore.get(id) ?? null;
  }

  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const record = (await requestToPromise(store.get(id))) as AlumniRecord | undefined;
  await transactionComplete(tx);
  return record ?? null;
}
