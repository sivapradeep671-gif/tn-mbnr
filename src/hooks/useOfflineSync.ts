import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { showToast } from './useToast';
import { addToQueue, getQueue, removeFromQueue, type SyncAction } from '../utils/indexedDB';

export const useOfflineSync = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncQueueLength, setSyncQueueLength] = useState<number>(0);

    const refreshQueueLength = useCallback(async () => {
        try {
            const queue = await getQueue();
            setSyncQueueLength(queue.length);
        } catch (e) {
            console.error("Failed to read IndexedDB", e);
        }
    }, []);

    useEffect(() => {
        refreshQueueLength();
    }, [refreshQueueLength]);

    // Monitor Online Status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            showToast('Connectivity Restored. Synchronizing records...', 'success');
            processQueue();
        };
        const handleOffline = () => {
            setIsOnline(false);
            showToast('Operating in Offline Mode. Actions will be queued.', 'warning');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const processQueue = useCallback(async () => {
        if (!isOnline) return;

        try {
            const queue = await getQueue();
            if (queue.length === 0) return;

            // Process sequentially to maintain ledger integrity
            for (const action of queue) {
                try {
                    // Map actions to real API calls
                    switch (action.type) {
                        case 'INSPECTION': {
                            const data = action.payload as { businessId: string; status: string; hash?: string };
                            await api.put(`/v1/license/admin/status`, { 
                                businessId: data.businessId,
                                status: data.status,
                                inspectorHash: data.hash 
                            });
                            break;
                        }
                        case 'REPORT':
                            await api.post('/v1/citizen/report', action.payload);
                            break;
                        case 'CERTIFY':
                            await api.post('/v1/license/register', action.payload);
                            break;
                        case 'MARKETPLACE_LISTING':
                            await api.post('/v1/marketplace/listings', action.payload);
                            break;
                        default:
                            console.log(`Processing simulated sync for ${action.type}`);
                    }

                    // Remove only the successfully processed item
                    await removeFromQueue(action.id);
                    await refreshQueueLength();

                } catch (error) {
                    console.error(`Sync failed for ${action.id}:`, error);
                    // Stop processing rest of the queue if we hit a network error
                    break; 
                }
            }

            const remaining = await getQueue();
            if (queue.length > 0 && remaining.length === 0) {
                showToast(`Ledger synchronization complete.`, 'success');
            }
        } catch (error) {
            console.error("Failed to process queue from IndexedDB", error);
        }
    }, [isOnline, refreshQueueLength]);

    const addToSyncQueue = useCallback(async (type: SyncAction['type'], payload: unknown) => {
        const newAction: SyncAction = {
            id: crypto.randomUUID(),
            type,
            payload,
            timestamp: Date.now()
        };

        try {
            await addToQueue(newAction);
            await refreshQueueLength();
            
            if (!isOnline) {
                showToast(`Offline: ${type} queued securely for later sync.`, 'info');
            } else {
                // Trigger background sync attempt
                processQueue();
            }
        } catch (error) {
            console.error("Failed to add to IndexedDB queue", error);
            showToast('Failed to queue offline action. Storage error.', 'error');
        }
    }, [isOnline, processQueue, refreshQueueLength]);

    // Attempt to process queue whenever coming online
    useEffect(() => {
        if (isOnline && syncQueueLength > 0) {
            const timer = setTimeout(() => {
                processQueue();
            }, 2000); // Wait 2s for stable connection
            return () => clearTimeout(timer);
        }
    }, [isOnline, syncQueueLength, processQueue]);

    return {
        isOnline,
        syncQueueLength,
        addToSyncQueue,
        processQueue
    };
};
