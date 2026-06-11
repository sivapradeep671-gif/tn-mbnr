import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Smartphone, Download, CheckCircle, Zap, ExternalLink, MapPin, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { Business } from '../types/types';
import { showToast } from '../hooks/useToast';
import { NotificationCenter } from './NotificationCenter';
import { TradeLicense } from './TradeLicense';

interface MerchantDashboardProps {
    business: Business;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ business }) => {
    const { t } = useLanguage();
    useAuth();
    const [qrToken, setQrToken] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [stats] = useState({ total: 156, verified: 150, failed: 6 });
    const [showLicense, setShowLicense] = useState<boolean>(false);
    const [nfcSupported, setNfcSupported] = useState<boolean>(false);

    useEffect(() => {
        if ('NDEFReader' in window) {
            setNfcSupported(true);
        }
    }, []);



    const generateCertificate = () => {
        setShowLicense(true);
    };

    const [statusData, setStatusData] = useState<any>(null);
    const [isPaying, setIsPaying] = useState(false);

    const fetchRealStatus = React.useCallback(async () => {
        setIsLoading(true);
        try {
            // Using the qrToken that was assigned during V1 registration
            const tokenToUse = business.qrToken || business.id; 
            const response = await api.get<any>(`/v1/license/verify/${tokenToUse}?lat=${business.latitude}&lng=${business.longitude}`);
            setStatusData(response);
            setQrToken(tokenToUse);
        } catch {
            console.warn("[Merchant Authority] Backend Unreachable.");
            showToast('Unable to fetch live status from backend', 'warning');
            setQrToken(business.qrToken || business.id);
        } finally {
            setIsLoading(false);
        }
    }, [business]);

    useEffect(() => {
        fetchRealStatus();
        const interval = setInterval(() => {
            fetchRealStatus();
        }, 10000); // Polling every 10s for state changes
        return () => clearInterval(interval);
    }, [fetchRealStatus]);

    const handlePayment = async () => {
        setIsPaying(true);
        try {
            await api.post(`/v1/license/pay/${qrToken}`, {});
            showToast('Payment successful! Your license is now ACTIVE.', 'success');
            await fetchRealStatus();
        } catch (error) {
            showToast('Payment failed. Please try again.', 'error');
        } finally {
            setIsPaying(false);
        }
    };

    const downloadQR = () => {
        const svg = document.getElementById('merchant-qr');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `QR-${business.tradeName}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            showToast('QR Code Downloaded', 'success');
        }
    };

    const writeToNFC = async () => {
        try {
            // @ts-ignore
            const ndef = new window.NDEFReader();
            await ndef.write(qrToken);
            showToast('Successfully wrote token to NFC tag!', 'success');
        } catch (error) {
            console.error("NFC Write Error:", error);
            showToast("Failed to write to NFC tag.", 'error');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-16 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                <div className="flex-1 w-full translate-y-0 group">
                    <div className="glass-card p-1 sm:p-2 rounded-[2.5rem] border-white/5 relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative z-10 p-6 sm:p-10">
                            <div className="flex items-center gap-6 mb-8 sm:mb-12">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-yellow-500/20 rotate-3">
                                    <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-slate-950" />
                                </div>
                                <div>
                                    <h1 className="h-display text-2xl sm:text-4xl mb-1 mt-0">{business.tradeName}</h1>
                                    <p className="text-slate-500 text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase opacity-70">Authenticated Merchant Platform</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                                <div className="space-y-6 sm:space-y-8">
                                    <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] sm:text-xs text-slate-500 font-black uppercase tracking-widest">Live License State</span>
                                            <div className={`flex items-center gap-2 px-3 py-1 text-[10px] font-black rounded-full border ${
                                                statusData?.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                                statusData?.status === 'GRACE' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                                                statusData?.status === 'PENDING_PAYMENT' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                                                'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                                <div className={`w-1 h-1 rounded-full animate-ping ${
                                                    statusData?.status === 'ACTIVE' ? 'bg-green-500' : 
                                                    statusData?.status === 'GRACE' ? 'bg-yellow-500' : 
                                                    statusData?.status === 'PENDING_PAYMENT' ? 'bg-orange-500' : 
                                                    'bg-red-500'
                                                }`}></div>
                                                {statusData?.status || 'LOADING...'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className={`h-5 w-5 ${
                                                    statusData?.status === 'ACTIVE' ? 'text-green-500' : 
                                                    statusData?.status === 'GRACE' ? 'text-yellow-500' : 
                                                    statusData?.status === 'PENDING_PAYMENT' ? 'text-orange-500' : 
                                                    'text-red-500'
                                                }`} />
                                                <span className="text-white font-bold">{statusData?.message_en || 'Syncing with backend...'}</span>
                                            </div>
                                            
                                            {statusData?.status === 'PENDING_PAYMENT' && (
                                                <div className="mt-4">
                                                    <button 
                                                        onClick={handlePayment}
                                                        disabled={isPaying}
                                                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-black text-[12px] uppercase tracking-widest shadow-lg hover:shadow-orange-500/30 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                                                    >
                                                        {isPaying ? 'Processing Payment Gateway...' : 'Pay Municipal Fees Now'}
                                                    </button>
                                                </div>
                                            )}

                                            <p className="text-[10px] text-slate-400 mt-2">
                                                <strong>How this works:</strong> Static QR, Dynamic Server Status. Your printed QR code never needs to be redownloaded. License state changes occur on the backend servers and instantly reflect on any citizen's scan.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] sm:text-xs text-slate-500 font-black uppercase tracking-widest">TN-MBNR Timing Rules</span>
                                            <div className="flex items-center gap-2 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[9px] font-black rounded-full border border-yellow-500/20">
                                                <Shield className="w-3 h-3" /> ENFORCED
                                            </div>
                                        </div>
                                        <ul className="space-y-3 text-[11px] text-slate-300">
                                            <li className="flex justify-between items-center">
                                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Active Window</span>
                                                <span className="font-mono font-bold text-white">30 Minutes</span>
                                            </li>
                                            <li className="flex justify-between items-center">
                                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Grace Period (Auto-Approval)</span>
                                                <span className="font-mono font-bold text-white">Next 30 Minutes</span>
                                            </li>
                                            <li className="flex justify-between items-center">
                                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Payment Deadline</span>
                                                <span className="font-mono font-bold text-white">1 Month</span>
                                            </li>
                                        </ul>
                                    </div>

                                     <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <MapPin className="h-5 w-5 text-yellow-500" />
                                            <span className="text-[10px] sm:text-xs text-slate-500 font-black uppercase tracking-widest">{t.scanner.labels.reg_location}</span>
                                        </div>
                                        <p className="text-white text-sm font-medium leading-relaxed">{business.address}</p>
                                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
                                            <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
                                                <span>Ward: {business.municipal_ward || 'UNASSIGNED'}</span>
                                                <span>NIC: {business.nic_category || 'GENERIC'}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
                                                <span>LAT: {business.latitude?.toFixed(4) || '0.0000'}</span>
                                                <span>LNG: {business.longitude?.toFixed(4) || '0.0000'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Portal */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            className="py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-3 active:scale-95"
                                            onClick={generateCertificate}
                                        >
                                            <FileText className="h-4 w-4" />
                                            Certificate
                                        </button>
                                        <button 
                                            className="py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 active:scale-95"
                                            onClick={() => showToast('Redirecting to Amendment Form...', 'success')}
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Amend
                                        </button>
                                        <button 
                                            className="py-4 bg-yellow-500/10 text-yellow-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-yellow-500/20 hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                                            onClick={() => showToast('Opening Renewal Portal...', 'success')}
                                        >
                                            <Shield className="h-4 w-4" />
                                            Renew
                                        </button>
                                        <button 
                                            className="py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                                            onClick={() => showToast('Initiating Surrender Process...', 'warning')}
                                        >
                                            <Zap className="h-4 w-4" />
                                            Surrender
                                        </button>
                                    </div>

                                    {/* SLA Status Card */}
                                    {business.status === 'Pending' && business.sla_deadline_at && (
                                        <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl animate-pulse">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SLA Deadline Watch</span>
                                                <span className="text-[10px] text-yellow-500 font-mono">
                                                    {Math.max(0, Math.ceil((new Date(business.sla_deadline_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))} Days Left
                                                </span>
                                            </div>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,1)]"
                                                    style={{ width: `${Math.min(100, (Math.max(0, Math.ceil((new Date(business.sla_deadline_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000))) / 15) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-950 p-8 rounded-[2rem] border border-white/5 shadow-inner relative group/qr overflow-hidden flex flex-col items-center">
                                    <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover/qr:opacity-100 transition-opacity duration-500" />
                                    
                                    <div className="relative p-4 sm:p-6 bg-white rounded-3xl shadow-2xl mb-6">
                                        <QRCodeSVG 
                                            id="merchant-qr"
                                            value={qrToken} 
                                            size={200} 
                                            level="H"
                                            includeMargin={true}
                                            className="w-40 h-40 sm:w-52 sm:h-52"
                                        />
                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-black rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                                            <Zap className="h-4 w-4 text-yellow-500" />
                                        </div>
                                    </div>

                                    <div className="w-full max-w-[200px] mb-6">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                            <span>Dynamic Token Sync</span>
                                            <span className="text-yellow-500">{timeLeft}s</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-yellow-500 transition-all duration-1000 linear"
                                                style={{ width: `${(timeLeft / 30) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 w-full max-w-[200px]">
                                        <button 
                                            onClick={fetchNewToken}
                                            disabled={isLoading}
                                            className="flex-1 p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-all active:scale-90 disabled:opacity-50"
                                            title="Manual Refresh"
                                        >
                                            <RefreshCw className={`h-4 w-4 mx-auto ${isLoading ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button 
                                            onClick={downloadQR}
                                            className="flex-1 p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-all active:scale-90"
                                            title="Download QR"
                                        >
                                            <Download className="h-4 w-4 mx-auto" />
                                        </button>
                                        <button 
                                            className="flex-1 p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-all active:scale-90"
                                            title="Print Signage"
                                        >
                                            <Smartphone className="h-4 w-4 mx-auto" />
                                        </button>
                                    </div>
                                    
                                    {nfcSupported && (
                                        <button 
                                            onClick={writeToNFC}
                                            className="mt-4 w-full p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                                        >
                                            <Zap className="h-4 w-4" />
                                            Write to NFC Tag
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-80 space-y-6">
                    <div className="glass-card p-8 rounded-3xl border-white/5 bg-indigo-500/5 border-indigo-500/10 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="h-4 w-4 text-indigo-400" />
                            <h3 className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.3em] mt-0">{t.merchant.compliance}</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { label: t.merchant.tax_property, status: business.property_tax_status || 'Pending', icon: MapPin },
                                { label: t.merchant.tax_water, status: business.water_tax_status || 'Paid', icon: Zap },
                                { label: t.merchant.tax_professional, status: business.professional_tax_status || 'Pending', icon: FileText },
                            ].map((tax, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <tax.icon className="h-3 w-3 text-slate-500" />
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{tax.label}</span>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${
                                        tax.status === 'Paid' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10 animate-pulse'
                                    }`}>
                                        {tax.status === 'Paid' ? 'PAID' : 'PENDING'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8">
                            <button 
                                onClick={() => showToast('Connecting to TN Urban Pay Gateway...', 'success')}
                                className="w-full py-4 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] transition-all"
                            >
                                {t.merchant.settle_dues}
                            </button>
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-3xl border-white/5">
                        <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-8">Scan Intelligence</h3>
                        
                        <div className="space-y-8">
                            <div>
                                <p className="text-3xl font-black text-white tracking-tighter mb-1">{stats.total}</p>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Global Scan Hits</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-green-500 tracking-tighter mb-1">{stats.verified}</p>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Verified Pass</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-red-500 tracking-tighter mb-1">{stats.failed}</p>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Security Flags</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 group/link">
                                Detailed Analytics <ExternalLink className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <NotificationCenter />
                    {showLicense && <TradeLicense business={business} onClose={() => setShowLicense(false)} />}
                </div>
            </div>
        </div>
    );
};
