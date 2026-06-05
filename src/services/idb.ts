// Tiny IndexedDB wrapper for the per-profile override store. Avoids the 5 MB
// localStorage quota that bites once a user has more than a handful of post
// drafts or highlights with embedded image data URLs.

const DB_NAME = 'ig-sandbox';
const DB_VERSION = 1;
const STORE = 'profiles';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'username' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
    req.onblocked = () => {
      // Another tab is holding an older version open. We never bump version,
      // so this shouldn't fire in practice — log and move on.
      console.warn('IDB upgrade blocked by another tab');
    };
  });
  return dbPromise;
}

export async function idbGetProfile<T>(username: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(username);
      req.onsuccess = () => {
        const row = req.result as { username: string; data: T } | undefined;
        resolve(row?.data ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IDB read failed:', e);
    return null;
  }
}

export async function idbSetProfile<T>(
  username: string,
  data: T,
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ username, data });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IDB write failed:', e);
  }
}

export async function idbDeleteProfile(username: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(username);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IDB delete failed:', e);
  }
}
