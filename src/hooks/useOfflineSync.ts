// TN-MBNR Offline Sync Hook
// Connects UI components to NetworkManager, SyncManager, and IndexedDB

import { useState, useEffect, useCallback } from 'react';
import { networkManager, type NetworkState } from '../utils/networkManager';
import { syncManager } from '../services/syncManager';
import { addToSyncQueue as dbAddToSyncQueue, type SyncQueueItem } from '../db/indexedDB';
import { showToast } from './useToast';

export const useOfflineSync = () => {
    const [networkState, setNetworkState] = useState<NetworkState>(networkManager.getState());
    const [syncQueueLength, setSyncQueueLength] = useState<number>(0);

    useEffect(() => {
        const unsubscribeNetwork = networkManager.subscribe(state => {
            setNetworkState(state);
        });

        const unsubscribeSync = syncManager.subscribe(length => {
            setSyncQueueLength(length);
        });

        return () => {
            unsubscribeNetwork();
            unsubscribeSync();
        };
    }, []);

    const addToSyncQueue = useCallback(async (
        type: SyncQueueItem['type'],
        payload: unknown,
        customIdempotencyKey?: string
    ) => {
        try {
            const item = await dbAddToSyncQueue({
                type,
                payload,
                idempotency_key: customIdempotencyKey || `idemp-${crypto.randomUUID()}`,
                max_attempts: 5
            });

            if (!networkManager.isOnline()) {
                showToast(`Offline Mode: Action (${type}) queued locally.`, 'info');
            } else {
                // Trigger background sync attempt
                syncManager.triggerSync();
            }
            return item;
        } catch (error) {
            console.error('Failed to add to IndexedDB sync queue:', error);
            showToast('Failed to queue offline action. Storage error.', 'error');
            throw error;
        }
    }, []);

    const processQueue = useCallback(async () => {
        await syncManager.triggerSync();
    }, []);

    return {
        isOnline: networkState === 'ONLINE' || networkState === 'SYNCING',
        networkState,
        syncQueueLength,
        addToSyncQueue,
        processQueue
    };
};
