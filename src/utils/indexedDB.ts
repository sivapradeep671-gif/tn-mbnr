// Compatibility adapter re-exporting from src/db/indexedDB.ts
export * from '../db/indexedDB';

import { addToSyncQueue as dbAddToSyncQueue, getPendingSyncQueue } from '../db/indexedDB';

export interface SyncAction {
    id: string;
    type: 'CERTIFY' | 'REPORT' | 'TAX_PAYMENT' | 'INSPECTION' | 'MARKETPLACE_LISTING';
    payload: any;
    timestamp: number;
}

export const addToQueue = async (action: SyncAction): Promise<void> => {
    await dbAddToSyncQueue({
        id: action.id,
        type: action.type,
        payload: action.payload,
        max_attempts: 5
    });
};

export const getQueue = async (): Promise<SyncAction[]> => {
    const pending = await getPendingSyncQueue();
    return pending.map(item => ({
        id: item.id,
        type: item.type as SyncAction['type'],
        payload: item.payload,
        timestamp: item.created_at
    }));
};
