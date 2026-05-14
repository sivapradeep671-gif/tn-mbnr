import React, { useState, useEffect } from 'react';
import { Scale, FileWarning, Send, Clock, CheckCircle2, XCircle, AlertOctagon, ChevronDown, Shield, Gavel, MessageSquare } from 'lucide-react';
import { api } from '../api/client';
import { showToast } from '../hooks/useToast';
import { useLanguage } from '../context/LanguageContext';
import type { Business } from '../types/types';

interface Grievance {
    id: number;
    business_id: string;
    business_name: string;
    grievance_type: string;
    description: string;
    status: string;
    priority: string;
    submitted_at: string;
    resolved_at: string | null;
    resolution_notes: string | null;
    escalation_level: number;
}

interface GrievanceRedressalProps {
    businesses: Business[];
}

const GRIEVANCE_TYPES = [
    { value: 'NAME_REJECTION', label: 'Name Rejection Appeal', labelTa: 'பெயர் நிராகரிப்பு மேல்முறையீடு', icon: <FileWarning className="h-4 w-4" /> },
    { value: 'STATUS_DISPUTE', label: 'Status Dispute', labelTa: 'நிலை தகராறு', icon: <Scale className="h-4 w-4" /> },
    { value: 'TAX_ERROR', label: 'Tax Record Error', labelTa: 'வரி பதிவு பிழை', icon: <AlertOctagon className="h-4 w-4" /> },
    { value: 'LICENSE_ISSUE', label: 'License Issue', labelTa: 'உரிமம் சிக்கல்', icon: <Shield className="h-4 w-4" /> },
    { value: 'FRAUD_FALSE_POSITIVE', label: 'False Fraud Flag', labelTa: 'தவறான மோசடி எச்சரிக்கை', icon: <Gavel className="h-4 w-4" /> },
    { value: 'OTHER', label: 'Other', labelTa: 'மற்றவை', icon: <MessageSquare className="h-4 w-4" /> },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    SUBMITTED: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: <Send className="h-3 w-3" /> },
    UNDER_REVIEW: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
    RESOLVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    REJECTED: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <XCircle className="h-3 w-3" /> },
    ESCALATED: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: <AlertOctagon className="h-3 w-3" /> },
};

