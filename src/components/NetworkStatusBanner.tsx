// TN-MBNR Global Network & Data Freshness Status Banner
// Provides bilingual (English & Tamil) UI indicator for connectivity and local cache status

import React, { useState, useEffect } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useLanguage } from '../context/LanguageContext';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface NetworkStatusBannerProps {
    lastSyncedAt?: number | null;
    className?: string;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({ lastSyncedAt, className = '' }) => {
    const { networkState, syncQueueLength, processQueue } = useOfflineSync();
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(interval);
    }, []);

    const formatTimeAgo = (timestamp?: number | null): string => {
        if (!timestamp) return isTamil ? 'தெரியவில்லை' : 'Unknown';
        const minsAgo = Math.max(0, Math.floor((now - timestamp) / 60000));
        if (minsAgo < 1) return isTamil ? 'இப்போதுதான்' : 'Just now';
        return isTamil ? `${minsAgo} நிமிடங்களுக்கு முன்` : `${minsAgo}m ago`;
    };

    const timeAgoStr = formatTimeAgo(lastSyncedAt);

    if (networkState === 'ONLINE' && syncQueueLength === 0) {
        return (
            <div className={`bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-300 text-xs px-4 py-1.5 flex items-center justify-between shadow-sm ${className}`}>
                <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-medium">
                        🟢 {isTamil ? 'ஆன்லைன் — நேரலை தரவு' : 'ONLINE — Live Data'}
                    </span>
                </div>
                <div className="flex items-center space-x-3 text-emerald-400/80">
                    <span>{isTamil ? `ஒத்திசைக்கப்பட்டது: ${timeAgoStr}` : `Synced: ${timeAgoStr}`}</span>
                </div>
            </div>
        );
    }

    if (networkState === 'SYNCING') {
        return (
            <div className={`bg-blue-950/80 border-b border-blue-500/30 text-blue-300 text-xs px-4 py-1.5 flex items-center justify-between shadow-sm ${className}`}>
                <div className="flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    <span className="font-medium">
                        🔄 {isTamil ? 'ஒத்திசைக்கப்படுகிறது...' : 'SYNCING...'} ({syncQueueLength} {isTamil ? 'நிலுவையில்' : 'pending'})
                    </span>
                </div>
            </div>
        );
    }

    if (networkState === 'DEGRADED') {
        return (
            <div className={`bg-amber-950/90 border-b border-amber-500/40 text-amber-300 text-xs px-4 py-1.5 flex items-center justify-between shadow-sm ${className}`}>
                <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-medium">
                        🟡 {isTamil ? 'வரையறுக்கப்பட்ட சேவை — அதிக தாமதம்' : 'DEGRADED SERVICE — High Latency'}
                    </span>
                </div>
                <button
                    onClick={processQueue}
                    className="hover:underline flex items-center space-x-1 text-amber-200"
                >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isTamil ? 'மீண்டும் முயற்சி' : 'Retry'}</span>
                </button>
            </div>
        );
    }

    // OFFLINE State
    return (
        <div className={`bg-rose-950/90 border-b border-rose-500/40 text-rose-300 text-xs px-4 py-2 flex items-center justify-between shadow-md ${className}`}>
            <div className="flex items-center space-x-2">
                <WifiOff className="w-4 h-4 text-rose-400" />
                <div>
                    <span className="font-semibold">
                        🔴 {isTamil ? 'ஆஃப்லைன்' : 'OFFLINE'}
                    </span>
                    <span className="ml-2 text-rose-300/80">
                        — {isTamil ? `கடைசியாக ${timeAgoStr} ஒத்திசைக்கப்பட்டது` : `Last synced ${timeAgoStr}`}
                    </span>
                </div>
            </div>

            <div className="flex items-center space-x-3">
                {syncQueueLength > 0 && (
                    <span className="bg-rose-900/80 border border-rose-600/50 text-rose-200 px-2 py-0.5 rounded font-mono text-[10px]">
                        {syncQueueLength} {isTamil ? 'வரிசையில்' : 'queued'}
                    </span>
                )}
                <button
                    onClick={processQueue}
                    className="bg-rose-900/50 hover:bg-rose-800/80 text-rose-100 border border-rose-700/50 px-2 py-1 rounded text-[11px] flex items-center space-x-1 transition-colors"
                >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isTamil ? 'ஒத்திசை' : 'Sync'}</span>
                </button>
            </div>
        </div>
    );
};
