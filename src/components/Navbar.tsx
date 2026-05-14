import React from 'react';
import { Languages, Menu, X, LogOut, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { TenantSelector } from './TenantSelector';

interface NavbarProps {
    currentView: string;
    setCurrentView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
    const { t, language, toggleLanguage } = useLanguage();
    const { isAuthenticated, user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        setCurrentView('HOME');
        setIsMobileMenuOpen(false);
    };

    const navItems = ['HOME', 'REGISTER', 'MAP', 'REGISTRY', 'REPORT', 'SCAN', 'HEALTH_SCORE', 'GRIEVANCE', 'MARKETPLACE', 'PRICING'].filter(view => {
        if (!user) return ['HOME', 'REGISTER', 'MAP', 'REGISTRY', 'SCAN', 'HEALTH_SCORE', 'MARKETPLACE', 'PRICING'].includes(view);
        if (user.role === 'citizen') return ['HOME', 'MAP', 'REGISTRY', 'REPORT', 'SCAN', 'GRIEVANCE', 'MARKETPLACE', 'PRICING'].includes(view);
        if (user.role === 'business') return ['HOME', 'REGISTER', 'MAP', 'REGISTRY', 'SCAN', 'HEALTH_SCORE', 'GRIEVANCE', 'MARKETPLACE', 'PRICING'].includes(view);
        if (user.role === 'inspector') return ['HOME', 'INSPECTOR_DASHBOARD', 'MAP', 'REGISTRY', 'SCAN', 'HEALTH_SCORE', 'GRIEVANCE', 'MARKETPLACE'].includes(view);
        if (user.role === 'admin') return ['HOME', 'DASHBOARD', 'SAAS_ADMIN', 'MAP', 'REGISTRY', 'SCAN', 'HEALTH_SCORE', 'GRIEVANCE', 'MARKETPLACE', 'PRICING'].includes(view);
        if (user.role === 'executive') return ['HOME', 'EXECUTIVE_DASHBOARD', 'SAAS_ADMIN', 'MAP', 'REGISTRY', 'SCAN', 'HEALTH_SCORE', 'MARKETPLACE', 'PRICING'].includes(view);
        return true;
    });

    const labelMap: Record<string, string> = {
        HOME: t.nav.home,
        REGISTER: t.nav.register,
        MAP: t.nav.map,
        REPORT: t.nav.report,
        SCAN: t.nav.scan_qr,
        REGISTRY: 'Registry',
        MARKETPLACE: t.nav.marketplace,
        PRICING: t.nav.pricing,
        SAAS_ADMIN: t.nav.saas_admin,
        INSPECTOR_DASHBOARD: 'Inspection Hub',
        EXECUTIVE_DASHBOARD: 'Strategic Command',
        HEALTH_SCORE: language === 'en' ? 'Health Score' : 'ஆரோக்கியம்',
        GRIEVANCE: language === 'en' ? 'Grievance' : 'குறை தீர்வு',
    };

    return (
        <nav className={`fixed w-full z-50 transition-all duration-500 ${
            scrolled ? 'py-4' : 'py-6'
        }`}>
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
                scrolled ? 'max-w-5xl' : 'max-w-7xl'
            }`}>
                <div className={`
                    glass-card rounded-2xl px-4 sm:px-8 transition-all duration-500
                    ${scrolled ? 'bg-slate-900/40' : 'bg-transparent border-transparent shadow-none'}
                `}>
                    <div className="flex items-center justify-between h-16">
                        {/* Logo Section */}
                        <div 
                            className="flex items-center flex-shrink-0 cursor-pointer group" 
                            onClick={() => setCurrentView('HOME')}
                        >
                            <div className="mr-4 p-1.5 bg-yellow-500 rounded-xl group-hover:rotate-12 transition-transform duration-500 shadow-xl shadow-yellow-500/20">
                                <img src="./logo.png" alt="TN-MBNR" className="h-8 w-8 object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold tracking-tighter text-white group-hover:text-yellow-500 transition-colors">
                                    TN-MBNR
                                </span>
                                <span className="text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase leading-none mt-0.5">
                                    TrustReg TN
                                </span>
                            </div>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-1">
                            {navItems.map((view) => (
                                <button
                                    key={view}
                                    onClick={() => setCurrentView(view)}
                                    className={`
                                        relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300
                                        ${currentView === view 
                                            ? 'text-yellow-500' 
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    {labelMap[view] || view}
                                    {currentView === view && (
                                        <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,1)]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Right Side Icons */}
                        <div className="hidden md:flex items-center space-x-3">
                            {/* Tenant Selector */}
                            <TenantSelector />

                            {/* Sync Status Token */}
                            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest leading-none">Node Sync</span>
                            </div>

                            {/* Language Switcher */}
                            <button
                                onClick={toggleLanguage}
                                className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                title={language === 'en' ? 'தமிழ்' : 'English'}
                            >
                                <Languages className="h-5 w-5" />
                            </button>

                            <div className="h-8 w-px bg-white/10 mx-2"></div>

                            {/* Login/Dashboard Button */}
                            {!isAuthenticated ? (
                                <button
                                    onClick={() => setCurrentView('LOGIN')}
                                    className="bg-white text-slate-950 px-6 py-2.5 rounded-xl text-sm font-black transition-all transform hover:scale-105 active:scale-95 shadow-2xl hover:bg-yellow-500"
                                >
                                    Login
                                </button>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentView('DASHBOARD')}
                                        className="bg-white/5 text-yellow-500 px-5 py-2.5 rounded-xl text-sm font-black border border-white/5 hover:bg-white/10 transition-all"
                                    >
                                        Console
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center justify-center p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
                                        title="Exit System"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center md:hidden gap-3">
                            <button
                                onClick={toggleLanguage}
                                className="p-2.5 bg-white/5 text-slate-400 rounded-xl"
                            >
                                <Languages className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2.5 bg-yellow-500 text-slate-950 rounded-xl shadow-lg transition-transform active:scale-90"
                            >
                                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 pt-24 px-4 bg-slate-950/95 backdrop-blur-2xl animate-fade-in">
                    <div className="space-y-3">
                        {navItems.map((view) => (
                            <button
                                key={view}
                                onClick={() => {
                                    setCurrentView(view);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`
                                    flex items-center justify-between w-full p-5 rounded-2xl text-lg font-black transition-all
                                    ${currentView === view
                                        ? 'bg-yellow-500 text-slate-950 shadow-2xl shadow-yellow-500/20'
                                        : 'bg-white/5 text-white hover:bg-white/10'}
                                `}
                            >
                                <span>{labelMap[view] || view}</span>
                                <ChevronRight className={`h-5 w-5 ${currentView === view ? 'text-slate-950' : 'text-slate-600'}`} />
                            </button>
                        ))}

                        <div className="pt-6 border-t border-white/10 space-y-3">
                            {!isAuthenticated ? (
                                <button
                                    onClick={() => {
                                        setCurrentView('LOGIN');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full p-5 rounded-2xl bg-white text-slate-950 text-xl font-black text-center shadow-2xl"
                                >
                                    Login to Portal
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            setCurrentView('DASHBOARD');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full p-5 rounded-2xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xl font-black text-center"
                                    >
                                        Business Console
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full p-5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-xl font-black text-center"
                                    >
                                        Exit Secure Session
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};


