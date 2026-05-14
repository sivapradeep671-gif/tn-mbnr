import React from 'react'; 
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Map as MapIcon, Filter, Layers, MapPin, ShieldCheck, Activity } from 'lucide-react';
import type { Business, CitizenReport } from '../types/types';
import { useLanguage } from '../context/LanguageContext';
import { VoiceInput } from './VoiceInput';
import { getIconByStatus } from '../utils/mapIcons';
import L from 'leaflet';

interface MapExplorerProps {
    businesses: Business[];
    reports: CitizenReport[];
}

const reportIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style='background-color:rgba(239, 68, 68, 0.8); width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px rgba(239, 68, 68, 0.5);'></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

export const MapExplorer: React.FC<MapExplorerProps> = ({ businesses, reports }) => {
    const { t } = useLanguage();
    const centerPosition: [number, number] = [10.7905, 78.7047];
    const [showSafeZones, setShowSafeZones] = React.useState(false);
    const [isGridMode, setIsGridMode] = React.useState(false);

    // Simulated scan pulses for "Wow" factor
    const [pulses, setPulses] = React.useState<{id: string, pos: [number, number]}[]>([]);

    React.useEffect(() => {
        if (!isGridMode) {
            setPulses([]);
            return;
        }

        const interval = setInterval(() => {
            const randomBiz = businesses[Math.floor(Math.random() * businesses.length)];
            if (randomBiz && randomBiz.latitude) {
                const newPulse = { id: Math.random().toString(), pos: [randomBiz.latitude, randomBiz.longitude] as [number, number] };
                setPulses(prev => [...prev.slice(-5), newPulse]);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isGridMode, businesses]);

    const filteredBusinesses = showSafeZones 
        ? businesses.filter(b => b.status === 'Verified' && (b.riskScore || 0) < 3) 
        : businesses;

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col relative overflow-hidden bg-slate-950">
            {/* Premium Map Header */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-5xl px-4 pointer-events-none">
                <div className="glass-card bg-slate-950/40 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-6 border-white/10 shadow-3xl pointer-events-auto reveal-up">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-500 rounded-2xl shadow-2xl shadow-yellow-500/20">
                            <MapIcon className="h-6 w-6 text-slate-950" />
                        </div>
                        <div>
                            <h2 className="h-display text-2xl mb-0 mt-0">Spatial <span className="text-glow">Intelligence</span></h2>
                            <p className="text-slate-500 text-[9px] font-black tracking-[0.2em] uppercase">MBNR Global Grid</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80 group">
                            <div className="absolute inset-0 bg-yellow-500/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <Search className="h-5 w-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-yellow-500 transition-colors" />
                            <input
                                type="text"
                                id="map-search-input"
                                placeholder={t.map.search_placeholder}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-white focus:border-yellow-500/50 outline-none transition-all placeholder:opacity-30"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <VoiceInput onResult={(text) => {
                                    const input = document.getElementById('map-search-input') as HTMLInputElement;
                                    if (input) input.value = text;
                                }} />
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setShowSafeZones(!showSafeZones)}
                            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest active:scale-95 ${
                                showSafeZones 
                                ? 'bg-green-500 text-slate-950 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                                : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <ShieldCheck className={`h-4 w-4 ${showSafeZones ? 'text-slate-950' : 'text-green-500'}`} />
                            <span className="hidden sm:inline">{showSafeZones ? 'Safe Zones Active' : 'Show Safe Zones'}</span>
                        </button>
                        
                        <button 
                            onClick={() => setIsGridMode(!isGridMode)}
                            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest active:scale-95 ${
                                isGridMode 
                                ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                                : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <Activity className={`h-4 w-4 ${isGridMode ? 'animate-pulse text-white' : 'text-indigo-400'}`} />
                            <span className="hidden sm:inline">Grid Watch</span>
                        </button>
                        
                        <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3.5 rounded-2xl border border-white/10 transition-all text-xs font-black uppercase tracking-widest active:scale-95">
                            <Layers className="h-4 w-4 text-yellow-500" />
                            <span className="hidden sm:inline">Layers</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative z-0">
                <MapContainer center={centerPosition} zoom={7} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {filteredBusinesses.map((business) => {
                        const position: [number, number] | undefined = (business.latitude && business.longitude)
                            ? [business.latitude, business.longitude]
                            : business.coordinates
                                ? [business.coordinates.lat, business.coordinates.lng]
                                : ((business.id && business.id.length >= 4) ? [
                                    centerPosition[0] + (parseInt(business.id.slice(-2), 16) / 256 - 0.5) * 4,
                                    centerPosition[1] + (parseInt(business.id.slice(-4, -2), 16) / 256 - 0.5) * 4
                                ] : undefined);

                        if (!position || isNaN(position[0]) || isNaN(position[1])) return null;

                        return (
                            <Marker
                                key={business.id}
                                position={position}
                                icon={getIconByStatus(business.status, business.riskScore)}
                            >
                                <Popup className="premium-popup">
                                    <div className="p-4 min-w-[240px] glass-card border-none overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
                                        <h3 className="h-display text-lg mb-2 mt-0 border-b border-white/5 pb-2 text-slate-950 font-black">{business.tradeName}</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Entity Type</p>
                                                <p className="text-xs font-bold text-slate-800">{business.type}</p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-yellow-600 shrink-0 mt-0.5" />
                                                <p className="text-xs text-slate-600 leading-relaxed font-medium">{business.address}</p>
                                            </div>
                                            <div className="pt-2 flex justify-between items-center border-t border-white/5">
                                                <div className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase ${business.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {business.status ? business.status : 'UNKNOWN'}
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400">ID: {(business.id || '').slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {reports.map((report: CitizenReport, idx: number) => {
                        // For demo, if coordinates missing, generate near center deterministically
                        const pseudoSeedX = Math.abs(Math.sin((idx + 1) * 1000));
                        const pseudoSeedY = Math.abs(Math.cos((idx + 1) * 1000));
                        const lat = report.latitude || centerPosition[0] + (pseudoSeedX - 0.5) * 5;
                        const lng = report.longitude || centerPosition[1] + (pseudoSeedY - 0.5) * 5;

                        return (
                            <Marker
                                key={`report-${idx}`}
                                position={[lat, lng]}
                                icon={reportIcon}
                            >
                                <Popup className="premium-popup">
                                    <div className="p-4 min-w-[200px] glass-card border-none overflow-hidden border-t-2 border-red-500">
                                        <div className="inline-flex px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full text-[9px] font-black text-red-500 uppercase tracking-widest mb-2">
                                            Anomaly Report: {report.category}
                                        </div>
                                        <h3 className="h-display text-sm mb-1 mt-0 text-slate-900 font-bold">{report.businessName || report.business_name}</h3>
                                        <p className="text-[10px] text-slate-500 leading-tight mb-3 italic">"{report.description}"</p>
                                        <div className="flex justify-between items-center text-[9px] font-black text-slate-400">
                                            <span>Severity: {report.severity}</span>
                                            <span>Status: PENDING</span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                    {isGridMode && pulses.map(pulse => (
                        <Circle 
                            key={pulse.id}
                            center={pulse.pos}
                            radius={50000}
                            pathOptions={{
                                color: '#6366f1',
                                fillColor: '#6366f1',
                                fillOpacity: 0.1,
                                weight: 1
                            }}
                        />
                    ))}
                </MapContainer>

                {/* Legend Floating Card */}
                <div className="absolute bottom-10 right-10 z-[1000] hidden lg:block">
                    <div className="glass-card p-6 rounded-[2rem] border-white/10 shadow-3xl reveal-up bg-slate-950/40 backdrop-blur-2xl">
                        <h4 className="h-display text-sm mb-4 flex items-center gap-2">
                            <Layers className="h-4 w-4 text-yellow-500" />
                            Registry <span className="text-glow">Legend</span>
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-60">Verified Assets</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-60">Pending Audit</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-60">Risk Anomalies</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
