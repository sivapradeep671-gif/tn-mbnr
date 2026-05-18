import React, { useState } from 'react';
import { ArrowRight, UserPlus, Fingerprint, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CitizenRegistrationProps {
    onComplete: () => void;
}

export const CitizenRegistration: React.FC<CitizenRegistrationProps> = ({ onComplete }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setStep(3);
        }, 1500);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-20 reveal-up">
            <div className="glass-card p-12 rounded-[3.5rem] border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 mesh-gradient opacity-10 pointer-events-none" />
                
                {step < 3 && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                        <div 
                            className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" 
                            style={{ width: `${(step / 2) * 100}%` }}
                        ></div>
                    </div>
                )}

                {step === 1 && (
                    <div className="animate-fade-in text-center relative z-10">
                        <div className="inline-flex p-6 rounded-[2rem] bg-blue-500/10 mb-8 border border-blue-500/20 shadow-2xl shadow-blue-500/10 rotate-3">
                            <UserPlus className="h-12 w-12 text-blue-500" />
                        </div>
                        <h2 className="h-display text-4xl mb-4 mt-0">{t.citizen_reg.title}</h2>
                        <p className="text-slate-400 mb-12 text-lg font-medium leading-relaxed max-w-md mx-auto">
                            {t.citizen_reg.subtitle}
                        </p>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full bg-white text-slate-950 h-display text-xl py-6 rounded-3xl transition-all hover:bg-blue-500 hover:text-white shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 border-none"
                        >
                            {t.citizen_reg.initiate} <ArrowRight className="h-6 w-6" />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="animate-fade-in relative z-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <Fingerprint className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="h-display text-2xl mt-0 mb-0">{t.citizen_reg.step2_title}</h2>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t.citizen_reg.step2_subtitle}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="group/field">
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest group-focus-within/field:text-blue-500 transition-colors">{t.citizen_reg.labels.aadhaar}</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder={t.citizen_reg.placeholders.aadhaar} 
                                    className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-lg placeholder:opacity-30" 
                                />
                            </div>
                            <div className="group/field">
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest group-focus-within/field:text-blue-500 transition-colors">{t.citizen_reg.labels.mobile}</label>
                                <input 
                                    type="tel" 
                                    required 
                                    placeholder={t.citizen_reg.placeholders.mobile} 
                                    className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-lg placeholder:opacity-30" 
                                />
                            </div>

                            <div className="flex items-start gap-3 mt-4 mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                <input 
                                    type="checkbox" 
                                    id="dpdp-consent" 
                                    required 
                                    className="mt-1 w-4 h-4 bg-white/5 border-white/20 rounded text-blue-500 focus:ring-blue-500/50 accent-blue-500 cursor-pointer"
                                />
                                <label htmlFor="dpdp-consent" className="text-[11px] text-slate-300 leading-relaxed cursor-pointer">
                                    I provide explicit consent under the <strong>DPDP Act 2023</strong> for TN-MBNR to fetch and temporarily process my identity from DigiLocker/UIDAI for verification purposes only. I understand I can revoke this consent at any time.
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 text-white h-display text-xl py-6 rounded-3xl transition-all hover:bg-blue-500 shadow-2xl disabled:opacity-30 disabled:grayscale active:scale-[0.98] border-none"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        {t.citizen_reg.verifying}
                                    </span>
                                ) : t.citizen_reg.submit}
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <div className="text-center animate-reveal-up py-4 relative z-10">
                        <div className="relative inline-flex mb-10">
                            <div className="absolute inset-0 bg-green-500 blur-3xl opacity-30 rounded-full animate-pulse"></div>
                            <div className="relative w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-green-500/30">
                                <ShieldCheck className="h-12 w-12 text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,1)]" />
                            </div>
                        </div>
                        <h2 className="h-display text-4xl mb-4 mt-0">{t.citizen_reg.success_title}</h2>
                        <p className="text-slate-400 mb-12 text-lg font-medium leading-relaxed max-w-md mx-auto">
                            {t.citizen_reg.success_subtitle}
                        </p>

                        <button
                            onClick={onComplete}
                            className="w-full bg-white text-slate-950 h-display text-xl py-6 rounded-3xl transition-all hover:bg-yellow-500 shadow-2xl active:scale-[0.98] border-none"
                        >
                            {t.citizen_reg.enter}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};