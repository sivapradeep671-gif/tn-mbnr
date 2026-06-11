import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Shield, CheckCircle, AlertTriangle, Trophy, Star, Zap, Smartphone, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Business } from '../types/types';
import { verifyMockToken } from '../utils/mockQR';
import { announceStatus } from '../utils/voiceUtils';
import { showToast } from '../hooks/useToast';
import type { ScanResult } from '../types/scan';
import { api } from '../api/client';
import { notificationService } from '../services/notificationService';

interface QRScannerProps {
    businesses: Business[];
}

export const QRScanner: React.FC<QRScannerProps> = ({ businesses }) => {
    const { t } = useLanguage();
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [xp, setXp] = useState(0);
    const [showArOverlay] = useState(true);
    const [smsSent, setSmsSent] = useState<string | null>(null);
    const [nfcSupported, setNfcSupported] = useState(false);
    const [nfcScanning, setNfcScanning] = useState(false);

    useEffect(() => {
        if ('NDEFReader' in window) {
            setNfcSupported(true);
        }
    }, []);

    const processScanData = async (decodedText: string, cleanup?: () => void) => {
        if (cleanup) cleanup();

        if (!navigator.geolocation) {
            const msg = "Enable location";
            setError(msg);
            showToast(msg, 'warning');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;

                // --- 1. V1 Production Server Verification ---
                try {
                    const serverResult = await api.get<any>(`/v1/license/verify/${decodedText}?lat=${latitude}&lng=${longitude}`);

                    // Map the V1 engine response to the local UI ScanResult type
                    const mappedResult: ScanResult = {
                        status: serverResult.status,
                        message: serverResult.message_en,
                        verifiedAt: new Date().toISOString(),
                        business: serverResult.merchant ? {
                            name: serverResult.merchant.trade_name,
                            id: serverResult.merchant.id,
                            lat: latitude,
                            lng: longitude
                        } : undefined
                    };

                    setScanResult(mappedResult);
                    handleScanResult(mappedResult);
                    
                } catch (serverError: any) {
                    // Handle 404 Counterfeit or network errors gracefully
                    if (serverError.message && serverError.message.includes('COUNTERFEIT')) {
                         const counterfeitResult: ScanResult = {
                             status: 'COUNTERFEIT',
                             message: "This QR code does not match any valid municipal record.",
                             verifiedAt: new Date().toISOString()
                         };
                         setScanResult(counterfeitResult);
                         handleScanResult(counterfeitResult);
                    } else {
                        const msg = "Service unavailable: " + (serverError.message || "Network Error");
                        setError(msg);
                        showToast(msg, 'error');
                    }
                }

            } catch {
                const msg = "Service unavailable";
                setError(msg);
                showToast(msg, 'error');
            }
        }, (err) => {
            console.error(err);
            const msg = "Enable location";
            setError(msg);
            showToast(msg, 'warning');
        });
    };

    const handleNFCScan = async () => {
        try {
            setNfcScanning(true);
            // @ts-ignore
            const ndef = new window.NDEFReader();
            await ndef.scan();
            showToast('NFC Ready. Tap device to business tag.', 'success');
            
            ndef.addEventListener("reading", ({ message }: any) => {
                for (const record of message.records) {
                    if (record.recordType === "text") {
                        const textDecoder = new TextDecoder(record.encoding);
                        const token = textDecoder.decode(record.data);
                        processScanData(token);
                        setNfcScanning(false);
                        break;
                    }
                }
            });
        } catch (error) {
            console.error("NFC Scan Error:", error);
            showToast("NFC scanning failed or blocked.", 'error');
            setNfcScanning(false);
        }
    };

    const handleScanResult = (result: ScanResult) => {
        if (result.status === 'VALID') {
            setXp(prev => prev + 50);
            if ('vibrate' in navigator) navigator.vibrate(100);
            announceStatus('VALID', result.business?.name);
            showToast('Scan Verified Successfully', 'success');
        } else {
            if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
            announceStatus(result.status, result.business?.name);

            if (result.status === 'COUNTERFEIT') {
                setSmsSent(`CMS Alert Sent to Owner: ${result.business?.name || 'Unknown Shop'}`);
                showToast('Potential Counterfeit Detected!', 'error');
                
                // Trigger real-time alert to merchant
                notificationService.alertOwner(
                    result.business?.name || "Emergency node",
                    "0000000001", // Mocked phone for demo
                    "Potential counterfeit QR scan attempt"
                );
                
                setTimeout(() => setSmsSent(null), 5000);
            } else {
                showToast(result.message, 'warning');
            }
        }
    };

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                videoConstraints: {
                    facingMode: { ideal: "environment" }
                }
            },
            false
        );

        const onScanSuccess = async (decodedText: string) => {
            processScanData(decodedText, () => scanner.clear());
        };

        const onScanFailure = (error: Error | string) => {
            const errorMsg = typeof error === 'string' ? error : error.message;
            if (errorMsg?.includes("permission")) {
                setError("Camera access needed");
            }
        };

        scanner.render(onScanSuccess, onScanFailure);

        return () => {
            try { scanner.clear(); } catch { /* cleanup */ }
        };
    }, [businesses, t]);



    const resetScan = () => {
        setScanResult(null);
        setError(null);
        setSmsSent(null);
        window.location.reload();
    };

    const getTrustColorClass = (status: string) => {
        switch (status) {
            case 'VALID': return 'bg-green-500 shadow-neon-green';
            case 'LOCATION_MISMATCH':
            case 'EXPIRED': return 'bg-yellow-500 shadow-neon-yellow';
            default: return 'bg-red-500 shadow-neon-red';
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-8 shadow-xl text-center">
                <div className="flex items-center justify-center mb-6 sm:mb-8">
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mr-2 sm:mr-4" />
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{t.nav.scan_qr}</h2>
                </div>

                {smsSent && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-lg animate-bounce flex items-center justify-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span className="text-sm font-bold">{smsSent}</span>
                    </div>
                )}

                {!scanResult && !error && (
                    <div className="max-w-md mx-auto bg-slate-950 p-2 sm:p-4 rounded-xl border border-slate-800">
                        <div id="reader" className="w-full relative overflow-hidden rounded-lg min-h-[250px] bg-slate-900">
                            {showArOverlay && (
                                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                                    <div className="w-56 h-56 border-2 border-yellow-500/50 rounded-lg relative animate-pulse">
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500"></div>
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500"></div>
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500"></div>
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Zap className="h-8 w-8 text-yellow-500/30 animate-ping" />
                                        </div>
                                    </div>
                                    <p className="text-yellow-500 font-mono text-xs mt-4 bg-black/50 px-2 py-1 rounded">{t.scanner.ar_active}</p>
                                </div>
                            )}
                        </div>
                        <p className="text-slate-400 mt-4 text-sm">{t.scanner.point_camera}</p>

                        <div className="mt-6 flex items-start gap-3 p-4 bg-slate-900/40 rounded-xl border border-slate-800/10">
                            <div className="mt-0.5 text-slate-500">
                                <Shield className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-mono text-left">
                                {t.scanner.privacy}
                            </p>
                        </div>

                        {nfcSupported && (
                            <button
                                onClick={handleNFCScan}
                                disabled={nfcScanning}
                                className={`mt-6 w-full px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                                    nfcScanning 
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse' 
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                }`}
                            >
                                <Smartphone className="h-5 w-5" />
                                {nfcScanning ? 'Listening for NFC Tag...' : 'Tap to Verify (NFC)'}
                            </button>
                        )}
                    </div>
                )}

                {scanResult && (
                    <div className={`mt-8 p-6 rounded-xl border animate-fade-in ${scanResult.status === 'VALID' ? 'bg-green-900/20 border-green-500/30' :
                        scanResult.status === 'EXPIRED' || scanResult.status === 'LOCATION_MISMATCH' ? 'bg-yellow-900/20 border-yellow-500/30' :
                            'bg-red-900/20 border-red-500/30'
                        }`}>

                        <div className="flex justify-center gap-4 sm:gap-6 mb-8 sm:mb-10 p-4 bg-slate-950/50 rounded-3xl border border-slate-800/50 overflow-x-auto">
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-slate-800 transition-all duration-500 ${scanResult.status === 'VALID' ? 'bg-green-500 shadow-neon-green scale-110 animate-pulse' : 'bg-green-900/10 opacity-20'}`}></div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${scanResult.status === 'VALID' ? 'text-green-500' : 'text-slate-700'}`}>{t.scanner.labels.secure}</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-slate-800 transition-all duration-500 ${scanResult.status === 'LOCATION_MISMATCH' || scanResult.status === 'EXPIRED' ? 'bg-yellow-500 shadow-neon-yellow scale-110 animate-pulse' : 'bg-yellow-900/10 opacity-20'}`}></div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${scanResult.status === 'LOCATION_MISMATCH' || scanResult.status === 'EXPIRED' ? 'text-yellow-500' : 'text-slate-700'}`}>{t.scanner.labels.warning}</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-slate-800 transition-all duration-500 ${scanResult.status === 'COUNTERFEIT' || scanResult.status === 'INVALID' ? 'bg-red-500 shadow-neon-red scale-110 animate-bounce' : 'bg-red-900/10 opacity-20'}`}></div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${scanResult.status === 'COUNTERFEIT' || scanResult.status === 'INVALID' ? 'text-red-500' : 'text-slate-700'}`}>{t.scanner.labels.danger}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center mb-6">
                            <div className="relative">
                                <div className={`absolute inset-0 blur-xl opacity-20 animate-pulse ${getTrustColorClass(scanResult.status).split(' ')[0]}`}></div>

                                {scanResult.status === 'VALID' ? (
                                    <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-green-500 relative z-10" />
                                ) : (
                                    <AlertTriangle className={`h-16 w-16 sm:h-20 sm:w-20 relative z-10 ${scanResult.status === 'LOCATION_MISMATCH' || scanResult.status === 'EXPIRED' ? 'text-yellow-500' : 'text-red-500'}`} />
                                )}
                            </div>
                        </div>

                        {scanResult.status === 'VALID' && (
                            <div className="flex items-center justify-center space-x-2 mb-6 animate-bounce">
                                <Trophy className="h-6 w-6 text-yellow-400" />
                                <span className="text-2xl font-bold text-yellow-400">+{xp} XP GAINED</span>
                                <Star className="h-6 w-6 text-yellow-400" />
                            </div>
                        )}

                        <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${scanResult.status === 'VALID' ? 'text-green-400' :
                            scanResult.status === 'LOCATION_MISMATCH' || scanResult.status === 'EXPIRED' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {scanResult.status === 'VALID' ? t.scanner.status.valid :
                                scanResult.status === 'LOCATION_MISMATCH' ? t.scanner.status.location_mismatch :
                                    scanResult.status === 'EXPIRED' ? t.scanner.status.expired :
                                        t.scanner.status.suspicious}
                        </h3>

                        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${scanResult.status === 'VALID' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            scanResult.status === 'LOCATION_MISMATCH' || scanResult.status === 'EXPIRED' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {scanResult.status === 'VALID' ? (
                                t.scanner.messages.valid
                            ) : scanResult.status === 'LOCATION_MISMATCH' ? (
                                t.scanner.messages.location_mismatch
                            ) : scanResult.status === 'EXPIRED' ? (
                                t.scanner.messages.expired
                            ) : (
                                t.scanner.messages.counterfeit
                            )}
                        </div>

                        {scanResult.business && (
                            <div className="text-left max-w-sm mx-auto bg-slate-950 p-6 rounded-lg border border-slate-800 mt-6 space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider">{t.scanner.labels.business_name}</label>
                                    <p className="text-lg font-bold text-white">{scanResult.business.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase tracking-wider">{t.scanner.labels.gst}</label>
                                        <p className="text-sm font-bold text-yellow-500">{scanResult.business.gst || 'Not Available'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase tracking-wider">{t.scanner.labels.status}</label>
                                        <p className="text-sm font-bold text-green-500">{t.scanner.labels.gov_verified}</p>
                                    </div>
                                </div>

                                {scanResult.license && (
                                    <div className={`pt-4 border-t-2 ${scanResult.license.color === 'green' ? 'border-green-500/30' :
                                        scanResult.license.color === 'yellow' ? 'border-yellow-500/30' :
                                            scanResult.license.color === 'orange' ? 'border-orange-500/30' :
                                                'border-red-500/30'
                                        }`}>
                                        <label className="text-xs text-slate-500 uppercase tracking-wider">{t.scanner.labels.license_status}</label>
                                        <div className={`mt-2 p-3 rounded-lg ${scanResult.license.color === 'green' ? 'bg-green-500/10 border border-green-500/30' :
                                            scanResult.license.color === 'yellow' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                                                scanResult.license.color === 'orange' ? 'bg-orange-500/10 border border-orange-500/30' :
                                                    'bg-red-500/10 border border-red-500/30'
                                            }`}>
                                            <p className={`text-sm font-bold ${scanResult.license.color === 'green' ? 'text-green-400' :
                                                scanResult.license.color === 'yellow' ? 'text-yellow-400' :
                                                    scanResult.license.color === 'orange' ? 'text-orange-400' :
                                                        'text-red-400'
                                                }`}>
                                                {scanResult.license.message}
                                            </p>
                                            {scanResult.license.daysOverdue !== undefined && (
                                                <p className="text-xs text-red-400 mt-2 font-bold">
                                                    ⚠️ {scanResult.license.daysOverdue} {t.scanner.license.days_overdue}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="pt-4 border-t border-slate-800">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                                            <span>SERVER SYNC:</span>
                                            <span className="text-green-500 font-bold">TN-MBNR MAINNET</span>
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                                            <span>VERIFIED AT:</span>
                                            <span className="text-slate-300">{scanResult.verifiedAt ? new Date(scanResult.verifiedAt).toLocaleString() : 'N/A'}</span>
                                        </p>
                                    </div>
                                    <p className="text-[9px] text-slate-600 mt-3 text-center">
                                        Note: Status verified live against TN-MBNR Backend Servers. The QR code is static, but verification outcomes dynamically fetch the latest backend License State (Active, Grace, Expired, etc).
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                            <button
                                onClick={resetScan}
                                className="w-full sm:w-auto px-6 py-3 min-h-[48px] bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                            >
                                <RefreshCw className="h-4 w-4" />
                                {t.scanner.actions.scan_another}
                            </button>

                            <button
                                onClick={() => window.onReportBusiness?.(scanResult.business?.name || '')}
                                className="w-full sm:w-auto px-6 py-3 min-h-[48px] bg-red-900/30 hover:bg-red-900/50 text-red-500 rounded-lg font-bold border border-red-500/30 transition-all active:scale-95"
                            >
                                {t.scanner.actions.report}
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-8 p-6 rounded-xl bg-red-900/20 border border-red-500/30 animate-in fade-in slide-in-from-bottom-4">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-400 mb-2">
                            {error}
                        </h3>
                        <p className="text-slate-300 mb-6">
                            {error === "Camera access needed" ? "Please enable camera checks in your browser settings." :
                                error === "Enable location" ? "We need location access to verify you are currently at the shop." :
                                    "Please check your internet connection."}
                        </p>
                        <button
                            onClick={resetScan}
                            className="w-full sm:w-auto px-6 py-3 min-h-[48px] bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-all hover:scale-105 active:scale-95"
                        >
                            {t.scanner.actions.try_again}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
