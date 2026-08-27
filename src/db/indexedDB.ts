// TN-MBNR Multi-Store IndexedDB Persistence Layer
// Supports offline caching, freshness metadata, sync queue lifecycle, and security metadata

export const DB_NAME = 'tn_mbnr_offline_db_v2';
export const DB_VERSION = 2;

export const STORES = {
    BUSINESSES: 'businesses',
    LICENSES: 'licenses',
    BUSINESS_SEARCH: 'business_search',
    VERIFICATION_HISTORY: 'verification_history',
    APP_CONFIG: 'app_config',
    SYNC_QUEUE: 'sync_queue',
    SYNC_METADATA: 'sync_metadata',
} as const;

export interface CachedRecord<T = unknown> {
    id: string;
    data: T;
    cached_at: number;
    expires_at: number;
    version: number;
    source: 'SERVER' | 'CACHE' | 'OFFLINE_GENERATED';
    last_synced_at: number;
}

export type FreshnessStatus = 'FRESH' | 'STALE' | 'EXPIRED' | 'OFFLINE';

export interface SyncQueueItem {
    id: string;
    type: 'CERTIFY' | 'REPORT' | 'INSPECTION' | 'MARKETPLACE_LISTING' | 'TAX_PAYMENT' | 'MUTATION';
    payload: unknown;
    created_at: number;
    idempotency_key: string;
    attempts: number;
    max_attempts: number;
    next_attempt_at: number;
    status: 'PENDING' | 'SYNCING' | 'SUCCESS' | 'FAILED' | 'DEAD_LETTER';
    error_reason?: string;
}

export interface VerificationHistoryEntry {
    id: string;
    business_id?: string;
    trade_name?: string;
    timestamp: number;
    result: 'LIVE_VERIFIED' | 'OFFLINE_CRYPTOGRAPHICALLY_VERIFIED' | 'OFFLINE_HISTORICAL_RESULT' | 'PENDING_SYNC' | 'VERIFICATION_UNAVAILABLE' | 'COUNTERFEIT';
    source: 'SERVER' | 'OFFLINE_CRYPTO' | 'CACHE';
    sync_status: 'SYNCED' | 'PENDING' | 'FAILED';
    latitude?: number;
    longitude?: number;
    signature_valid?: boolean;
}

// In-memory fallback for test/SSR environments where IndexedDB is unavailable
const memoryStores: Record<string, Map<string, unknown>> = {
    [STORES.BUSINESSES]: new Map(),
    [STORES.LICENSES]: new Map(),
    [STORES.BUSINESS_SEARCH]: new Map(),
    [STORES.VERIFICATION_HISTORY]: new Map(),
    [STORES.APP_CONFIG]: new Map(),
    [STORES.SYNC_QUEUE]: new Map(),
    [STORES.SYNC_METADATA]: new Map(),
};

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            return reject(new Error('IndexedDB unavailable in non-browser environment'));
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request.onupgradeneeded = (event: any) => {
            const db: IDBDatabase = event.target.result;

            if (!db.objectStoreNames.contains(STORES.BUSINESSES)) {
                db.createObjectStore(STORES.BUSINESSES, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.LICENSES)) {
                db.createObjectStore(STORES.LICENSES, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.BUSINESS_SEARCH)) {
                db.createObjectStore(STORES.BUSINESS_SEARCH, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.VERIFICATION_HISTORY)) {
                db.createObjectStore(STORES.VERIFICATION_HISTORY, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.APP_CONFIG)) {
                db.createObjectStore(STORES.APP_CONFIG, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
                queueStore.createIndex('status', 'status', { unique: false });
                queueStore.createIndex('idempotency_key', 'idempotency_key', { unique: true });
            }
            if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
                db.createObjectStore(STORES.SYNC_METADATA, { keyPath: 'id' });
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request.onsuccess = (event: any) => resolve(event.target.result);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request.onerror = (event: any) => reject(event.target.error);
    });
};

