import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Database, Activity, ShieldCheck, Zap, AlertTriangle, MapPin, Bot, Search, Smartphone } from 'lucide-react';
import { aiService } from '../services/geminiService';
import type { Business, CitizenReport } from '../types/types';
import { api } from '../api/client';
import { showToast } from '../hooks/useToast';
import { AdminAnalytics } from './AdminAnalytics';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { BlockchainLedger } from './BlockchainLedger';
import { FieldAuditSimulator } from './FieldAuditSimulator';

interface DashboardProps {
    businesses: Business[];
    reports: CitizenReport[];
    onUpdateStatus?: (id: string, status: 'Verified' | 'Rejected') => Promise<void>;
}

interface SuspiciousScan {
    id: number;
    business_id: string;
    token: string;
    scan_lat: number;
    scan_lng: number;
    result: string;
    distance?: number;
    scanned_at: string;
    tradeName?: string;
}

interface RiskyShop {
    shop_name: string;
    failed_scans: number;
    risk_score: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ businesses, reports, onUpdateStatus }) => {
    const [activeTab, setActiveTab] = useState<'businesses' | 'reports' | 'analytics' | 'prediction' | 'approvals' | 'field_test' | 'nodes'>('businesses');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [predictionModel, setPredictionModel] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [realShops, setRealShops] = useState<Business[]>([]);
    const [suspiciousScans, setSuspiciousScans] = useState<SuspiciousScan[]>([]);
    const [riskyShops, setRiskyShops] = useState<RiskyShop[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<Business[]>([]);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [slaFilter, setSlaFilter] = useState<'ALL' | 'COMPLIANT' | 'URGENT' | 'BREACHED'>('ALL');
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);
    const [ledgerAssetId, setLedgerAssetId] = useState<string | undefined>(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [fullLedger, setFullLedger] = useState<any[]>([]);
    
    // Notification Demo State
    const [testRecipient, setTestRecipient] = useState('');
    const [isSendingTest, setIsSendingTest] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const shopsRes = await api.get<{ shops: Business[] }>('/admin/shops');
                setRealShops(shopsRes.shops);
                
                const suspiciousRes = await api.get<{ scans: SuspiciousScan[], top_risky_shops: RiskyShop[] }>('/admin/suspicious');
                setSuspiciousScans(suspiciousRes.scans);
                setRiskyShops(suspiciousRes.top_risky_shops);

                const approvalsRes = await api.get<{ data: Business[] }>('/admin/pending-approvals');
                setPendingApprovals(approvalsRes.data);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const ledgerRes = await api.get<{ data: any[] }>('/ledger');
                setFullLedger(ledgerRes.data);
            } catch (err) {
                console.error("Failed to fetch admin stats:", err);
                setRealShops(businesses);
            }
        };
        fetchStats();
    }, [businesses]);

    const displayShops = (realShops && realShops.length > 0) ? realShops : (businesses || []);

    const stats = {
        total: displayShops.length,
        verified: displayShops.filter((b: Business) => b.status === 'Verified').length,
        pending: displayShops.filter((b: Business) => b.status === 'Pending').length,
        rejected: displayShops.filter((b: Business) => b.status === 'Rejected').length,
        sla_compliant: displayShops.filter((b: Business) => b.status === 'Verified' || (b.status === 'Pending' && b.sla_deadline_at && new Date(b.sla_deadline_at) > new Date())).length,
        sla_breached: displayShops.filter((b: Business) => b.status === 'Pending' && b.sla_deadline_at && new Date(b.sla_deadline_at) < new Date()).length,
        sla_urgent: displayShops.filter((b: Business) => {
            if (b.status !== 'Pending' || !b.sla_deadline_at) return false;
            const diff = new Date(b.sla_deadline_at).getTime() - new Date().getTime();
            return diff > 0 && diff < (3 * 24 * 60 * 60 * 1000);
        }).length,
        aging_0_3: displayShops.filter((b: Business) => {
            if (b.status !== 'Pending') return false;
            const age = (new Date().getTime() - new Date(b.registrationDate).getTime()) / (24 * 60 * 60 * 1000);
            return age <= 3;
        }).length,
        aging_3_7: displayShops.filter((b: Business) => {
            if (b.status !== 'Pending') return false;
            const age = (new Date().getTime() - new Date(b.registrationDate).getTime()) / (24 * 60 * 60 * 1000);
            return age > 3 && age <= 7;
        }).length,
        aging_7_plus: displayShops.filter((b: Business) => {
            if (b.status !== 'Pending') return false;
            const age = (new Date().getTime() - new Date(b.registrationDate).getTime()) / (24 * 60 * 60 * 1000);
            return age > 7;
        }).length
    };

    const filteredBusinesses = displayShops.filter((b: Business) => {
        const matchesSearch = (b.tradeName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
            (b.legalName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
            (b.id || '').toLowerCase().includes((searchTerm || '').toLowerCase());
            
        if (!matchesSearch) return false;
        
        if (slaFilter === 'ALL') return true;
        
        const isPending = b.status === 'Pending';
        const deadline = b.sla_deadline_at ? new Date(b.sla_deadline_at) : null;
        const now = new Date();
        
        if (slaFilter === 'COMPLIANT') return !isPending || (deadline && deadline > now);
        if (slaFilter === 'URGENT') {
            if (!isPending || !deadline) return false;
            const diff = deadline.getTime() - now.getTime();
            return diff > 0 && diff < (3 * 24 * 60 * 60 * 1000);
        }
        if (slaFilter === 'BREACHED') return isPending && deadline && deadline < now;
        
        return true;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 reveal-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-yellow-500 rounded-2xl shadow-2xl shadow-yellow-500/20 rotate-3">
                        <LayoutDashboard className="h-8 w-8 text-slate-950" />
                    </div>
                    <div>
                        <h1 className="h-display text-4xl mb-1 mt-0">Governance <span className="text-glow">Console</span></h1>
                        <p className="text-slate-500 text-sm font-bold tracking-[0.2em] uppercase">Enterprise Registry Management v2.4</p>
                    </div>
                </div>
                
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                    <button 
                        onClick={() => setActiveTab('businesses')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'businesses' ? 'bg-white text-slate-950 shadow-2xl' : 'text-slate-400 hover:text-white'}`}
                    >
                        Master Registry
                    </button>
                    <button 
                        onClick={() => setActiveTab('reports')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'reports' ? 'bg-white text-slate-950 shadow-2xl' : 'text-slate-400 hover:text-white'}`}
                    >
                        Civic Intelligence
                    </button>
                    <button 
                        onClick={() => setActiveTab('approvals')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'approvals' ? 'bg-yellow-500 text-slate-950 shadow-2xl' : 'text-slate-400 hover:text-white'}`}
                    >
                        Pending Approvals
                    </button>
                    <button 
                        onClick={() => setActiveTab('analytics')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'analytics' ? 'bg-white text-slate-950 shadow-2xl' : 'text-slate-400 hover:text-white'}`}
                    >
                        Analytics
                    </button>
                    <button 
                        onClick={() => setActiveTab('prediction')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'prediction' ? 'bg-yellow-500 text-slate-950 shadow-2xl' : 'text-slate-400 hover:text-white'}`}
                    >
                        AI Pulse
                    </button>
                    <button 
                        onClick={() => setActiveTab('field_test')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'field_test' ? 'bg-yellow-500 text-slate-950 shadow-2xl' : 'text-slate-400 hover:text-white'}`}
                    >
                        Audit Sim
                    </button>
                    <button 
                        onClick={() => setActiveTab('nodes')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'nodes' ? 'bg-blue-500 text-white shadow-2xl shadow-blue-500/30' : 'text-slate-400 hover:text-white'}`}
                    >
                        Nodes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Assets', value: stats.total, icon: Database, color: 'text-white', bg: 'bg-white/5' },
                    { label: 'Authenticated', value: stats.verified, icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: 'Pending Audit', value: stats.pending, icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                    { label: 'Revoked', value: stats.rejected, icon: Zap, color: 'text-red-500', bg: 'bg-red-500/10' }
                ].map((stat, i) => (
                    <div key={i} className={`glass-card p-6 rounded-3xl border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-500`}>
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full -mr-8 -mt-8 blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700`} />
                        <div className="relative z-10">
                            <stat.icon className={`h-5 w-5 ${stat.color} mb-4`} />
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">{stat.label}</p>
                            <p className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            {activeTab === 'businesses' && (
                <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl animate-reveal-up">
                    <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                            <Database className="h-4 w-4 text-yellow-500" />
                            Master Asset Registry
                        </h3>
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => {
                                    setLedgerAssetId(undefined);
                                    setIsLedgerOpen(true);
                                }}
                                className="group/audit flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl hover:bg-yellow-500 hover:text-slate-950 transition-all active:scale-95"
                            >
                                <Database className="h-3 w-3 group-hover/audit:animate-spin" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500 group-hover/audit:text-slate-950">Full Audit Trail</span>
                            </button>
                            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
                                {[
                                    { id: 'ALL', label: 'All' },
                                    { id: 'COMPLIANT', label: 'Compliant' },
                                    { id: 'URGENT', label: 'Urgent' },
                                    { id: 'BREACHED', label: 'Breached' }
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setSlaFilter(f.id as typeof slaFilter)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                            slaFilter === f.id 
                                                ? 'bg-white/10 text-white shadow-xl' 
                                                : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <Search className="h-3 w-3 text-slate-500" />
                                </div>
                                <input 
                                    type="text"
                                    placeholder="Search by Trade Name / ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-slate-950 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[10px] text-white focus:border-yellow-500/50 outline-none w-64 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.01] text-slate-500 text-[10px] uppercase font-black tracking-[0.4em]">
                                <tr>
                                    <th className="px-8 py-5">Verified Asset</th>
                                    <th className="px-8 py-5">Infrastructure / Ward</th>
                                    <th className="px-8 py-5">Governance Status</th>
                                    <th className="px-8 py-5">Total Scans</th>
                                    <th className="px-8 py-5">Audit Trail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredBusinesses.map((biz: Business) => (
                                    <tr key={biz.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="text-white font-black text-md tracking-tight">{biz.tradeName}</p>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 opacity-60">
                                                {biz.legalName} • {biz.id}
                                            </p>
                                            <p className="text-[9px] text-slate-600 font-medium mt-1 group-hover:text-slate-400 transition-colors">
                                                {biz.address} | {biz.contactNumber}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{biz.nic_category || 'Commercial'}</p>
                                            <p className="text-[9px] text-slate-600 font-mono mt-1">Ward {biz.municipal_ward || '00'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border ${
                                                biz.status === 'Verified' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                                biz.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                                {biz.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-white font-black">{biz.total_scans || 0} Events</span>
                                                <span className="text-[9px] text-green-500 opacity-60">{biz.verified_scans || 0} Valid</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button 
                                                onClick={() => {
                                                    setLedgerAssetId(biz.id);
                                                    setIsLedgerOpen(true);
                                                }}
                                                className="group/btn flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-yellow-500 hover:text-slate-950 transition-all active:scale-95"
                                            >
                                                <Database className="h-3 w-3 group-hover/btn:rotate-12 transition-transform" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">View History</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'approvals' && (
                <div className="space-y-8 animate-reveal-up">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,1)]"></div>
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">{selectedBusiness ? 'Approval Intervention' : 'Pending Queue'}</h2>
                        </div>
                        {selectedBusiness && (
                            <button 
                                onClick={() => setSelectedBusiness(null)}
                                className="px-6 py-2 bg-white/5 text-slate-400 text-xs font-black rounded-xl hover:text-white transition-all uppercase tracking-widest border border-white/5"
                            >
                                Back to Queue
                            </button>
                        )}
                    </div>

                    {!selectedBusiness ? (
                        <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/[0.01] text-slate-500 text-[10px] uppercase font-black tracking-[0.4em]">
                                        <tr>
                                            <th className="px-8 py-5">Applicant</th>
                                            <th className="px-8 py-5">Status / Stage</th>
                                            <th className="px-8 py-5">Submited On</th>
                                            <th className="px-8 py-5 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {pendingApprovals.map((biz: Business) => (
                                            <tr key={biz.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <p className="text-white font-black text-md tracking-tight">{biz.tradeName}</p>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 opacity-60">ID: {(biz.id || '').slice(0, 12)}...</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 bg-white/5 text-slate-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-white/5">
                                                        {biz.status} {biz.current_stage ? `• ${biz.current_stage}` : ''}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-[10px] text-slate-500 font-black uppercase">{new Date(biz.registrationDate).toLocaleDateString()}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button 
                                                        onClick={() => setSelectedBusiness(biz)}
                                                        className="px-4 py-2 bg-white text-slate-950 text-[10px] font-black rounded-xl hover:bg-yellow-500 transition-all uppercase shadow-xl active:scale-95"
                                                    >
                                                        Review Case
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {pendingApprovals.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-24 text-center">
                                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">Decision Engine Idle — No pending cases</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right-10 duration-500">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                <div className="md:col-span-2 glass-card p-8 rounded-[2.5rem] border-white/5">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                                            <Database className="h-8 w-8 text-yellow-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white tracking-tight">{selectedBusiness.tradeName}</h2>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{selectedBusiness.legalName}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 text-xs font-medium">
                                        <div>
                                            <p className="text-slate-500 uppercase text-[8px] font-black tracking-widest mb-1">Entity Type</p>
                                            <p className="text-white">{selectedBusiness.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 uppercase text-[8px] font-black tracking-widest mb-1">GST Number</p>
                                            <p className="text-white">{selectedBusiness.gstNumber || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-slate-500 uppercase text-[8px] font-black tracking-widest mb-1">Registered Address</p>
                                            <p className="text-white">{selectedBusiness.address}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-yellow-500/5">
                                    <h3 className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.3em] mb-6">Compliance Score</h3>
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-white mb-2">{(10 - (selectedBusiness.riskScore || 5)).toFixed(1)}/10</div>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Initial System Risk: {selectedBusiness.riskScore || 5}/10</p>
                                    </div>
                                </div>
                            </div>
                            <ApprovalWorkflow 
                                business={selectedBusiness} 
                                isAdmin={true} 
                                onUpdate={async (newStatus) => {
                                    // Refresh the queue
                                    const approvalsRes = await api.get<{ data: Business[] }>('/admin/pending-approvals');
                                    setPendingApprovals(approvalsRes.data);
                                    
                                    // Sync with global hook state if it's a final decision
                                    if (onUpdateStatus && selectedBusiness && (newStatus === 'APPROVED' || newStatus === 'REJECTED')) {
                                        await onUpdateStatus(selectedBusiness.id, newStatus === 'APPROVED' ? 'Verified' : 'Rejected');
                                    }

                                    // Also update selected business if it's still in the queue (or just close view)
                                    const updated = (approvalsRes.data || []).find(b => b.id === selectedBusiness?.id);
                                    if (!updated) setSelectedBusiness(null);
                                    else setSelectedBusiness(updated);
                                }} 
                            />
                        </div>
                    )}
                </div>
            )}



            {activeTab === 'reports' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Activity className="h-4 w-4 text-yellow-500" />
                                    Live Security Feed
                                </h3>
                            </div>
                            <div className="p-8 space-y-6">
                                {suspiciousScans.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <ShieldCheck className="h-12 w-12 text-green-500/20 mx-auto mb-4" />
                                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">No Security Anomalies Detected</p>
                                    </div>
                                ) : (
                                    suspiciousScans.map((scan: SuspiciousScan, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-red-500/20 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${
                                                    scan.result === 'COUNTERFEIT' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                    <AlertTriangle className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm">{scan.tradeName || 'Unknown Shop'}</p>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                                        {(scan.result || '').replace('_', ' ')} • {new Date(scan.scanned_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest leading-none mb-1">Mismatch</p>
                                                <p className="text-white font-mono text-xs">{Math.round(scan.distance || 0)}m</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="glass-card rounded-[2.5rem] border-white/5 p-12 text-center animate-fade-in shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 mesh-gradient opacity-20 pointer-events-none" />
                            <div className="max-w-md mx-auto relative z-10">
                                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                                    <Activity className="h-8 w-8 text-yellow-500" />
                                </div>
                                <h2 className="h-display text-2xl mb-2 mt-0">Civic <span className="text-glow">Reports</span></h2>
                                <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">Integrated reports from citizens for municipal action.</p>
                                
                                <div className="grid grid-cols-1 gap-4 text-left">
                                    {reports.length === 0 ? (
                                        <div className="p-12 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01] text-center">
                                            <p className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em]">No Active Grievances</p>
                                        </div>
                                    ) : (
                                        reports.map(report => (
                                            <div key={report.id} className="glass-card p-6 rounded-2xl border-white/5 hover:border-yellow-500/30 transition-all duration-300">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-white font-black uppercase tracking-tight">{report.businessName}</span>
                                                    <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-widest ${
                                                        report.status === 'Submitted' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                                                    }`}>{report.status}</span>
                                                </div>
                                                <p className="text-slate-400 text-xs font-medium italic border-l-2 border-yellow-500/30 pl-4 mb-4">"{report.description}"</p>
                                                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {report.location}</span>
                                                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {report.category}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="glass-card p-8 rounded-[2.5rem] border-white/5">
                            <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-8">Asset Risk Profile</h3>
                            <div className="space-y-6">
                                {riskyShops.map((shop: RiskyShop, i: number) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-xs font-black text-white uppercase tracking-tight">{shop.shop_name}</p>
                                            <p className="text-[10px] font-mono text-red-500">{(shop.risk_score || 0).toFixed(1)}%</p>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-1000" style={{ width: `${shop.risk_score}%` }}></div>
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-2">{shop.failed_scans} Suspicious Events</p>
                                    </div>
                                ))}
                                {riskyShops.length === 0 && (
                                    <p className="text-[10px] text-slate-600 font-black uppercase text-center py-6">All Nodes Stable</p>
                                )}
                            </div>
                        </div>

                        <div className="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-yellow-500/10 to-transparent border-white/10 relative overflow-hidden group">
                            <div className="relative z-10">
                                <ShieldCheck className="h-8 w-8 text-yellow-500 mb-4" />
                                <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-2">Security Standard 4.0</h4>
                                <p className="text-slate-400 text-[10px] leading-relaxed mb-6">Your municipal identity grid is currently under 256-bit HMAC protection with active geofencing.</p>
                                <button className="w-full py-3 bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-yellow-500 transition-all active:scale-95">
                                    Refresh Grid
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <AdminAnalytics stats={{
                    total: businesses.length,
                    verified: businesses.filter(b => b.status === 'Verified').length,
                    pending: businesses.filter(b => b.status === 'Pending').length,
                    rejected: businesses.filter(b => b.status === 'Rejected').length,
                    sla_compliant: businesses.filter(b => {
                        if (b.status !== 'Pending') return true;
                        if (!b.sla_deadline_at) return true;
                        return new Date(b.sla_deadline_at) > new Date();
                    }).length,
                    sla_breached: businesses.filter(b => {
                        if (b.status !== 'Pending') return false;
                        if (!b.sla_deadline_at) return false;
                        return new Date(b.sla_deadline_at) < new Date();
                    }).length,
                    sla_urgent: businesses.filter(b => {
                        if (b.status !== 'Pending') return false;
                        if (!b.sla_deadline_at) return false;
                        const deadline = new Date(b.sla_deadline_at);
                        const diff = deadline.getTime() - new Date().getTime();
                        return diff > 0 && diff < (3 * 24 * 60 * 60 * 1000);
                    }).length,
                    aging_0_3: businesses.filter(b => {
                         if (b.status !== 'Pending') return false;
                         const age = (new Date().getTime() - new Date(b.registrationDate).getTime()) / (24 * 60 * 60 * 1000);
                         return age <= 3;
                    }).length,
                    aging_3_7: businesses.filter(b => {
                         if (b.status !== 'Pending') return false;
                         const age = (new Date().getTime() - new Date(b.registrationDate).getTime()) / (24 * 60 * 60 * 1000);
                         return age > 3 && age <= 7;
                    }).length,
                    aging_7_plus: businesses.filter(b => {
                         if (b.status !== 'Pending') return false;
                         const age = (new Date().getTime() - new Date(b.registrationDate).getTime()) / (24 * 60 * 60 * 1000);
                         return age > 7;
                    }).length
                }} />
            )}

            {activeTab === 'prediction' && (
                <div className="glass-card rounded-[2.5rem] border-white/5 p-12 text-center animate-fade-in shadow-2xl min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-yellow-500/5 backdrop-blur-3xl" />
                    <div className="relative z-10 max-w-2xl">
                        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-yellow-500/20">
                            <Bot className="h-10 w-10 text-yellow-500" />
                        </div>
                        <h2 className="h-display text-4xl mb-4 italic">Predictive <span className="text-glow">Fraud Pulse</span></h2>
                        <p className="text-slate-400 text-sm mb-12 leading-relaxed">Let Gemini 2.0 analyze your current scan telemetry to identify hidden hotspots and future risk vectors.</p>
                        
                        {!predictionModel ? (
                            <button 
                                onClick={async () => {
                                    setIsAnalyzing(true);
                                    // Deep analysis simulation
                                     const logs = JSON.stringify((suspiciousScans || []).slice(0, 5));
                                    const prompt = `Analyze these scan logs and predict future fraud trends for Tamil Nadu. Keep it in 3 bullet points. Logs: ${logs}`;
                                    try {
                                        const res = await aiService.getChatResponse(prompt, []);
                                        setPredictionModel(res);
                                    } finally {
                                        setIsAnalyzing(false);
                                    }
                                }}
                                disabled={isAnalyzing}
                                className="px-12 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.3em] shadow-3xl hover:bg-yellow-500 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isAnalyzing ? 'Processing Telemetry...' : 'Initialize AI Audit'}
                            </button>
                        ) : (
                            <div className="text-left bg-slate-950/50 p-8 rounded-3xl border border-white/10 animate-in zoom-in-95 duration-500">
                                <div className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-6">
                                    <Zap className="h-3 w-3" /> Gemini Intelligence Output
                                </div>
                                <div className="text-slate-200 text-sm leading-relaxed space-y-4 font-medium whitespace-pre-wrap">
                                    {predictionModel}
                                </div>
                                <button 
                                    onClick={() => setPredictionModel('')}
                                    className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                                >
                                    Reset Neural Path
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'field_test' && (
                <FieldAuditSimulator 
                    businesses={businesses} 
                    onAuditComplete={async () => {
                        // Refresh ledger after sim
                        const ledgerRes = await api.get<{ data: Record<string, unknown>[] }>('/ledger');
                        setFullLedger(ledgerRes.data);
                    }}
                />
            )}

            {activeTab === 'nodes' && (
                <div className="glass-card rounded-[2.5rem] border-white/5 p-12 text-center animate-reveal-up shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-3xl" />
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
                            <Zap className="h-10 w-10 text-blue-400" />
                        </div>
                        <h2 className="h-display text-4xl mb-4 italic">Communication <span className="text-glow text-blue-400">Node Hub</span></h2>
                        <p className="text-slate-400 text-sm mb-12 leading-relaxed">Test the low-latency notification grid. Verified for Twilio (SMS) and SendGrid (Email) production clusters.</p>
                        
                        <div className="bg-slate-950/50 p-10 rounded-[2rem] border border-white/10 text-left">
                            <div className="mb-8">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-3 block">Recipient Protocol (Phone/Email)</label>
                                <input 
                                    type="text"
                                    value={testRecipient}
                                    onChange={(e) => setTestRecipient(e.target.value)}
                                    placeholder="e.g., +919876543210 or admin@tn.gov.in"
                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button 
                                    onClick={async () => {
                                        if (!testRecipient) return showToast('Recipient required', 'warning');
                                        setIsSendingTest(true);
                                        const { notificationService } = await import('../services/notificationService');
                                        await notificationService.send({
                                            to: testRecipient,
                                            type: 'SMS',
                                            message: 'TRUSTREG TN SECURITY TEST: Your node is successfully synchronized with the regional notification grid.'
                                        });
                                        setIsSendingTest(false);
                                    }}
                                    disabled={isSendingTest}
                                    className="flex items-center justify-center gap-3 py-4 bg-white text-slate-950 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
                                >
                                    <Smartphone className="h-4 w-4" /> Dispatch Test SMS
                                </button>

                                <button 
                                    onClick={async () => {
                                        if (!testRecipient) return showToast('Recipient required', 'warning');
                                        setIsSendingTest(true);
                                        const { notificationService } = await import('../services/notificationService');
                                        await notificationService.send({
                                            to: testRecipient,
                                            type: 'EMAIL',
                                            subject: 'TrustReg TN: Node Verification',
                                            message: '<h3>Node Synchronization Successful</h3><p>Your regional administrator email has been verified for secure alerts.</p>'
                                        });
                                        setIsSendingTest(false);
                                    }}
                                    disabled={isSendingTest}
                                    className="flex items-center justify-center gap-3 py-4 bg-white text-slate-950 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
                                >
                                    <Activity className="h-4 w-4" /> Dispatch Test Email
                                </button>
                            </div>

                            <div className="mt-10 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                                <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3" /> Node Integrity Status
                                </p>
                                <p className="text-slate-500 text-[10px] leading-relaxed">
                                    Current Configuration: <strong>{process.env.NODE_ENV === 'production' ? 'PRODUCTION_CLUSTER' : 'LOCAL_SANDBOX'}</strong>.
                                    Nodes will operate in MOCK mode unless valid API keys are integrated into the environmental vault.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isLedgerOpen && (
                <BlockchainLedger 
                    blocks={fullLedger} 
                    onClose={() => setIsLedgerOpen(false)}
                    targetId={ledgerAssetId}
                />
            )}
        </div>
    );
};