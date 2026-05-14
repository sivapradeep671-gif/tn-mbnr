import React, { useEffect, useState } from 'react';
import { Heart, TrendingUp, TrendingDown, Award, ShieldCheck, AlertTriangle, FileCheck2, Banknote, Star, ChevronRight } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface HealthData {
    id: string;
    tradeName: string;
    healthScore: number;
    grade: string;
    label: string;
    color: string;
    status: string;
    license_status: string;
}

interface Summary {
    totalBusinesses: number;
    averageScore: number;
    exemplary: number;
    atRisk: number;
    distribution: Record<string, number>;
}

// Circular Score Gauge
const ScoreGauge: React.FC<{ score: number; grade: string; color: string; size?: number }> = ({ score, grade, color, size = 120 }) => {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black font-display" style={{ color }}>{score}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{grade}</span>
            </div>
        </div>
    );
};

// Mini badge for inline use
export const HealthBadge: React.FC<{ score: number; grade: string; color: string; label: string }> = ({ score, grade, color, label }) => (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
         style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
        <Heart className="h-3 w-3" />
        <span>{score}</span>
        <span className="text-[8px] opacity-70 uppercase">{grade} · {label}</span>
    </div>
);

export const BusinessHealthDashboard: React.FC = () => {
    const { language } = useLanguage();
    const [scores, setScores] = useState<HealthData[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
    const [detailData, setDetailData] = useState<any>(null);

    useEffect(() => {
        fetchScores();
    }, []);

    const fetchScores = async () => {
        try {
            const res = await api.get<any>('/api/health-scores');
            setScores(res.data || []);
            setSummary(res.summary || null);
        } catch (err) {
            console.error('Failed to load health scores', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetail = async (businessId: string) => {
        setSelectedBusiness(businessId);
        try {
            const res = await api.get<any>(`/api/health-score/${businessId}`);
            setDetailData(res);
        } catch (err) {
            console.error('Failed to load detail', err);
        }
    };

    const isEn = language === 'en';

    if (loading) {
        return (
            <div className="section-container flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">
                        {isEn ? 'Computing Health Scores...' : 'ஆரோக்கிய மதிப்பீடு கணக்கிடுகிறது...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="section-container">
            {/* Header */}
            <div className="text-center mb-12 reveal-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                    <Heart className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                        {isEn ? 'Business Health Index' : 'வணிக ஆரோக்கிய குறியீடு'}
                    </span>
                </div>
                <h2 className="h-display text-4xl md:text-5xl mb-3">
                    {isEn ? 'COMPLIANCE ' : 'இணக்க '}
                    <span className="text-glow">{isEn ? 'CREDIT SCORE' : 'கடன் மதிப்பெண்'}</span>
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-sm">
                    {isEn
                        ? 'AI-powered health scores measuring tax compliance, citizen feedback, and municipal standing across all registered businesses.'
                        : 'அனைத்து பதிவு செய்யப்பட்ட வணிகங்களின் வரி இணக்கம், குடிமக்கள் கருத்து மற்றும் நகராட்சி நிலையை அளவிடும் AI-இயக்கப்படும் ஆரோக்கிய மதிப்பீடுகள்.'}
                </p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 reveal-up">
                    <div className="stat-card-gov">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="stat-value">{summary.averageScore}</div>
                        <div className="stat-label">{isEn ? 'Avg. Score' : 'சராசரி'}</div>
                    </div>
                    <div className="stat-card-gov">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div className="stat-value">{summary.exemplary}</div>
                        <div className="stat-label">{isEn ? 'Exemplary (A+)' : 'சிறந்தவை'}</div>
                    </div>
                    <div className="stat-card-gov">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="stat-value">{summary.atRisk}</div>
                        <div className="stat-label">{isEn ? 'At Risk' : 'ஆபத்தில்'}</div>
                    </div>
                    <div className="stat-card-gov">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="stat-value">{summary.totalBusinesses}</div>
                        <div className="stat-label">{isEn ? 'Total Tracked' : 'மொத்தம்'}</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Business List */}
                <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                            {isEn ? 'Business Health Leaderboard' : 'வணிக ஆரோக்கிய பட்டியல்'}
                        </h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        {scores.map((biz, i) => (
                            <button
                                key={biz.id}
                                onClick={() => fetchDetail(biz.id)}
                                className={`w-full flex items-center gap-4 p-4 text-left transition-all duration-200 hover:bg-white/[0.03] border-b border-white/[0.03] ${selectedBusiness === biz.id ? 'bg-white/[0.05]' : ''}`}
                            >
                                <span className="text-[10px] font-mono text-slate-600 w-6 text-right">{i + 1}</span>
                                <div className="relative">
                                    <ScoreGauge score={biz.healthScore} grade={biz.grade} color={biz.color} size={56} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{biz.tradeName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${biz.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-400' : biz.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            {biz.status}
                                        </span>
                                        <span className="text-[9px] text-slate-500">{biz.license_status || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black" style={{ color: biz.color }}>{biz.healthScore}</span>
                                    {biz.healthScore >= 70 ? (
                                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                    )}
                                    <ChevronRight className="h-4 w-4 text-slate-600" />
                                </div>
                            </button>
                        ))}
                        {scores.length === 0 && (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                {isEn ? 'No businesses registered yet.' : 'இன்னும் வணிகங்கள் பதிவு செய்யப்படவில்லை.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="glass-card rounded-2xl p-6">
                    {detailData ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <ScoreGauge score={detailData.healthScore} grade={detailData.grade} color={detailData.color} size={140} />
                                <h4 className="font-bold text-lg mt-3">{detailData.tradeName}</h4>
                                <span className="text-xs font-medium" style={{ color: detailData.color }}>{detailData.label}</span>
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-3">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {isEn ? 'Score Breakdown' : 'மதிப்பெண் பிரிவு'}
                                </h5>
                                {[
                                    { icon: <Banknote className="h-3.5 w-3.5" />, label: isEn ? 'Property Tax' : 'சொத்து வரி', value: detailData.breakdown?.taxCompliance?.property },
                                    { icon: <Banknote className="h-3.5 w-3.5" />, label: isEn ? 'Water Tax' : 'நீர் வரி', value: detailData.breakdown?.taxCompliance?.water },
                                    { icon: <Banknote className="h-3.5 w-3.5" />, label: isEn ? 'Professional Tax' : 'தொழில் வரி', value: detailData.breakdown?.taxCompliance?.professional },
                                    { icon: <FileCheck2 className="h-3.5 w-3.5" />, label: isEn ? 'License' : 'உரிமம்', value: detailData.breakdown?.licenseStatus },
                                    { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: isEn ? 'Verification' : 'சரிபார்ப்பு', value: detailData.breakdown?.verificationStatus },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-white/[0.02]">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </div>
                                        <span className={`font-semibold ${item.value === 'Paid' || item.value === 'Cleared' || item.value === 'ACTIVE' || item.value === 'Verified' ? 'text-emerald-400' : item.value === 'Defaulted' || item.value === 'Rejected' || item.value === 'SUSPENDED' ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {item.value || 'N/A'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Eligibility */}
                            {detailData.eligibility && (
                                <div className="space-y-2">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {isEn ? 'Eligibility' : 'தகுதி'}
                                    </h5>
                                    {[
                                        { label: isEn ? 'Subsidy Access' : 'மானிய அணுகல்', eligible: detailData.eligibility.subsidyAccess },
                                        { label: isEn ? 'Fast-Track Renewal' : 'விரைவு புதுப்பிப்பு', eligible: detailData.eligibility.fastTrackRenewal },
                                        { label: isEn ? 'Municipal Contracts' : 'நகராட்சி ஒப்பந்தங்கள்', eligible: detailData.eligibility.municipalContracts },
                                        { label: isEn ? 'Priority Support' : 'முன்னுரிமை ஆதரவு', eligible: detailData.eligibility.prioritySupport },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg">
                                            <span className="text-slate-400">{item.label}</span>
                                            {item.eligible ? (
                                                <span className="badge-verified text-[9px]"><Award className="h-3 w-3" /> {isEn ? 'Eligible' : 'தகுதி'}</span>
                                            ) : (
                                                <span className="text-slate-600 text-[9px]">—</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <Heart className="h-12 w-12 text-slate-800 mb-4" />
                            <p className="text-slate-500 text-sm">{isEn ? 'Select a business to view health details' : 'ஆரோக்கிய விவரங்களைக் காண ஒரு வணிகத்தைத் தேர்ந்தெடுக்கவும்'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
