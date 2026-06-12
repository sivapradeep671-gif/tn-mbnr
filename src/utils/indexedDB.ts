// A lightweight wrapper for IndexedDB to store offline sync queues

const DB_NAME = 'tn_mbnr_offline_sync';
const DB_VERSION = 1;
const STORE_NAME = 'sync_queue';

export interface SyncAction {
    id: string;
    type: 'CERTIFY' | 'REPORT' | 'TAX_PAYMENT' | 'INSPECTION' | 'MARKETPLACE_LISTING';
    payload: any;
    timestamp: number;
}

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event: any) => {
            resolve(event.target.result);
        };

        request.onerror = (event: any) => {
            reject(event.target.error);
        };
    });
};

export const addToQueue = async (action: SyncAction): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(action);

        request.onsuccess = () => resolve();
        request.onerror = (e: any) => reject(e.target.error);
    });
};

export const getQueue = async (): Promise<SyncAction[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (e: any) => reject(e.target.error);
    });
};

export const removeFromQueue = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (e: any) => reject(e.target.error);
    });
};

export const clearQueue = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = (e: any) => reject(e.target.error);
    });
};
