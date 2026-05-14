import { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/HeroBrand';
import { ImpactMatrix } from './components/ImpactMatrix';
import { LanguageProvider } from './context/LanguageContext';
import { FeedbackButton } from './components/FeedbackButton';
import { Login } from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useBusinesses } from './hooks/useBusinesses';
import { ToastContainer } from './components/Toast';
import { api } from './api/client';
import { Mail, Shield, Zap, AlertTriangle } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import type { GlobalHandlers } from './types/types';
import { SaaSProvider, useSaaS } from './context/SaaSContext';

// Tell TypeScript about our custom window properties
declare global {
  interface Window extends GlobalHandlers {}
}

// Lazy load feature components for better performance
const BusinessRegistration = lazy(() => import('./components/BusinessRegistration').then(m => ({ default: m.BusinessRegistration })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const MapExplorer = lazy(() => import('./components/MapExplorer').then(m => ({ default: m.MapExplorer })));
const CitizenReport = lazy(() => import('./components/CitizenReport').then(m => ({ default: m.CitizenReport })));
const QRScanner = lazy(() => import('./components/QRScanner').then(m => ({ default: m.QRScanner })));
const CitizenRegistration = lazy(() => import('./components/CitizenRegistration').then(m => ({ default: m.CitizenRegistration })));
const BlockchainExplorer = lazy(() => import('./components/BlockchainExplorer').then(m => ({ default: m.BlockchainExplorer })));
const PublicRegistry = lazy(() => import('./components/PublicRegistry').then(m => ({ default: m.PublicRegistry })));
const TechArchitecture = lazy(() => import('./components/TechArchitecture').then(m => ({ default: m.TechArchitecture })));
const HackathonJury = lazy(() => import('./components/HackathonJury').then(m => ({ default: m.HackathonJury })));
const DemoControls = lazy(() => import('./components/DemoControls'));
const MerchantDashboard = lazy(() => import('./components/MerchantDashboard').then(m => ({ default: m.MerchantDashboard })));
const InspectorDashboard = lazy(() => import('./components/InspectorDashboard').then(m => ({ default: m.InspectorDashboard })));
const ExecutiveDashboard = lazy(() => import('./components/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard })));
const AIAssistant = lazy(() => import('./components/extensions/AIAssistant'));
const SaaSMarketplace = lazy(() => import('./components/SaaSMarketplace').then(m => ({ default: m.SaaSMarketplace })));
const SaaSPricing = lazy(() => import('./components/SaaSPricing').then(m => ({ default: m.SaaSPricing })));
const SaaSAdmin = lazy(() => import('./components/SaaSAdmin').then(m => ({ default: m.SaaSAdmin })));
const BusinessHealthDashboard = lazy(() => import('./components/BusinessHealthScore').then(m => ({ default: m.BusinessHealthDashboard })));
const GrievanceRedressal = lazy(() => import('./components/GrievanceRedressal').then(m => ({ default: m.GrievanceRedressal })));

const APP_VERSION = '1.2.0 (Dual-Theme Build)';

function LoadingFallback() {
  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-5 animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-center">
            <div className="relative mb-12">
                <div className="absolute inset-0 bg-yellow-500 blur-[80px] opacity-10 animate-pulse" />
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin-slow" />
                    <div className="absolute inset-3 border-2 border-slate-700 border-b-yellow-500/30 rounded-full animate-spin-reverse" />
                    <Shield className="h-10 w-10 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
                </div>
            </div>

            <div className="space-y-6 text-center max-w-sm">
                <div className="flex flex-col gap-2">
                     <p className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">
                        Authenticating Nodal Trust...
                    </p>
                    <div className="h-1 w-48 bg-white/5 rounded-full mx-auto overflow-hidden border border-white/5">
                        <div className="h-full bg-yellow-500 animate-progress-infinite shadow-[0_0_10px_rgba(234,179,8,1)]" />
                    </div>
                </div>
                <div className="mt-8 grid grid-cols-3 gap-8 opacity-40">
                     {['REGISTRY', 'BLOCKCHAIN', 'AI_NODE'].map(node => (
                         <div key={node} className="flex flex-col items-center gap-2">
                             <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,1)] animate-ping" />
                             <span className="text-[6.5px] font-black text-slate-500 uppercase tracking-widest">{node}</span>
                         </div>
                     ))}
                </div>
            </div>
        </div>
    </div>
  );
}

function AppContent() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { currentTenant } = useSaaS();
  const { businesses, reports, updateStatus, registerBusiness } = useBusinesses();
  
  const [currentView, setCurrentView] = useState('HOME');
  const [reportPrefill, setReportPrefill] = useState<string>('');
  const [isBackendOffline, setIsBackendOffline] = useState(false);

  // Health check for backend
  useEffect(() => {
    const checkBackend = async () => {
      const isOnline = await api.checkHealth();
      if (!isOnline) {
        // Use queueMicrotask to avoid synchronous setState in effect
        queueMicrotask(() => setIsBackendOffline(true));
      }
    };
    checkBackend();
  }, []);

  // View protection & Role-based routing
  useEffect(() => {
    if (user) {
      if (user.role === 'citizen' && (currentView === 'REGISTER' || currentView === 'DASHBOARD')) {
        setTimeout(() => setCurrentView('HOME'), 0);
      }
      if (user.role === 'business' && currentView === 'REPORT') {
        setTimeout(() => setCurrentView('HOME'), 0);
      }
    }
  }, [user, currentView]);

  // Clean implementation of cross-component triggers
  useEffect(() => {
    const handlers = {
      onReportBusiness: (name: string) => {
        setReportPrefill(name);
        setCurrentView('REPORT');
      },
      onOpenCitizenReg: () => {
        setCurrentView('REGISTER_CITIZEN');
      }
    };

    Object.assign(window, handlers);
    return () => {
      Object.keys(handlers).forEach(key => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any)[key];
      });
    };
  }, []);

  const handleLoginSuccess = (role: string) => {
    setCurrentView(role === 'citizen' ? 'HOME' : 'DASHBOARD');
  };

  const renderContent = () => {
    return (
      <Suspense fallback={<LoadingFallback />}>
        {(() => {
          switch (currentView) {
            case 'HOME':
              return (
                <>
                  <Hero 
                    onRegister={() => setCurrentView('REGISTER')} 
                    onScan={() => setCurrentView('SCAN')} 
                    onCitizenRegister={() => setCurrentView('REGISTER_CITIZEN')} 
                    onExploreMap={() => setCurrentView('MAP')}
                  />
                  <ImpactMatrix />
                  <HackathonJury />
                  <TechArchitecture />
                </>
              );
            case 'REGISTER':
              return <BusinessRegistration onRegister={registerBusiness} businesses={businesses} />;
            case 'MAP':
              return <MapExplorer businesses={businesses} reports={reports} />;
            case 'REPORT':
              return <CitizenReport prefillName={reportPrefill} />;
            case 'SCAN':
              return <QRScanner businesses={businesses} />;
            case 'REGISTER_CITIZEN':
              return <CitizenRegistration onComplete={() => setCurrentView('HOME')} />;
            case 'LEDGER':
              return <BlockchainExplorer businesses={businesses} />;
            case 'REGISTRY':
              return <PublicRegistry businesses={businesses} />;
            case 'LOGIN':
              return <Login onLoginSuccess={handleLoginSuccess} />;
            case 'MARKETPLACE':
              return <SaaSMarketplace />;
            case 'PRICING':
              return <SaaSPricing />;
            case 'SAAS_ADMIN':
              return <SaaSAdmin />;
            case 'DASHBOARD':
              if (user?.role === 'business') {
                const business = businesses.find(b => b.id === user.id) || businesses[0];
                return <MerchantDashboard business={business} />;
              }
              if (user?.role === 'inspector') {
                return <InspectorDashboard businesses={businesses} onUpdateStatus={updateStatus} />;
              }
              if (user?.role === 'executive') {
                return <ExecutiveDashboard businesses={businesses} reports={reports} />;
              }
              return <Dashboard businesses={businesses} reports={reports} onUpdateStatus={updateStatus} />;
            case 'INSPECTOR_DASHBOARD':
                return <InspectorDashboard businesses={businesses} onUpdateStatus={updateStatus} />;
            case 'EXECUTIVE_DASHBOARD':
                return <ExecutiveDashboard businesses={businesses} reports={reports} />;
            case 'HEALTH_SCORE':
                return <BusinessHealthDashboard />;
            case 'GRIEVANCE':
                return <GrievanceRedressal businesses={businesses} />;
            default:
              return (
                <Hero 
                  onRegister={() => setCurrentView('REGISTER')} 
                  onScan={() => setCurrentView('SCAN')} 
                  onCitizenRegister={() => setCurrentView('REGISTER_CITIZEN')} 
                  onExploreMap={() => setCurrentView('MAP')}
                />
              );
          }
        })()}
      </Suspense>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-sans selection:bg-yellow-500/30 transition-all duration-500 ${isBackendOffline ? 'pt-24' : 'pt-20'}`}>
      <ToastContainer />
      
      {/* Universal Priority Banner Stack */}
      <div className="fixed top-0 left-0 w-full z-[60] flex flex-col">
        <div className="w-full bg-yellow-500/95 text-slate-900 text-[9px] font-black py-1.5 px-4 text-center tracking-[0.3em] uppercase border-b border-yellow-600/20">
          {t.footer.disclaimer_banner} | {currentTenant.name} Platform v{APP_VERSION}
        </div>

        {isBackendOffline && (
          <div className="w-full bg-red-600/90 text-white text-[9px] font-black py-1.5 px-4 text-center tracking-[0.2em] uppercase flex items-center justify-center gap-2 animate-pulse backdrop-blur-md border-b border-red-500/20">
            <AlertTriangle className="h-3.5 w-3.5" /> Security Advisory: API Grid Offline — Operating on Local Node Fallback
          </div>
        )}
      </div>

      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main>
        {authLoading ? (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Verifying Identity...</p>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </main>

      <Suspense fallback={null}>
        <AIAssistant />
      </Suspense>

      <footer className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="mb-4 text-slate-400 font-medium italic">"Scan once, know the truth."</p>
        <div className="flex justify-center space-x-6 mb-8">
          <a href="mailto:project.pilot@gmail.com" className="p-2.5 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-lg border border-slate-800" title="Email Us">
            <Mail className="h-5 w-5" />
          </a>
          <a href="#" className="p-2.5 bg-slate-900 rounded-full text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-all shadow-lg border border-slate-800" title="View Source">
            <Shield className="h-5 w-5" />
          </a>
          <a href="#" className="p-2.5 bg-slate-900 rounded-full text-slate-400 hover:text-yellow-500 hover:bg-slate-800 transition-all shadow-lg border border-slate-800" title="Official Dashboard">
            <Zap className="h-5 w-5" />
          </a>
        </div>
        <p className="text-slate-500 text-sm mb-4">{t.footer.rights}</p>
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 inline-block">
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-lg mx-auto uppercase tracking-tighter" dangerouslySetInnerHTML={{ __html: t.footer.disclaimer.replace('DISCLAIMER:', '<strong>DISCLAIMER:</strong>').replace('NOT', '<strong>NOT</strong>').replace('பொறுப்புத் துறப்பு:', '<strong>பொறுப்புத் துறப்பு:</strong>').replace('அல்ல', '<strong>அல்ல</strong>') }}>
          </p>
        </div>
        <p className="mt-4 text-[10px] text-slate-700">v{APP_VERSION}</p>
      </footer>
      <FeedbackButton />
      <Suspense fallback={null}>
        <DemoControls />
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SaaSProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </SaaSProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