// Generic store operations with safe memory fallback
export const setCachedRecord = async <T>(
    storeName: string,
    id: string,
    data: T,
    ttlMs: number = 24 * 60 * 60 * 1000,
    version: number = 1,
    source: 'SERVER' | 'CACHE' | 'OFFLINE_GENERATED' = 'SERVER'
): Promise<void> => {
    const now = Date.now();
    const record: CachedRecord<T> = {
        id,
        data,
        cached_at: now,
        expires_at: now + ttlMs,
        version,
        source,
        last_synced_at: now
    };

    if (memoryStores[storeName]) {
        memoryStores[storeName].set(id, record);
    }

    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(record);

            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    } catch {
        return Promise.resolve();
    }
};

export const getCachedRecord = async <T>(
    storeName: string,
    id: string
): Promise<CachedRecord<T> | null> => {
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve((request.result as CachedRecord<T>) || (memoryStores[storeName]?.get(id) as CachedRecord<T>) || null);
            request.onerror = () => resolve((memoryStores[storeName]?.get(id) as CachedRecord<T>) || null);
        });
    } catch {
        return (memoryStores[storeName]?.get(id) as CachedRecord<T>) || null;
    }
};

export const getAllCachedRecords = async <T>(
    storeName: string
): Promise<CachedRecord<T>[]> => {
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve((request.result as CachedRecord<T>[]) || (Array.from(memoryStores[storeName]?.values() || []) as CachedRecord<T>[]));
            request.onerror = () => resolve(Array.from(memoryStores[storeName]?.values() || []) as CachedRecord<T>[]);
        });
    } catch {
        return Array.from(memoryStores[storeName]?.values() || []) as CachedRecord<T>[];
    }
};

export const getFreshnessStatus = (record: CachedRecord | null): FreshnessStatus => {
    if (!record) return 'EXPIRED';
    const now = Date.now();
    const ageMs = now - record.cached_at;
    const FRESH_THRESHOLD = 15 * 60 * 1000;
    const STALE_THRESHOLD = 24 * 60 * 60 * 1000;

    if (ageMs <= FRESH_THRESHOLD) return 'FRESH';
    if (ageMs <= STALE_THRESHOLD) return 'STALE';
    return 'EXPIRED';
};

// Queue operations
export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'created_at' | 'attempts' | 'next_attempt_at' | 'status' | 'idempotency_key'> & { id?: string; idempotency_key?: string; max_attempts?: number }): Promise<SyncQueueItem> => {
    const newItem: SyncQueueItem = {
        id: item.id || crypto.randomUUID(),
        type: item.type,
        payload: item.payload,
        created_at: Date.now(),
        idempotency_key: item.idempotency_key || `idemp-${crypto.randomUUID()}`,
        attempts: 0,
        max_attempts: item.max_attempts || 5,
        next_attempt_at: Date.now(),
        status: 'PENDING'
    };

    if (memoryStores[STORES.SYNC_QUEUE]) {
        memoryStores[STORES.SYNC_QUEUE].set(newItem.id, newItem);
    }

    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
            const store = transaction.objectStore(STORES.SYNC_QUEUE);
            const request = store.put(newItem);

            request.onsuccess = () => resolve(newItem);
            request.onerror = () => resolve(newItem);
        });
    } catch {
        return newItem;
    }
};

export const getPendingSyncQueue = async (): Promise<SyncQueueItem[]> => {
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(STORES.SYNC_QUEUE, 'readonly');
            const store = transaction.objectStore(STORES.SYNC_QUEUE);
            const request = store.getAll();

            request.onsuccess = () => {
                const allItems: SyncQueueItem[] = (request.result as SyncQueueItem[]) || (Array.from(memoryStores[STORES.SYNC_QUEUE]?.values() || []) as SyncQueueItem[]);
                const now = Date.now();
                const pending = allItems.filter(
                    i => (i.status === 'PENDING' || i.status === 'FAILED') && i.next_attempt_at <= now && i.attempts < i.max_attempts
                );
                resolve(pending);
            };
            request.onerror = () => {
                const allItems: SyncQueueItem[] = Array.from(memoryStores[STORES.SYNC_QUEUE]?.values() || []) as SyncQueueItem[];
                const now = Date.now();
                resolve(allItems.filter(i => (i.status === 'PENDING' || i.status === 'FAILED') && i.next_attempt_at <= now && i.attempts < i.max_attempts));
            };
        });
    } catch {
        const allItems: SyncQueueItem[] = Array.from(memoryStores[STORES.SYNC_QUEUE]?.values() || []) as SyncQueueItem[];
        const now = Date.now();
        return allItems.filter(
            i => (i.status === 'PENDING' || i.status === 'FAILED') && i.next_attempt_at <= now && i.attempts < i.max_attempts
        );
    }
};

