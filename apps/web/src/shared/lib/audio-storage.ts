'use client';

const DB_NAME = 'aepsy-audio-db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_blobs';

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Cannot open IndexedDB.'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const database = await openAudioDb();

  return await new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));

    transaction.oncomplete = () => {
      database.close();
    };

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
      database.close();
    };
  });
}

export async function saveAudioBlob(blob: Blob, key?: string) {
  const audioStorageKey = key ?? `audio-${Date.now()}`;
  await withStore('readwrite', (store) => store.put(blob, audioStorageKey));
  return audioStorageKey;
}

export async function getAudioBlob(key: string) {
  const blob = await withStore('readonly', (store) => store.get(key));
  return blob instanceof Blob ? blob : null;
}

export async function deleteAudioBlob(key: string) {
  await withStore('readwrite', (store) => store.delete(key));
}
