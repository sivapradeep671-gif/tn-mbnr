import React from 'react';
import { Check, Shield, Building, Building2, Crown } from 'lucide-react';

const PLANS = [
    {
        name: 'Township',
        price: '₹39,999',
        period: '/mo',
        description: 'Ideal for small municipalities and local wards.',
        icon: Building,
        color: 'text-blue-400',
        features: [
            'Up to 10,000 Citizens',
            'Basic Registry Module',
            'Grievance Redressal',
            'Standard SLA Tracking',
            'Email Support'
        ],
        cta: 'Start Demo',
        popular: false
    },
    {
        name: 'Smart City',
        price: '₹1,49,999',
        period: '/mo',
        description: 'Advanced features for large urban centers.',
        icon: Building2,
        color: 'text-yellow-500',
        features: [
            'Unlimited Citizens',
            'Full Registry + Audit Pro',
            'Blockchain Verification',
            'AI Helpdesk (Beta)',
            '24/7 Priority Support',
            'Custom Branding'
        ],
        cta: 'Enable Smart City',
        popular: true
    },
    {
        name: 'State Enterprise',
        price: 'Custom',
        period: '',
        description: 'Unified governance for entire states or regions.',
        icon: Crown,
        color: 'text-purple-400',
        features: [
            'Multi-District Hub',
            'Integrated Payment Gateway',
            'Custom Policy Engine',
            'Air-Gapped Deployment',
            'Dedicated Account Manager',
            'Strategic Advisory'
        ],
        cta: 'Contact Sales',
        popular: false
    }
];

export const SaaSPricing: React.FC = () => {
    return (
        <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-7xl font-black mb-8 leading-tight">
                    Governance <span className="text-glow">As A Service</span>
                </h2>
                <p className="text-slate-400 text-xl max-w-3xl mx-auto font-medium">
                    Flexible plans designed to modernize civic infrastructure at any scale. No hardware, no hassle, just trust.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {PLANS.map((plan, i) => (
                    <div 
                        key={i}
                        className={`relative group bg-slate-900/50 border ${plan.popular ? 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.1)]' : 'border-slate-800'} rounded-[2.5rem] p-10 flex flex-col transition-all duration-500 hover:border-slate-600`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-xl">
                                Most Popular
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-8">
                            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${plan.color}`}>
                                <plan.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black">{plan.name}</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{plan.description}</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <span className="text-5xl font-black">{plan.price}</span>
                            <span className="text-slate-500 text-lg ml-1">{plan.period}</span>
                        </div>

                        <div className="space-y-5 mb-12 flex-grow">
                            {plan.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="mt-1 bg-green-500/20 rounded-full p-0.5">
                                        <Check className="h-3 w-3 text-green-500" />
                                    </div>
                                    <span className="text-slate-300 text-sm font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                            plan.popular 
                            ? 'bg-yellow-500 text-slate-950 hover:bg-yellow-400 hover:scale-[1.02] shadow-2xl shadow-yellow-500/20' 
                            : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                        }`}>
                            {plan.cta}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-24 p-12 bg-slate-900/30 border border-slate-800/50 rounded-[3rem] text-center relative overflow-hidden">
                <div className="absolute inset-0 mesh-gradient opacity-10 pointer-events-none" />
                <div className="relative z-10">
                    <Shield className="h-12 w-12 text-blue-500 mx-auto mb-6" />
                    <h3 className="text-3xl font-black mb-4">Enterprise Grade Security</h3>
                    <p className="text-slate-400 max-w-2xl mx-auto mb-8">
                        All plans include ISO 27001 compliance, GDPR data residency, and 256-bit encryption for sensitive citizen data.
                    </p>
                    <div className="flex flex-wrap justify-center gap-8 opacity-50">
                        {['HIPAA', 'SOC2', 'GDPR', 'MEITY'].map((cert) => (
                            <span key={cert} className="text-xs font-black tracking-widest border border-slate-700 px-4 py-2 rounded-lg">{cert}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