export const GrievanceRedressal: React.FC<GrievanceRedressalProps> = ({ businesses }) => {
    const { language } = useLanguage();
    const isEn = language === 'en';
    const [view, setView] = useState<'form' | 'list'>('form');
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [grievanceType, setGrievanceType] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchGrievances();
    }, []);

    const fetchGrievances = async () => {
        setLoading(true);
        try {
            const res = await api.get<any>('/api/grievances');
            setGrievances(res.data || []);
        } catch (err) {
            console.error('Failed to load grievances', err);
        } finally {
            setLoading(false);
        }
    };

    const submitGrievance = async () => {
        if (!selectedBusiness || !grievanceType || !description.trim()) {
            showToast(isEn ? 'Please fill all fields' : 'அனைத்து புலங்களையும் நிரப்பவும்', 'warning');
            return;
        }

        const business = businesses.find(b => b.id === selectedBusiness);

        setSubmitting(true);
        try {
            const res = await api.post<any>('/api/grievances', {
                business_id: selectedBusiness,
                business_name: business?.tradeName || '',
                grievance_type: grievanceType,
                description: description.trim(),
                submitted_by: 'citizen'
            });

            showToast(
                isEn
                    ? `Grievance #${res.grievanceId} submitted. Resolution within ${res.estimatedResolution}.`
                    : `குறை #${res.grievanceId} சமர்ப்பிக்கப்பட்டது. ${res.estimatedResolution} இல் தீர்வு.`,
                'success'
            );

            // Reset form
            setSelectedBusiness('');
            setGrievanceType('');
            setDescription('');
            fetchGrievances();
            setView('list');
        } catch (err) {
            showToast(isEn ? 'Submission failed' : 'சமர்ப்பிப்பு தோல்வி', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="section-container">
            {/* Header */}
            <div className="text-center mb-10 reveal-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                    <Scale className="h-4 w-4 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                        {isEn ? 'Grievance Redressal Pipeline' : 'குறை தீர்வு அமைப்பு'}
                    </span>
                </div>
                <h2 className="h-display text-4xl md:text-5xl mb-3">
                    {isEn ? 'ADMINISTRATIVE ' : 'நிர்வாக '}
                    <span className="text-glow">{isEn ? 'JUSTICE' : 'நீதி'}</span>
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-sm">
                    {isEn
                        ? 'Contest AI decisions, dispute flagged statuses, or report errors. Every grievance is blockchain-audited for transparency.'
                        : 'AI முடிவுகளை சவால் செய்யுங்கள், கொடியிடப்பட்ட நிலைகளை எதிர்க்கவும் அல்லது பிழைகளைப் புகாரளிக்கவும்.'}
                </p>
            </div>

            {/* Tab Toggle */}
            <div className="flex justify-center gap-2 mb-8">
                <button
                    onClick={() => setView('form')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${view === 'form' ? 'bg-blue-500 text-white shadow-neon-blue' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                    style={{ minHeight: 44 }}
                >
                    <Send className="h-4 w-4 inline mr-2" />
                    {isEn ? 'File Grievance' : 'குறை பதிவு'}
                </button>
                <button
                    onClick={() => setView('list')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${view === 'list' ? 'bg-blue-500 text-white shadow-neon-blue' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                    style={{ minHeight: 44 }}
                >
                    <Clock className="h-4 w-4 inline mr-2" />
                    {isEn ? 'Track Status' : 'நிலை கண்காணிப்பு'} ({grievances.length})
                </button>
            </div>

            {view === 'form' ? (
                /* ============ FILING FORM ============ */
                <div className="max-w-2xl mx-auto glass-card rounded-2xl p-8 reveal-up">
                    <div className="space-y-6">
                        {/* Step 1: Select Business */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">
                                {isEn ? 'Step 1 — Select Business' : 'படி 1 — வணிகத்தைத் தேர்ந்தெடுக்கவும்'}
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedBusiness}
                                    onChange={e => setSelectedBusiness(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white focus:border-blue-500/50 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="">{isEn ? 'Choose a business...' : 'ஒரு வணிகத்தைத் தேர்ந்தெடுக்கவும்...'}</option>
                                    {businesses.map(b => (
                                        <option key={b.id} value={b.id}>{b.tradeName} — {b.status}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Step 2: Grievance Type */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">
                                {isEn ? 'Step 2 — Grievance Type' : 'படி 2 — குறை வகை'}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {GRIEVANCE_TYPES.map(type => (
                                    <button
                                        key={type.value}
                                        onClick={() => setGrievanceType(type.value)}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left text-sm transition-all ${grievanceType === type.value
                                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                                            : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-white'
                                        }`}
                                        style={{ minHeight: 44 }}
                                    >
                                        {type.icon}
                                        <span className="font-medium text-xs">{isEn ? type.label : type.labelTa}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 3: Description */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">
                                {isEn ? 'Step 3 — Describe Your Issue' : 'படி 3 — உங்கள் சிக்கலை விவரிக்கவும்'}
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                                placeholder={isEn ? 'Provide details about your grievance. This will be reviewed by a municipal officer.' : 'உங்கள் குறை பற்றிய விவரங்களை வழங்கவும்.'}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:border-blue-500/50 outline-none resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            onClick={submitGrievance}
                            disabled={submitting || !selectedBusiness || !grievanceType || !description.trim()}
                            className="w-full btn-customer rounded-xl disabled:opacity-40"
                        >
                            {submitting ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {isEn ? 'Filing to Blockchain...' : 'பிளாக்செயினில் பதிவு செய்கிறது...'}
                                </div>
                            ) : (
                                <>
                                    <Gavel className="h-4 w-4" />
                                    {isEn ? 'Submit Grievance' : 'குறையை சமர்ப்பிக்கவும்'}
                                </>
                            )}
                        </button>

                        <p className="text-[10px] text-slate-600 text-center">
                            {isEn
                                ? '🔒 Every submission is recorded on the blockchain audit trail for transparency.'
                                : '🔒 ஒவ்வொரு சமர்ப்பிப்பும் வெளிப்படைத்தன்மைக்காக பிளாக்செயின் தணிக்கையில் பதிவு செய்யப்படுகிறது.'}
                        </p>
                    </div>
                </div>
            ) : (
                /* ============ TRACKING LIST ============ */
                <div className="glass-card rounded-2xl overflow-hidden reveal-up">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="h-8 w-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-slate-500 text-xs">{isEn ? 'Loading...' : 'ஏற்றுகிறது...'}</p>
                        </div>
                    ) : grievances.length === 0 ? (
                        <div className="p-12 text-center">
                            <Scale className="h-12 w-12 text-slate-800 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm">{isEn ? 'No grievances filed yet.' : 'இன்னும் குறைகள் பதிவு செய்யப்படவில்லை.'}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.03]">
                            {grievances.map(g => {
                                const statusCfg = STATUS_CONFIG[g.status] || STATUS_CONFIG.SUBMITTED;
                                const typeInfo = GRIEVANCE_TYPES.find(t => t.value === g.grievance_type);
                                return (
                                    <div key={g.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-[10px] font-mono text-slate-600">#{g.id}</span>
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${statusCfg.bg} ${statusCfg.color}`}>
                                                        {statusCfg.icon} {g.status.replace('_', ' ')}
                                                    </span>
                                                    {g.priority === 'HIGH' && (
                                                        <span className="badge-risk-high text-[8px] py-0.5 px-2">
                                                            {isEn ? 'HIGH' : 'உயர்'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-semibold text-sm mb-1">{g.business_name || 'Unknown Business'}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                                                    {typeInfo?.icon}
                                                    <span>{isEn ? typeInfo?.label : typeInfo?.labelTa}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 line-clamp-2">{g.description}</p>
                                                {g.resolution_notes && (
                                                    <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                                                        <p className="text-[10px] font-bold uppercase text-emerald-500 mb-1">{isEn ? 'Resolution' : 'தீர்வு'}</p>
                                                        <p className="text-xs text-slate-300">{g.resolution_notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] text-slate-600">
                                                    {new Date(g.submitted_at).toLocaleDateString(isEn ? 'en-IN' : 'ta-IN')}
                                                </p>
                                                {g.escalation_level > 0 && (
                                                    <p className="text-[9px] text-orange-500 mt-1">Level {g.escalation_level} Escalation</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
