import React, { useState } from 'react';
import { Send, MessageSquare, Mail, AlertTriangle, Users, Search } from 'lucide-react';
import type { Business } from '../types/types';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../hooks/useToast';
import { api } from '../api/client';

interface CommunicationsHubProps {
    businesses: Business[];
}

export const CommunicationsHub: React.FC<CommunicationsHubProps> = ({ businesses }) => {
    const { t } = useLanguage();
    const [mode, setMode] = useState<'SMS' | 'EMAIL'>('SMS');
    const [selectedWards, setSelectedWards] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [isDispatching, setIsDispatching] = useState(false);

    const wards = ['W01', 'W04', 'W08', 'W12', 'W15'];

    const toggleWard = (ward: string) => {
        setSelectedWards(prev => prev.includes(ward) ? prev.filter(w => w !== ward) : [...prev, ward]);
    };

    const targetBusinesses = businesses.filter(b => 
        selectedWards.length === 0 || 
        selectedWards.some(w => b.address?.includes(w) || b.id.includes(w))
    );

    const handleDispatch = async () => {
        if (!message) {
            showToast('Message body cannot be empty', 'warning');
            return;
        }
        if (targetBusinesses.length === 0) {
            showToast('No targets selected', 'warning');
            return;
        }

        setIsDispatching(true);

        try {
            // Simulate parallel dispatch using our node hub
            const promises = targetBusinesses.map(b => {
                if (mode === 'SMS') {
                    return api.post('/notify-sms', { to: b.contactNumber || '+910000000000', body: message });
                } else {
                    return api.post('/notify-email', { 
                        to: `${b.id.toLowerCase()}@tn-mbnr.mock.in`, 
                        subject: subject || 'Municipal Advisory', 
                        html: message 
                    });
                }
            });

            await Promise.allSettled(promises);
            showToast(`Successfully dispatched to ${targetBusinesses.length} nodes`, 'success');
            setMessage('');
            setSubject('');
        } catch (err) {
            showToast('Dispatch failed', 'error');
        } finally {
            setIsDispatching(false);
        }
    };

    return (
        <div className="glass-card p-8 rounded-[2rem] border-white/5 bg-slate-950/60 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="h-display text-2xl flex items-center gap-3">
                        <MessageSquare className="h-6 w-6 text-indigo-400" />
                        Communications <span className="text-glow text-indigo-400">Hub</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-1">Twilio & SendGrid Node</p>
                </div>
                
                <div className="flex bg-slate-900 rounded-xl p-1 border border-white/5">
                    <button 
                        onClick={() => setMode('SMS')}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                            mode === 'SMS' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        SMS Alert
                    </button>
                    <button 
                        onClick={() => setMode('EMAIL')}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                            mode === 'EMAIL' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        Email Broadcast
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                            <Search className="h-4 w-4" /> Target Zones
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {wards.map(w => (
                                <button 
                                    key={w}
                                    onClick={() => toggleWard(w)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all border ${
                                        selectedWards.includes(w) 
                                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' 
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                    }`}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-900/80 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="h-4 w-4 text-indigo-400" />
                            <span className="text-xs font-bold text-slate-300">Audience Estimate</span>
                        </div>
                        <p className="text-3xl font-black text-white tabular-nums">{targetBusinesses.length}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Matched Nodes</p>
                    </div>

                    <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-yellow-500/80 font-bold leading-relaxed">
                                Messages are dispatched immediately to all matching nodes. Use cautiously.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {mode === 'EMAIL' && (
                        <input 
                            type="text" 
                            placeholder="Subject Line"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                        />
                    )}
                    
                    <textarea 
                        placeholder={mode === 'SMS' ? "Enter 160-character SMS..." : "Enter HTML or Text Email Body..."}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        className="w-full h-32 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors resize-none"
                    />

                    <div className="flex justify-end">
                        <button 
                            onClick={handleDispatch}
                            disabled={isDispatching || !message}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                isDispatching || !message 
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30'
                            }`}
                        >
                            {isDispatching ? (
                                <span className="animate-pulse">Dispatching...</span>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" /> Dispatch Payload
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
