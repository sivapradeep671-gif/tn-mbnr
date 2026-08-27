// TN-MBNR SyncManager Service
// Handles offline sync queue execution, exponential backoff, dead letter queue, and server reconciliation

import { 
    getPendingSyncQueue, 
    updateQueueItem, 
    removeFromQueue, 
    STORES, 
    setCachedRecord, 
    type SyncQueueItem 
} from '../db/indexedDB';
import { api, ApiError } from '../api/client';
import { networkManager } from '../utils/networkManager';
import { showToast } from '../hooks/useToast';

class SyncManager {
    private isProcessing: boolean = false;
    private listeners: Set<(queueLength: number) => void> = new Set();

    constructor() {
        this.initNetworkListener();
    }

    private initNetworkListener() {
        networkManager.subscribe(state => {
            if (state === 'ONLINE') {
                this.triggerSync();
            }
        });
    }

    public subscribe(listener: (queueLength: number) => void): () => void {
        this.listeners.add(listener);
        this.notifyListeners();
        return () => {
            this.listeners.delete(listener);
        };
    }

    private async notifyListeners() {
        try {
            const pending = await getPendingSyncQueue();
            this.listeners.forEach(fn => fn(pending.length));
        } catch {
            this.listeners.forEach(fn => fn(0));
        }
    }

    public async triggerSync(): Promise<void> {
        if (this.isProcessing || !networkManager.isOnline()) {
            return;
        }

        this.isProcessing = true;
        networkManager.setSyncing(true);

        try {
            const pendingItems = await getPendingSyncQueue();
            if (pendingItems.length === 0) {
                this.isProcessing = false;
                networkManager.setSyncing(false);
                this.notifyListeners();
                return;
            }

            showToast(`Synchronizing ${pendingItems.length} queued offline item(s)...`, 'info');

            for (const item of pendingItems) {
                if (!networkManager.isOnline()) break;
                await this.processItem(item);
            }

            const remaining = await getPendingSyncQueue();
            if (remaining.length === 0 && pendingItems.length > 0) {
                showToast('All offline transactions synchronized successfully.', 'success');
            }
        } catch (err) {
            console.error('[SyncManager] Execution error:', err);
        } finally {
            this.isProcessing = false;
            networkManager.setSyncing(false);
            this.notifyListeners();
        }
    }

    private async processItem(item: SyncQueueItem): Promise<void> {
        item.status = 'SYNCING';
        item.attempts += 1;
        await updateQueueItem(item);

        try {
            let result: unknown = null;

            switch (item.type) {
                case 'CERTIFY': {
                    result = await api.post<{ data: { id: string } }>('/v1/license/register', item.payload, {
                        idempotencyKey: item.idempotency_key
                    });
                    const resData = result as { data?: { id: string } };
                    if (resData && resData.data) {
                        await setCachedRecord(STORES.BUSINESSES, resData.data.id, resData.data);
                    }
                    break;
                }

                case 'INSPECTION': {
                    const data = item.payload as { businessId: string; status: string; hash?: string };
                    result = await api.put(`/v1/license/admin/status`, {
                        businessId: data.businessId,
                        status: data.status,
                        inspectorHash: data.hash
                    }, {
                        idempotencyKey: item.idempotency_key
                    });
                    break;
                }

                case 'REPORT': {
                    result = await api.post('/v1/citizen/report', item.payload, {
                        idempotencyKey: item.idempotency_key
                    });
                    break;
                }

                case 'MARKETPLACE_LISTING': {
                    result = await api.post('/v1/marketplace/listings', item.payload, {
                        idempotencyKey: item.idempotency_key
                    });
                    break;
                }

                case 'MUTATION':
                default: {
                    const mutPayload = item.payload as { url?: string; method?: string; data?: unknown };
                    if (mutPayload && mutPayload.url && mutPayload.method) {
                        const method = mutPayload.method.toLowerCase();
                        if (method === 'post') {
                            result = await api.post(mutPayload.url, mutPayload.data, { idempotencyKey: item.idempotency_key });
                        } else if (method === 'put') {
                            result = await api.put(mutPayload.url, mutPayload.data, { idempotencyKey: item.idempotency_key });
                        }
                    }
                    break;
                }
            }

            // Successfully synchronized
            item.status = 'SUCCESS';
            await removeFromQueue(item.id);

        } catch (err: unknown) {
            const isClientError = err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 429;
            item.error_reason = err instanceof Error ? err.message : 'Network / Server Error';

            if (isClientError || item.attempts >= item.max_attempts) {
                // Permanent failure -> Move to DEAD_LETTER
                item.status = 'DEAD_LETTER';
                await updateQueueItem(item);
                showToast(`Sync failed for item (${item.type}): ${item.error_reason}`, 'error');
            } else {
                // Temporary failure -> Retry with exponential backoff + jitter
                item.status = 'FAILED';
                const backoffSeconds = Math.min(300, Math.pow(2, item.attempts) + Math.random() * 2);
                item.next_attempt_at = Date.now() + backoffSeconds * 1000;
                await updateQueueItem(item);
            }
        }
    }
}

export const syncManager = new SyncManager();
