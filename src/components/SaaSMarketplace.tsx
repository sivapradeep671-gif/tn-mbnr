import React, { useState } from 'react';
import { 
    ShieldCheck, 
    Users, 
    CreditCard, 
    MapPin, 
    Database, 
    Cpu,
    CheckCircle2,
    ArrowRight,
    Zap,
    X,
    Loader2
} from 'lucide-react';
import { useSaaS } from '../context/SaaSContext';
import { showToast } from '../hooks/useToast';

const MODULES = [
    {
        id: 'registry',
        name: 'Smart Registry',
        description: 'Digitize business licenses and registrations with blockchain verification.',
        icon: Database,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        features: ['Automated Approvals', 'Blockchain Ledger', 'NIC Code Mapping']
    },
    {
        id: 'citizen',
        name: 'Citizen Portal',
        description: 'Omni-channel platform for citizen reports, applications, and feedback.',
        icon: Users,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        features: ['Aadhaar Integration', 'Report Heatmaps', 'Mobile App Support']
    },
    {
        id: 'payments',
        name: 'GovPay Gateway',
        description: 'Integrated fee collection and reconciliation for municipal taxes.',
        icon: CreditCard,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        features: ['UPI/Card Support', 'Dynamic Fee Slabs', 'Instant Receipts']
    },
    {
        id: 'audit',
        name: 'Field Audit Pro',
        description: 'Mobile-first tool for inspectors with geo-tagging and offline support.',
        icon: MapPin,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        features: ['Geo-fencing', 'Photo Evidence', 'Offline Sync']
    },
    {
        id: 'ai',
        name: 'AI Gov Assistant',
        description: 'LLM-powered assistant for policy lookup and automated citizen help.',
        icon: Cpu,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
        features: ['Multilingual Support', 'Policy Vector Search', 'Auto-drafting']
    },
    {
        id: 'security',
        name: 'TrustGuard MFA',
        description: 'Enterprise-grade security with multi-factor auth and audit trails.',
        icon: ShieldCheck,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        features: ['Biometric Auth', 'Immutable Logs', 'PII Encryption']
    }
];

export const SaaSMarketplace: React.FC = () => {
    const { currentTenant, toggleModule } = useSaaS();
    const [activatingModule, setActivatingModule] = useState<string | null>(null);
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [provisionStep, setProvisionStep] = useState(0);

    const activeModuleObj = MODULES.find(m => m.id === activatingModule);

    const handleEnable = (moduleId: string) => {
        setActivatingModule(moduleId);
        setProvisionStep(0);
    };

    const handleProvision = async () => {
        if (!activatingModule) return;
        setIsProvisioning(true);
        
        // Mock Provisioning Flow
        const steps = 3;
        for (let i = 1; i <= steps; i++) {
            setProvisionStep(i);
            await new Promise(r => setTimeout(r, 800));
        }

        toggleModule(activatingModule);
        setIsProvisioning(false);
        setActivatingModule(null);
        showToast('Module successfully provisioned and linked to tenant.', 'success');
    };

    const handleDisable = (moduleId: string) => {
        toggleModule(moduleId);
        showToast('Module deactivated successfully.', 'info');
    };

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto reveal-up">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <Zap className="h-3 w-3" />
                    SaaS Governance Hub
                </div>
                <h1 className="text-4xl sm:text-6xl font-black mb-6">
                    Enable <span className="text-glow">Digital Services</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Scale {currentTenant.name} with pre-built governance modules. One-click deployment to your local district node.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {MODULES.map((module) => {
                    const isEnabled = currentTenant.modules.includes(module.id);

                    return (
                        <div 
                            key={module.id}
                            className={`group relative bg-slate-900/40 border rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                                isEnabled ? 'border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.05)]' : 'border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            {/* Status Badge */}
                            <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                                isEnabled ? 'bg-green-500/10 text-green-500 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 
                                'bg-slate-800/50 text-slate-400 border border-slate-700/50'
                            }`}>
                                {isEnabled ? 'Active' : 'Available'}
                            </div>

                            {/* Icon */}
                            <div className={`w-14 h-14 ${module.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <module.icon className={`h-7 w-7 ${module.color}`} />
                            </div>

                            <h3 className="text-2xl font-black mb-3 text-white">{module.name}</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                {module.description}
                            </p>

                            <div className="space-y-3 mb-8">
                                {module.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                        <CheckCircle2 className={`h-3.5 w-3.5 ${isEnabled ? 'text-green-500' : 'text-slate-500'}`} />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => isEnabled ? handleDisable(module.id) : handleEnable(module.id)}
                                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 z-10 relative ${
                                isEnabled 
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20' 
                                : 'bg-white text-slate-950 hover:bg-yellow-500 shadow-xl shadow-white/5 hover:shadow-yellow-500/20'
                            }`}>
                                {isEnabled ? 'Deactivate Module' : 'Enable Service'}
                                {!isEnabled && <ArrowRight className="h-4 w-4" />}
                            </button>

                            {/* Hover Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isEnabled ? 'hidden' : ''}`} />
                        </div>
                    );
                })}
            </div>

            {/* Platform Stats */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 reveal-up" style={{ animationDelay: '0.2s' }}>
                {[
                    { label: 'Active Modules', value: currentTenant.modules.length.toString() },
                    { label: 'Citizens Served', value: '1.2M' },
                    { label: 'Tx Success Rate', value: '99.9%' },
                    { label: 'Avg SLA Speed', value: '2.4 Days' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card border-slate-800/50 p-6 rounded-3xl text-center hover:border-yellow-500/30 transition-colors">
                        <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Provisioning Modal */}
            {activatingModule && activeModuleObj && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden animate-reveal-up">
                        {!isProvisioning && (
                            <button 
                                onClick={() => setActivatingModule(null)}
                                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}

                        <div className="relative z-10">
                            <div className={`w-16 h-16 ${activeModuleObj.bg} rounded-2xl flex items-center justify-center mb-6 border border-white/5`}>
                                <activeModuleObj.icon className={`h-8 w-8 ${activeModuleObj.color}`} />
                            </div>
                            
                            <h2 className="text-2xl font-black text-white mb-2">Enable {activeModuleObj.name}</h2>
                            <p className="text-slate-400 text-sm mb-8">
                                You are about to provision this module for <strong>{currentTenant.name}</strong>.
                            </p>

                            {isProvisioning ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Provisioning Node...</span>
                                        <span className="text-yellow-500">{Math.round((provisionStep / 3) * 100)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-500 ease-out"
                                            style={{ width: `${(provisionStep / 3) * 100}%` }}
                                        />
                                    </div>
                                    <div className="text-xs font-mono text-slate-400 animate-pulse">
                                        {provisionStep === 1 && '> Allocating database shards...'}
                                        {provisionStep === 2 && '> Configuring API Gateway routes...'}
                                        {provisionStep === 3 && '> Finalizing tenant registry...'}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-6">
                                        <p className="text-xs text-yellow-500 font-medium">
                                            This action will instantly deploy new serverless endpoints to your municipal tenant.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleProvision}
                                        className="w-full py-4 bg-yellow-500 text-slate-950 font-black rounded-xl hover:bg-yellow-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Deploy to Production <Zap className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Decorative background pulse */}
                        {isProvisioning && (
                            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
