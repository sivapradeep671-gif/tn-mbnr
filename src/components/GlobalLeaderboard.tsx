import React from 'react';
import { Trophy, Medal, X, Shield, Award, Zap } from 'lucide-react';

interface LeaderboardProps {
    onClose: () => void;
}

export const GlobalLeaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
    const leaders = [
        { id: 1, name: 'S. Rajendran', ward: 'Chennai Zone 4', xp: 12500, title: 'Grand Master Warden', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raj' },
        { id: 2, name: 'P. Kavitha', ward: 'Madurai North', xp: 11200, title: 'Elite Warden', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kav' },
        { id: 3, name: 'M. Karthik', ward: 'Coimbatore West', xp: 9850, title: 'Elite Warden', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kar' },
        { id: 4, name: 'A. Lakshmi', ward: 'Trichy Central', xp: 8400, title: 'Civic Scout', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lak' },
        { id: 5, name: 'R. Venkatesh', ward: 'Salem South', xp: 7100, title: 'Civic Scout', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ven' },
        // Current user mock placement
        { id: 42, name: 'You', ward: 'Your Local Ward', xp: 850, title: 'Novice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You', isUser: true },
    ];

    const getRankColor = (index: number) => {
        switch(index) {
            case 0: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 1: return 'text-slate-300 bg-slate-300/10 border-slate-300/30';
            case 2: return 'text-amber-600 bg-amber-600/10 border-amber-600/30';
            default: return 'text-slate-400 bg-slate-800/50 border-slate-700/50';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Trophy className="w-64 h-64 text-yellow-500" />
                </div>

                <div className="p-6 sm:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-2">
                            <Medal className="h-3 w-3" />
                            Hall of Fame
                        </div>
                        <h2 className="text-2xl font-black text-white">Statewide Leaderboard</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors group"
                    >
                        <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 relative z-10">
                    {leaders.map((leader, index) => (
                        <div 
                            key={leader.id} 
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${leader.isUser ? 'bg-yellow-500/5 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : getRankColor(index)}`}
                        >
                            <div className="w-10 text-center font-black text-xl">
                                {index < 3 ? `#${index + 1}` : (leader.isUser ? '42' : index + 1)}
                            </div>
                            
                            <img src={leader.avatar} alt="avatar" className="w-12 h-12 rounded-full bg-slate-800 border-2 border-white/10" />
                            
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-white">{leader.name}</h3>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    {index === 0 ? <Shield className="w-3 h-3 text-yellow-500" /> : <Award className="w-3 h-3" />}
                                    {leader.title} • {leader.ward}
                                </p>
                            </div>
                            
                            <div className="text-right">
                                <p className="text-xl font-black text-white flex items-center gap-1 justify-end">
                                    {leader.xp.toLocaleString()} <Zap className="w-4 h-4 text-yellow-500" />
                                </p>
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Trust XP</p>
                            </div>
                        </div>
                    ))}
                    
                    <div className="text-center py-6">
                        <div className="w-1 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
                        <div className="w-1 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
                        <div className="w-1 h-1 bg-slate-700 rounded-full mx-auto mb-6" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {12450} Citizens Active Statewide
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
