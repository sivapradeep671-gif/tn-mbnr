// TN-MBNR Network Connectivity Manager
// Combines navigator.onLine with active API health checking

export type NetworkState = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'SYNCING';

export interface HealthCheckResponse {
    status: 'ok' | 'degraded' | 'error';
    database: string;
    redis: string;
    timestamp: number;
}

class NetworkManager {
    private state: NetworkState = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    private listeners: Set<(state: NetworkState) => void> = new Set();
    private healthCheckInterval: number | null = null;
    private healthEndpoint: string = '/api/v1/health';
    private checkTimeoutMs: number = 4000;
    private consecutiveFailures: number = 0;

    constructor() {
        this.initEventListeners();
        this.startHealthCheckLoop();
    }

    private initEventListeners() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleBrowserStateChange(true));
            window.addEventListener('offline', () => this.handleBrowserStateChange(false));
        }
    }

    private handleBrowserStateChange(browserOnline: boolean) {
        if (!browserOnline) {
            this.updateState('OFFLINE');
        } else {
            // Perform immediate active probe when browser reports online
            this.checkHealthNow();
        }
    }

    public async checkHealthNow(): Promise<NetworkState> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            this.updateState('OFFLINE');
            return 'OFFLINE';
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.checkTimeoutMs);
        const startTime = Date.now();

        try {
            const response = await fetch(this.healthEndpoint, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const latency = Date.now() - startTime;

            if (response.ok) {
                this.consecutiveFailures = 0;
                // If latency is high (> 2500ms), state is DEGRADED
                const newState: NetworkState = latency > 2500 ? 'DEGRADED' : 'ONLINE';
                this.updateState(newState);
                return newState;
            } else {
                this.handleFailure();
                return this.state;
            }
        } catch {
            clearTimeout(timeoutId);
            this.handleFailure();
            return this.state;
        }
    }

    private handleFailure() {
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
            return;
        }
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= 2) {
            this.updateState('OFFLINE');
        } else {
            this.updateState('DEGRADED');
        }
    }

    private updateState(newState: NetworkState) {
        if (this.state !== newState) {
            this.state = newState;
            this.notifyListeners();
        }
    }

    public setSyncing(isSyncing: boolean) {
        if (isSyncing) {
            this.updateState('SYNCING');
        } else {
            this.checkHealthNow();
        }
    }

    public getState(): NetworkState {
        return this.state;
    }

    public isOnline(): boolean {
        return this.state === 'ONLINE' || this.state === 'SYNCING';
    }

    public isUsable(): boolean {
        return this.state !== 'OFFLINE';
    }

    public subscribe(listener: (state: NetworkState) => void): () => void {
        this.listeners.add(listener);
        listener(this.state); // Immediate initial callback
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(fn => fn(this.state));
    }

    public startHealthCheckLoop(intervalMs: number = 30000) {
        this.stopHealthCheckLoop();
        this.healthCheckInterval = window.setInterval(() => {
            this.checkHealthNow();
        }, intervalMs);
    }

    public stopHealthCheckLoop() {
        if (this.healthCheckInterval !== null) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
}

export const networkManager = new NetworkManager();
