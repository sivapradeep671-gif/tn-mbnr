import React, { useMemo, useState, useEffect } from 'react';
import { 
    Users, 
    ShieldAlert, 
    TrendingUp, 
    Landmark, 
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Zap,
    AlertCircle,
    Bot
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Business, CitizenReport } from '../types/types';
import { CommunicationsHub } from './CommunicationsHub';
import { aiService } from '../services/geminiService';
import { Loader2 } from 'lucide-react';

interface ExecutiveDashboardProps {
    businesses: Business[];
    reports: CitizenReport[];
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ businesses }) => {
    const { t, language } = useLanguage();
    const [aiInsights, setAiInsights] = useState<{yieldOpportunity: string, riskAdvisory: string} | null>(null);
    const [isAILoading, setIsAILoading] = useState(false);

    useEffect(() => {
        const fetchInsights = async () => {
            setIsAILoading(true);
            try {
                const insights = await aiService.getStrategicAdvice(businesses);
                setAiInsights(insights);
            } catch (error) {
                console.error("Failed to fetch strategic insights", error);
            } finally {
                setIsAILoading(false);
            }
        };
        fetchInsights();
    }, [businesses]);

    // Dynamic KPI Calculation
    const stats = useMemo(() => {
        const total = businesses.length;
        const verified = businesses.filter(b => b.status === 'Verified').length;
        const complianceIndex = total > 0 ? (verified / total) * 100 : 0;
        const highRisk = businesses.filter(b => (b.riskScore || 0) > 70).length;
        
        // Mock revenue calculation based on business count and category weights
        const projectedRevenue = businesses.reduce((acc, b) => {
            const base = b.category === 'Industrial' ? 50000 : 15000;
            return acc + base;
        }, 0) / 1000000; // in Millions

        return {
            total,
            verified,
            complianceIndex: complianceIndex.toFixed(1),
            highRisk,
            revenue: `₹${projectedRevenue.toFixed(1)}M`
        };
    }, [businesses]);

    const kpis = [
        { 
            label: t.executive.kpis.revenue, 
            value: stats.revenue, 
            change: '+14.2%', 
            trend: 'up', 
            icon: Landmark, 
            color: 'text-green-500',
            sub: 'Projected Regional Yield'
        },
        { 
            label: t.executive.kpis.compliance, 
            value: `${stats.complianceIndex}%`, 
            change: '+3.5%', 
            trend: 'up', 
            icon: TrendingUp, 
            color: 'text-indigo-400',
            sub: 'Verification Ratio'
        },
        { 
            label: t.executive.kpis.risk, 
            value: stats.highRisk.toString(), 
            change: '-12%', 
            trend: 'down', 
            icon: ShieldAlert, 
            color: 'text-red-500',
            sub: 'Forensic Flags Active'
        },
        { 
            label: t.executive.kpis.verified, 
            value: stats.verified.toLocaleString(), 
            change: `+${businesses.filter(b => b.status === 'Verified').length}`, 
            trend: 'up', 
            icon: Users, 
            color: 'text-yellow-500',
            sub: 'Authentic Trust-IDs'
        }
    ];

    // Dynamic Ward Analysis
    const wardPerformance = useMemo(() => {
        const wards = ['W01', 'W04', 'W08', 'W12', 'W15'];
        // Use a deterministic seed from ward name instead of Math.random() (impure)
        const deterministicBase = (ward: string) => {
            let h = 0;
            for (let i = 0; i < ward.length; i++) h = (h * 31 + ward.charCodeAt(i)) & 0xffff;
            return h;
        };
        return wards.map(w => {
            const wardBusinesses = businesses.filter(b => b.address?.includes(w) || b.id.includes(w));
            const count = wardBusinesses.length;
            const verified = wardBusinesses.filter(b => b.status === 'Verified').length;
            const seed = deterministicBase(w);
            const compliance = count > 0 ? (verified / count) * 100 : (seed % 20) + 75;
            const revenue = count > 0 ? `₹${(count * 0.8).toFixed(1)}M` : `₹${((seed % 500) / 100 + 5).toFixed(1)}M`;
            
            return {
                ward: `${w} - Strategic Node`,
                compliance: Math.min(Math.round(compliance), 100),
                revenue
            };
        }).sort((a, b) => b.compliance - a.compliance);
    }, [businesses]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-reveal-up relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-40 left-0 -z-10 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px]" />

            {/* Executive Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500 rounded-lg shadow-2xl shadow-indigo-500/50">
                            <Landmark className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="h-display text-4xl italic">
                            {t.executive.title.split(' ')[0]} <span className="text-glow text-indigo-400">{t.executive.title.split(' ')[1] || 'Command'}</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 text-xs font-black tracking-[0.3em] uppercase">{t.executive.subtitle} v3.1</p>
                </div>
                
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all group">
                        <Download className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" /> Export Report
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/40 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all">
                        <Zap className="h-4 w-4" /> Global Audit
                    </button>
                </div>
            </div>

            {/* Strategic KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
                {kpis.map((kpi, i) => (
                    <div key={i} className="glass-card p-8 rounded-[2rem] border-white/5 bg-white/[0.02] relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-white/10 transition-colors" />
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl bg-slate-900 border border-white/5 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500 ${kpi.color}`}>
                                <kpi.icon className="h-6 w-6" />
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-black/20 text-[10px] font-black ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                {kpi.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {kpi.change}
                            </div>
                        </div>
                        <h3 className="text-4xl font-black text-white mb-1 tracking-tighter tabular-nums">{kpi.value}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 group-hover:text-slate-200 transition-colors">{kpi.label}</p>
                        <p className="text-[9px] text-slate-600 font-medium">{kpi.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {/* Ward Rankings */}
                <div className="lg:col-span-2 glass-card p-10 rounded-[2.5rem] border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="h-display text-2xl">{t.executive.wards.title.split(' ')[0]} <span className="text-glow text-indigo-400">{t.executive.wards.title.split(' ')[1]}</span></h3>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{t.executive.wards.analytics}</p>
                        </div>
                        <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors border-b border-indigo-400/20 pb-1">View All 48 Wards</button>
                    </div>

                    <div className="space-y-8">
                        {wardPerformance.map((ward, i) => (
                            <div key={i} className="group">
                                <div className="flex justify-between items-end mb-3">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl font-black text-slate-800 tabular-nums grayscale group-hover:grayscale-0 transition-all">0{i+1}</span>
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{ward.ward}</p>
                                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Sector Priority Alpha</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-4">
                                            <span className="text-base font-black text-white tabular-nums">{ward.revenue}</span>
                                            <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20 shadow-lg shadow-green-500/5">
                                                {ward.compliance}% INDEX
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-500 transition-all duration-1000 group-hover:brightness-125 relative overflow-hidden" 
                                        style={{ width: `${ward.compliance}%` }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Real-time Risk Activity */}
                <div className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-red-500/[0.01] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    
                    <h3 className="h-display text-2xl mb-10 flex items-center gap-3">
                        {t.executive.alerts.title.split(' ')[0]} <span className="text-glow text-red-500">{t.executive.alerts.title.split(' ')[1]}</span>
                    </h3>
                    
                    <div className="space-y-10">
                    </div>
                </div>

                {/* AI Strategy Advisor */}
                <div className="lg:col-span-3">
                    <div className="glass-card p-1 sm:p-2 rounded-[3rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-slate-950 to-slate-950 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
                        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-yellow-500/5 rounded-full blur-[80px]" />
                        
                        <div className="relative z-10 p-10 flex flex-col md:flex-row gap-12 items-center">
                            <div className="shrink-0 relative">
                                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                                <div className="h-40 w-40 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 flex items-center justify-center relative bg-slate-900 shadow-2xl animate-spin-slow">
                                    <Bot className="h-16 w-16 text-indigo-400 -rotate-12" />
                                </div>
                                <div className="absolute -bottom-2 right-0 px-4 py-1.5 bg-yellow-500 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    Trust-AI v2.1
                                </div>
                            </div>

                            <div className="flex-1 space-y-6">
                                <div>
                                    <h3 className="h-display text-3xl mb-2 flex items-center gap-4">
                                        {language === 'ta' ? 'AI வியூக' : 'AI Strategic'} <span className="text-glow text-indigo-400">{language === 'ta' ? 'ஆலோசகர்' : 'Advisor'}</span>
                                        <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-black animate-pulse border border-green-500/20">LIVE ENGINE</div>
                                    </h3>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">{language === 'ta' ? 'Macroscopic நகராட்சி நுண்ணறிவு' : 'Macroscopic Municipal Intelligence'}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{language === 'ta' ? 'வளர்ச்சி வாய்ப்பு' : 'Yield Opportunity'}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed italic">
                                            {isAILoading ? (
                                                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-green-500"/> Processing Yield Matrix...</span>
                                            ) : (
                                                `"${aiInsights?.yieldOpportunity || (language === 'ta' ? 'தரவு காத்திருக்கிறது...' : 'Awaiting data...')}"`
                                            )}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{language === 'ta' ? 'அபாய எச்சரிக்கை' : 'Risk Advisory'}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed italic">
                                            {isAILoading ? (
                                                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-red-500"/> Triaging Risk Vectors...</span>
                                            ) : (
                                                `"${aiInsights?.riskAdvisory || (language === 'ta' ? 'தரவு காத்திருக்கிறது...' : 'Awaiting data...')}"`
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button className="px-8 py-3 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/40 hover:scale-105 transition-all">
                                        Execute AI Recommendations
                                    </button>
                                    <button className="px-8 py-3 bg-white/5 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-all">
                                        Recalibrate Neural Node
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Communications Hub (Phase 4) */}
            <div className="mt-12 relative z-10">
                <CommunicationsHub businesses={businesses} />
            </div>

            {/* Strategic Impact Dimensions */}
            <div className="mt-24 border-t border-white/5 pt-20">
                <div className="text-center mb-16">
                    <h2 className="h-display text-4xl mb-4 italic">
                        {language === 'ta' ? 'தாக்க' : 'Impact'} <span className="text-glow text-yellow-500">{language === 'ta' ? 'அளவீடுகள்' : 'Matrix'}</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{language === 'ta' ? 'நாட்டின் e-Governance எதிர்காலம்' : 'The Future of State e-Governance'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {t.impact.rows.map((item, i) => (
                        <div key={i} className="glass-card p-8 rounded-[2rem] border-white/5 bg-white/[0.01] group hover:bg-white/[0.03] transition-all">
                             <div className="flex items-center gap-4 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,1)]" />
                                <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{item.dim}</h4>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">{item.adv}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
