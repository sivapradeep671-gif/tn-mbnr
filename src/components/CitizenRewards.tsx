import React, { useState } from 'react';
import { Award, Zap, Shield, ChevronRight, TrendingUp } from 'lucide-react';
import { GlobalLeaderboard } from './GlobalLeaderboard';

export const CitizenRewards: React.FC = () => {
    // Mock user points for the tokenomics demo
    const xp = 850;
    const nextTierXp = 1000;
    const progress = (xp / nextTierXp) * 100;
    
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    return (
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
            {/* Ambient Backgrounds */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-150" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -ml-16 -mb-16" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-4">
                            <Zap className="h-3 w-3" />
                            Civic Tokenomics
                        </div>
                        <h2 className="text-3xl font-black text-white flex items-center gap-3">
                            Trust <span className="text-glow text-yellow-400">Tokens</span>
                        </h2>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center min-w-[120px] shadow-xl">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Current Balance</p>
                        <p className="text-3xl font-black text-white tabular-nums flex justify-center items-baseline gap-1">
                            {xp} <span className="text-sm text-yellow-500">XP</span>
                        </p>
                    </div>
                </div>

                {/* Progress Bar to Next Tier */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs font-bold mb-3">
                        <span className="text-slate-400 flex items-center gap-2">
                            <Award className="h-4 w-4 text-slate-500" />
                            Level 4: Civic Scout
                        </span>
                        <span className="text-yellow-500 flex items-center gap-2">
                            Level 5: Elite Warden
                            <Shield className="h-4 w-4" />
                        </span>
                    </div>
                    <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5 shadow-inner relative">
                        <div 
                            className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-500 transition-all duration-1000 relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>
                    </div>
                    <p className="text-right text-[10px] text-slate-500 mt-2 font-mono">{nextTierXp - xp} XP to Next Tier</p>
                </div>

                {/* Ways to earn */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all group/item">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-slate-200">Verify Authentic QR</h4>
                            <span className="text-xs font-black text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md">+10 XP</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">Scan any valid business QR code to help maintain network integrity.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 transition-all group/item">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-slate-200">Flag Counterfeit</h4>
                            <span className="text-xs font-black text-red-400 bg-red-500/10 px-2 py-1 rounded-md">+50 XP</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">Report location mismatches or expired tokens to alert inspectors.</p>
                    </div>
                </div>

                <button 
                    onClick={() => setShowLeaderboard(true)}
                    className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                    <TrendingUp className="h-4 w-4" />
                    View Global Leaderboard
                </button>
            </div>

            {showLeaderboard && <GlobalLeaderboard onClose={() => setShowLeaderboard(false)} />}
        </div>
    );
};