export const updateQueueItem = async (item: SyncQueueItem): Promise<void> => {
    if (memoryStores[STORES.SYNC_QUEUE]) {
        memoryStores[STORES.SYNC_QUEUE].set(item.id, item);
    }
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
            const store = transaction.objectStore(STORES.SYNC_QUEUE);
            const request = store.put(item);

            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    } catch {
        return Promise.resolve();
    }
};

export const removeFromQueue = async (id: string): Promise<void> => {
    if (memoryStores[STORES.SYNC_QUEUE]) {
        memoryStores[STORES.SYNC_QUEUE].delete(id);
    }
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
            const store = transaction.objectStore(STORES.SYNC_QUEUE);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    } catch {
        return Promise.resolve();
    }
};

export const clearQueue = async (): Promise<void> => {
    if (memoryStores[STORES.SYNC_QUEUE]) {
        memoryStores[STORES.SYNC_QUEUE].clear();
    }
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
            const store = transaction.objectStore(STORES.SYNC_QUEUE);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    } catch {
        return Promise.resolve();
    }
};

// Verification History helpers
export const recordVerificationHistory = async (entry: Omit<VerificationHistoryEntry, 'id' | 'timestamp'> & { id?: string }): Promise<void> => {
    const fullEntry: VerificationHistoryEntry = {
        id: entry.id || `verif-${crypto.randomUUID()}`,
        timestamp: Date.now(),
        ...entry
    };

    if (memoryStores[STORES.VERIFICATION_HISTORY]) {
        memoryStores[STORES.VERIFICATION_HISTORY].set(fullEntry.id, fullEntry);
    }

    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(STORES.VERIFICATION_HISTORY, 'readwrite');
            const store = transaction.objectStore(STORES.VERIFICATION_HISTORY);
            const request = store.put(fullEntry);

            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    } catch {
        return Promise.resolve();
    }
};

export const getVerificationHistory = async (): Promise<VerificationHistoryEntry[]> => {
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(STORES.VERIFICATION_HISTORY, 'readonly');
            const store = transaction.objectStore(STORES.VERIFICATION_HISTORY);
            const request = store.getAll();

            request.onsuccess = () => {
                const list: VerificationHistoryEntry[] = (request.result as VerificationHistoryEntry[]) || (Array.from(memoryStores[STORES.VERIFICATION_HISTORY]?.values() || []) as VerificationHistoryEntry[]);
                list.sort((a, b) => b.timestamp - a.timestamp);
                resolve(list);
            };
            request.onerror = () => {
                const list = Array.from(memoryStores[STORES.VERIFICATION_HISTORY]?.values() || []) as VerificationHistoryEntry[];
                list.sort((a, b) => b.timestamp - a.timestamp);
                resolve(list);
            };
        });
    } catch {
        const list = Array.from(memoryStores[STORES.VERIFICATION_HISTORY]?.values() || []) as VerificationHistoryEntry[];
        list.sort((a, b) => b.timestamp - a.timestamp);
        return list;
    }
};

export const clearAllCachedStores = async (): Promise<void> => {
    Object.values(memoryStores).forEach(map => map.clear());
    try {
        const db = await initDB();
        const storeNames = Object.values(STORES);
        const transaction = db.transaction(storeNames, 'readwrite');
        storeNames.forEach(storeName => {
            transaction.objectStore(storeName).clear();
        });
    } catch {
        // ignore
    }
};
