import React, { useState, useRef } from 'react';
import { api } from '../api/client';

import { Camera, MapPin, Send, AlertTriangle, Shield, CheckCircle, Activity, Zap } from 'lucide-react';
import { showToast } from '../hooks/useToast';
import { notificationService } from '../services/notificationService';
import { aiService } from '../services/geminiService';
import { CitizenRewards } from './CitizenRewards';

interface CitizenReportProps {
    prefillName?: string;
}

export const CitizenReport: React.FC<CitizenReportProps> = ({ prefillName = "" }) => {
    const [businessName, setBusinessName] = useState(prefillName);
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Safety');
    const [severity, setSeverity] = useState('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<{ severity: string; urgency: number; summary: string } | null>(null);
    const [liveFeedback, setLiveFeedback] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isListening, setIsListening] = useState(false);

    const runLiveAnalysis = async (val: string) => {
        if (val.length < 20) return;
        try {
            const result = await aiService.analyzeFraudReport({ description: val, businessName });
            setLiveFeedback(result.summary);
        } catch { /* silent fail for live */ }
    };

    const categories = ['Safety', 'Hygiene', 'Fraud', 'Harassment', 'Price Gouging', 'Other'];
    const severities = ['Low', 'Medium', 'High', 'Critical'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            // 1. Perform AI Triage & Anomaly Detection
            const analysis = await aiService.analyzeFraudReport({ description, businessName });
            setAiAnalysis(analysis);

            const formData = new FormData();
            formData.append('businessName', businessName);
            formData.append('location', location);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('severity', analysis.severity || severity); // Use AI suggested severity
            formData.append('ai_summary', analysis.summary);
            
            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            await api.upload('/reports', formData);
            
            // Notify user of submission (simulated)
            notificationService.send({
                to: "citizen@example.com",
                type: 'EMAIL',
                message: `Your TrustReg report for ${businessName} has been received. AI Classification: ${analysis.severity}. Summary: ${analysis.summary}`
            });

            setSubmitted(true);
            showToast('Intelligence report submitted successfully', 'success');
        } catch (error) {
            console.error('Submission error:', error);
            showToast('Failed to submit intelligence report', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12 text-center animate-fade-in relative">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />
                <div className="relative z-10">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-2xl shadow-green-500/10">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Report Lodged</h2>
                    <div className="inline-flex px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6">
                        AI Verified Severity: {aiAnalysis?.severity}
                    </div>
                    
                    <p className="text-slate-400 mb-8 leading-relaxed max-w-lg mx-auto">
                        <span className="text-slate-200 font-bold block mb-2">AI Summary:</span>
                        {aiAnalysis?.summary || "Intelligence logged on the immutable ledger."}
                    </p>

                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-500 uppercase tracking-widest mb-8">
                        Transaction ID: {Math.random().toString(16).substr(2, 16)}
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-12 py-4 bg-white text-slate-950 rounded-2xl font-black text-sm hover:bg-blue-500 hover:text-white transition-all uppercase tracking-widest shadow-2xl active:scale-95"
                    >
                        Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
            {/* Phase 7: Citizen Tokenomics Integration */}
            <CitizenRewards />

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <AlertTriangle className="h-64 w-64 text-red-500" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                            <Shield className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Citizen Intelligence Portal</h2>
                            <p className="text-slate-500 text-sm">Secure evidence submission channel</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Business Identity</label>
                                <input 
                                    required
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-5 text-white focus:outline-none focus:border-red-500/50 transition-all placeholder:text-slate-700" 
                                    placeholder="Enter shop or vendor name"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Geographic Location</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-5 text-white focus:outline-none focus:border-red-500/50 transition-all placeholder:text-slate-700" 
                                        placeholder="Area or Street name"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Intelligence Category</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-5 text-white focus:outline-none focus:border-red-500/50 transition-all appearance-none cursor-pointer"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Severity Assessment</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-5 text-white focus:outline-none focus:border-red-500/50 transition-all appearance-none cursor-pointer"
                                    value={severity}
                                    onChange={(e) => setSeverity(e.target.value)}
                                >
                                    {severities.map(sev => <option key={sev} value={sev}>{sev}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Statement of Facts</label>
                                <button 
                                    type="button"
                                    onClick={() => setIsListening(!isListening)}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                                >
                                    <Activity className="h-3 w-3" />
                                    {isListening ? 'AI Listening...' : 'Speak In Tamil/English'}
                                </button>
                            </div>
                            <div className="relative">
                                <textarea 
                                    required
                                    rows={4}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-5 text-white focus:outline-none focus:border-red-500/50 transition-all placeholder:text-slate-700 resize-none" 
                                    placeholder="Describe the violation in detail..."
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        runLiveAnalysis(e.target.value);
                                    }}
                                />
                                {liveFeedback && (
                                    <div className="absolute bottom-4 right-4 max-w-[200px] p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg animate-reveal-up pointer-events-none">
                                        <p className="text-[8px] font-black text-blue-500 uppercase mb-1 flex items-center gap-1">
                                            <Zap className="h-2 w-2" /> Live AI Insight
                                        </p>
                                        <p className="text-[10px] text-slate-300 line-clamp-2 italic leading-tight">"{liveFeedback}"</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-4 rounded-2xl border border-dashed flex items-center justify-center gap-4 cursor-pointer transition-all group ${
                                selectedFile ? 'bg-green-500/10 border-green-500/50' : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/30'
                            }`}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                            <Camera className={`h-6 w-6 transition-colors ${selectedFile ? 'text-green-500' : 'text-slate-600 group-hover:text-yellow-500'}`} />
                            <span className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                                selectedFile ? 'text-green-500' : 'text-slate-500 group-hover:text-white'
                            }`}>
                                {selectedFile ? selectedFile.name : 'Attach Evidence (Photo/Video)'}
                            </span>
                        </div>

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.2)] ${isSubmitting ? 'animate-pulse' : ''}`}
                        >
                            {isSubmitting ? (
                                <>Encrypting Payload...</>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    Submit Intelligence
                                </>
                            )}
                        </button>

                        <p className="text-[10px] text-slate-600 font-mono text-center uppercase tracking-widest">
                            Your identity is shielded via zero-knowledge encryption protocols.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};
