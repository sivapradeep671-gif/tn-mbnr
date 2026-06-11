import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { 
    Search, 
    Filter, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    MapPin, 
    ShieldCheck, 
    FileText, 
    Activity,
    Eye,
    ArrowUpRight,
    History,
    FileCheck,
    Loader,
    Zap,
    WifiOff,
    RefreshCw,
    Download,
    Users as UserIcon
} from 'lucide-react';
import type { Business } from '../types/types';
import { FieldAuditSimulator } from './FieldAuditSimulator';
import { VoiceInput } from './VoiceInput';
import { announceStatus } from '../utils/voiceUtils';
import { exportToCSV } from '../utils/export';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
interface InspectorDashboardProps {
    businesses: Business[];
    onUpdateStatus: (id: string, status: 'Verified' | 'Rejected', hash?: string) => Promise<void>;
}

export const InspectorDashboard: React.FC<InspectorDashboardProps> = ({ businesses, onUpdateStatus }) => {
    const { t, language } = useLanguage();
    const { isOnline, syncQueueLength } = useOfflineSync();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [activeTab, setActiveTab] = useState<'SCRUTINY' | 'AUDIT_LOG' | 'SIMULATOR'>('SCRUTINY');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleVoiceCommand = (transcript: string) => {
        const cmd = transcript.toLowerCase();
        console.log("[INSPECTOR VOICE] Detected:", cmd);
        
        if (cmd.includes('verify') || cmd.includes('சரி')) {
            if (selectedBusiness) {
                handleApprove();
                announceStatus('Verified', selectedBusiness.tradeName);
            }
        } else if (cmd.includes('search') || cmd.includes('தேடு')) {
            const query = cmd.replace('search', '').replace('தேடு', '').trim();
            setSearchTerm(query);
        }
    };

    const [aiResult, setAiResult] = useState<{ isSafe: boolean; riskLevel: string; message: string; similarBrands?: string[] } | null>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    React.useEffect(() => {
        if (activeTab === 'AUDIT_LOG') {
            const fetchLogs = async () => {
                try {
                    const res = await api.get<{logs: any[]}>('/v1/license/admin/logs');
                    setAuditLogs(res.logs || []);
                } catch (e) {
                    console.error("Failed to fetch admin logs");
                }
            };
            fetchLogs();
        }
    }, [activeTab]);

    const handleApprove = async () => {
        if (!selectedBusiness) return;
        setIsSigning(true);
        setTxHash(null);

        // Simulate cryptographic signing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockHash = '0x' + Array.from({length: 64}, () => 
            Math.floor(Math.random() * 16).toString(16)).join('');
        
        setTxHash(mockHash);
        
        // Use the centralized status update logic (now offline-aware)
        await onUpdateStatus(selectedBusiness.id, 'Verified', mockHash);

        setIsSigning(false);
    };

    const runAIScrutiny = async () => {
        if (!selectedBusiness) return;
        setIsAnalyzing(true);
        setAiResult(null);

        try {
            const response = await fetch('/api/verify-business', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('tn_mbnr_token_dev') || ''}`
                },
                body: JSON.stringify({ 
                    businessName: selectedBusiness.tradeName, 
                    type: selectedBusiness.category 
                }),
            });
            const data = await response.json();
            setAiResult(data);
        } catch (error) {
            console.error("AI Scrutiny Error:", error);
            setAiResult({
                isSafe: false,
                riskLevel: 'Medium',
                message: 'AI connectivity degraded. Manual forensic lookup required.'
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Filter pending/under-review logic
    const pendingBusinesses = useMemo(() => {
        return businesses.filter(b => 
            (b.status === 'Pending' || b.status === 'Under Scrutiny' || b.status === 'Submitted') &&
            (b.legalName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             b.tradeName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [businesses, searchTerm]);

    const stats = {
        totalPending: pendingBusinesses.length,
        vulnerable: businesses.filter(b => (b.riskScore || 0) > 70).length,
        inspectedToday: 12,
        unplannedAudits: 3
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-reveal-up">
            {/* Header / Stats Grid */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-500 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-slate-900" />
                        </div>
                        <h1 className="h-display text-4xl">{t.inspector.title.split(' ')[0]} <span className="text-glow text-yellow-500">{t.inspector.title.split(' ')[1]}</span></h1>
                    </div>
                    <p className="text-slate-500 text-xs font-black tracking-[0.3em] uppercase">{t.inspector.subtitle} v2.1</p>
                </div>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => {
                            const doc = new jsPDF();
                            doc.setFontSize(20);
                            doc.text("Field Inspector Registry Report", 14, 22);
                            doc.setFontSize(10);
                            doc.setTextColor(100);
                            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
                            doc.text(`Assigned Zone: Central Hub`, 14, 36);

                            const tableColumn = ["Shop ID", "Trade Name", "Status", "GPS Location", "Risk"];
                            const tableRows = businesses.map(b => [
                                b.id,
                                b.tradeName,
                                b.status || b.current_stage || 'PENDING',
                                `${b.latitude}, ${b.longitude}`,
                                (b.riskScore || 0) > 70 ? 'High' : 'Low'
                            ]);

                            autoTable(doc, {
                                head: [tableColumn],
                                body: tableRows,
                                startY: 45,
                                styles: { fontSize: 8 },
                                headStyles: { fillColor: [234, 179, 8] }, // Yellow-500
                            });

                            doc.save("TN_MBNR_Inspector_Log.pdf");
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                    >
                        <Download className="h-4 w-4" />
                        Generate PDF
                    </button>
                    
                    {/* Sync Status Badge */}
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${
                        isOnline ? 'bg-green-500/5 border-green-500/20 text-green-500' : 'bg-red-500/5 border-red-500/20 text-red-500 animate-pulse'
                    }`}>
                        {isOnline ? <RefreshCw className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                {isOnline ? 'Network Stable' : 'Offline Mode'}
                            </span>
                            {syncQueueLength > 0 && (
                                <span className="text-[8px] font-bold mt-1 uppercase tracking-tighter">
                                    {syncQueueLength} Actions Pended
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
                        {[
                            { label: t.inspector.stats.awaiting, val: stats.totalPending, icon: Clock, color: 'text-yellow-500' },
                            { label: t.inspector.stats.risk, val: stats.vulnerable, icon: AlertTriangle, color: 'text-red-500' },
                            { label: t.inspector.stats.inspected, val: stats.inspectedToday, icon: CheckCircle2, color: 'text-green-500' },
                            { label: t.inspector.stats.live, val: stats.unplannedAudits, icon: Activity, color: 'text-blue-500' }
                        ].map((s, i) => (
                            <div key={i} className="glass-card p-4 rounded-2xl border-white/5 bg-white/[0.02]">
                                <div className="flex items-center gap-3 mb-1">
                                    <s.icon className={`h-4 w-4 ${s.color}`} />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
                                </div>
                                <div className="text-2xl font-bold">{s.val}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'SCRUTINY', label: t.inspector.tabs.scrutiny, icon: Search },
                    { id: 'SIMULATOR', label: t.inspector.tabs.simulator, icon: MapPin },
                    { id: 'AUDIT_LOG', label: t.inspector.tabs.history, icon: History },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as 'SCRUTINY' | 'AUDIT_LOG' | 'SIMULATOR');
                            setAiResult(null);
                        }}
                        className={`
                            flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-bold transition-all shrink-0
                            ${activeTab === tab.id 
                                ? 'bg-yellow-500 text-slate-950 shadow-2xl shadow-yellow-500/20' 
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'}
                        `}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {activeTab === 'SCRUTINY' && (
                        <>
                            {/* Search & Filter */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by Trade Name or Registration ID..."
                                        className="w-full bg-slate-900/50 border border-white/5 p-4 pl-12 pr-12 rounded-2xl outline-none focus:ring-1 focus:ring-yellow-500 transition-all text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <VoiceInput 
                                            onResult={handleVoiceCommand} 
                                            placeholder={language === 'ta' ? "குரல் கட்டளை (சரிபார்க்கவும் / தேடவும்)" : "Voice Command (Verify / Search)"} 
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => exportToCSV(businesses, 'MBNR_Inspector_Export')}
                                        title="Export All Data to Excel / CSV"
                                        className="p-4 bg-green-600/20 border border-green-500/30 rounded-2xl text-green-500 hover:bg-green-500 hover:text-white transition-all"
                                    >
                                        <Download className="h-5 w-5" />
                                    </button>
                                    <button className="p-4 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
                                        <Filter className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Pending List */}
                            <div className="space-y-4">
                                {pendingBusinesses.length === 0 ? (
                                    <div className="glass-card p-12 rounded-[2rem] text-center border-dashed border-white/10">
                                        <FileCheck className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold mb-2">Backlog Cleared</h3>
                                        <p className="text-slate-500 text-sm">No business registrations currently require scrutiny.</p>
                                    </div>
                                ) : (
                                    pendingBusinesses.map(business => (
                                        <div 
                                            key={business.id}
                                            onClick={() => {
                                                setSelectedBusiness(business);
                                                setAiResult(null);
                                            }}
                                            className={`
                                                glass-card p-6 rounded-2xl border-white/5 transition-all cursor-pointer group hover:bg-white/[0.04]
                                                ${selectedBusiness?.id === business.id ? 'bg-white/[0.06] border-yellow-500/30' : 'bg-white/[0.02]'}
                                            `}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-4">
                                                    <div className="p-3 bg-slate-900 rounded-xl group-hover:bg-yellow-500/10 transition-colors">
                                                        <FileText className="h-6 w-6 text-slate-400 group-hover:text-yellow-500" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-lg">{business.tradeName}</h4>
                                                            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[9px] font-black uppercase tracking-tighter transition-all group-hover:bg-yellow-500/20">
                                                                {business.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {business.address && business.address.substring(0, 30)}...</span>
                                                            <span className="flex items-center gap-1 font-mono">{business.id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ArrowUpRight className="h-5 w-5 text-slate-600 group-hover:text-yellow-500 transition-all opacity-0 group-hover:opacity-100" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'SIMULATOR' && (
                        <div className="glass-card p-2 rounded-[2.5rem] bg-indigo-500/5 border-indigo-500/20">
                             <FieldAuditSimulator businesses={businesses} onAuditComplete={() => setActiveTab('SCRUTINY')} />
                        </div>
                    )}

                    {activeTab === 'AUDIT_LOG' && (
                        <div className="glass-card p-8 rounded-[2rem] bg-white/[0.02] border-white/5">
                            <h3 className="h-display text-2xl mb-6">Verification <span className="text-glow">Logs</span></h3>
                            <div className="space-y-6">
                                {auditLogs.length === 0 ? (
                                    <p className="text-slate-500 text-sm">No verification scans recorded yet.</p>
                                ) : (
                                    auditLogs.map((log, index) => (
                                        <div key={log.id} className="flex gap-4 relative">
                                            {index !== auditLogs.length - 1 && <div className="absolute left-6 top-12 bottom-0 w-px bg-white/5" />}
                                            <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center shrink-0 border border-white/5 z-10">
                                                {log.is_counterfeit ? (
                                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                                ) : (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                )}
                                            </div>
                                            <div className="pb-8">
                                                <p className="text-sm font-bold text-white">
                                                    {log.is_counterfeit ? 'Counterfeit Scan Attempt Blocked' : `Verification Scan: ${log.verification_outcome}`}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1 mb-2">
                                                    Role: {log.scanner_role} • {new Date(log.timestamp).toLocaleString()}
                                                    {log.scan_latitude && log.scan_longitude && ` • GPS: ${log.scan_latitude.toFixed(4)}, ${log.scan_longitude.toFixed(4)}`}
                                                </p>
                                                <div className="inline-block px-3 py-1 rounded-lg bg-white/5 text-[10px] text-slate-400 font-mono">
                                                    UUID: {log.qr_uuid}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Inspection Context */}
                <div className="space-y-6">
                    {selectedBusiness ? (
                        <div className="glass-card rounded-[2.5rem] bg-white/[0.02] border-white/10 p-8 sticky top-24 overflow-hidden group">
                            <div className="absolute -top-12 -right-12 w-48 h-48 bg-yellow-500/10 rounded-full blur-[60px] group-hover:bg-yellow-500/20 transition-all duration-1000" />
                            
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Eye className="h-4 w-4" /> Live Scrutiny Profile
                            </h3>

                            <div className="mb-8">
                                <h2 className="text-3xl font-bold mb-1">{selectedBusiness.tradeName}</h2>
                                <p className="text-sm text-slate-400 mb-6">{selectedBusiness.legalName}</p>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-black mb-1">NIC Industry Category</p>
                                        <p className="font-bold flex items-center gap-2 text-sm">
                                            <Activity className="h-4 w-4 text-yellow-500" />
                                            {selectedBusiness.category}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Human Capital</p>
                                        <p className="font-bold flex items-center gap-2 text-sm">
                                            <UserIcon className="h-4 w-4 text-blue-500" />
                                            {selectedBusiness.employee_count || '0'} Employees
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8 space-y-4">
                                <button 
                                    onClick={runAIScrutiny}
                                    disabled={isAnalyzing}
                                    className={`
                                        w-full p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all
                                        ${aiResult 
                                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}
                                    `}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader className="h-5 w-5 animate-spin" />
                                            <span className="text-xs font-black uppercase tracking-widest">{t.inspector.ai.analyzing}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap className={`h-5 w-5 ${aiResult ? 'text-indigo-500' : 'text-yellow-500'}`} />
                                            <span className="text-xs font-black uppercase tracking-widest">
                                                {aiResult ? 'Re-Run Intelligence' : t.inspector.ai.invoke}
                                            </span>
                                        </>
                                    )}
                                </button>

                                {aiResult && (
                                    <div className={`p-6 rounded-[2rem] border animate-reveal-up ${aiResult.isSafe ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            {aiResult.isSafe ? <ShieldCheck className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-red-500" />}
                                            <h4 className="font-bold text-[10px] uppercase tracking-wider">{aiResult.isSafe ? t.inspector.ai.cleared : t.inspector.ai.flagged}</h4>
                                        </div>
                                        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                                            {aiResult.message}
                                        </p>
                                        {aiResult.similarBrands && aiResult.similarBrands.length > 0 && (
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Conflicts Detected:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {aiResult.similarBrands.map((b: string, i: number) => (
                                                        <span key={i} className="px-2 py-1 rounded-md bg-white/5 text-[9px] font-mono text-slate-300 border border-white/5">{b}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!aiResult && (
                                    <div className="p-6 bg-red-500/5 rounded-[2rem] border border-red-500/10">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-black text-red-500 uppercase">Integrity Score</span>
                                            <span className="text-2xl font-black text-red-500">{(selectedBusiness.riskScore || 0).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-red-500 transition-all duration-1000" 
                                                style={{ width: `${selectedBusiness.riskScore || 0}%` }} 
                                            />
                                        </div>
                                        <p className="text-[10px] text-red-400 mt-4 leading-relaxed">
                                            Initial risk scan detected potential naming conflict. Invoke Gemini for forensic audit.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <button 
                                    onClick={handleApprove}
                                    disabled={isSigning || isAnalyzing}
                                    className={`
                                        w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl relative overflow-hidden
                                        ${isSigning ? 'bg-slate-800 text-yellow-500 cursor-not-allowed' : 'bg-yellow-500 text-slate-950 hover:scale-[1.02] active:scale-[0.98] shadow-yellow-500/20'}
                                    `}
                                >
                                    {isSigning ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader className="h-4 w-4 animate-spin" />
                                            <span>Signing Tx...</span>
                                        </div>
                                    ) : (
                                        <span>Approve & Commit</span>
                                    )}
                                    {isSigning && (
                                        <div 
                                            className="absolute bottom-0 left-0 h-1 bg-yellow-500 transition-all duration-[2000ms]" 
                                            style={{ width: '100%' }}
                                        />
                                    )}
                                </button>
                                <button className="w-full py-4 bg-white/5 text-red-500 border border-red-500/20 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-500/10 transition-all">
                                    Reject
                                </button>
                                <button 
                                    onClick={() => setSelectedBusiness(null)}
                                    className="w-full py-2 text-xs text-slate-600 hover:text-slate-400 transition-all font-bold"
                                >
                                    Dismiss Profile
                                </button>
                            </div>

                            {txHash && (
                                <div className="mt-6 p-4 bg-green-500/5 border border-green-500/20 rounded-2xl animate-reveal-up">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheck className="h-4 w-4 text-green-500" />
                                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">On-Chain Commitment</span>
                                    </div>
                                    <p className="text-[9px] font-mono text-slate-500 break-all leading-relaxed">
                                        TX_ID: {txHash}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-[8px] text-slate-600 font-bold uppercase">Status: Confirmed</span>
                                        <button 
                                            onClick={() => window.open(`https://etherscan.io/tx/${txHash}`, '_blank')}
                                            className="text-[8px] text-indigo-400 font-black uppercase hover:underline"
                                        >
                                            View in Explorer
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-card rounded-[2.5rem] bg-white/[0.01] border-white/5 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <div className="p-6 bg-slate-900 rounded-3xl mb-6">
                                <Search className="h-12 w-12 text-slate-700" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Selection Required</h3>
                            <p className="text-slate-500 text-sm max-w-[240px]">
                                Select a pending business node from the primary scrutiny list to begin verification.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
