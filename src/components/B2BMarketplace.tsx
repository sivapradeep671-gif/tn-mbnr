import React, { useState } from 'react';
import { ShieldCheck, MessageSquare, Briefcase, Tag, Search, Filter, Plus, Building2, MapPin, CheckCircle2 } from 'lucide-react';
import type { Business } from '../types/types';

interface B2BListing {
    id: string;
    businessId: string;
    businessName: string;
    type: 'Offer' | 'Request' | 'Networking';
    title: string;
    description: string;
    category: string;
    timestamp: string;
}

const MOCK_LISTINGS: B2BListing[] = [
    {
        id: 'LST-001',
        businessId: 'BIZ-001',
        businessName: 'Anna Nagar Grand Mall',
        type: 'Request',
        title: 'Looking for Bulk Sanitization Supplies',
        description: 'We are looking for verified wholesale suppliers for monthly procurement of 500L hand sanitizers and masks.',
        category: 'Procurement',
        timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 'LST-002',
        businessId: 'BIZ-002',
        businessName: 'Classic Weaves LLP',
        type: 'Offer',
        title: 'B2B Discount on Uniforms',
        description: 'Offering 20% discount on customized staff uniforms for all TN-MBNR verified businesses in Chennai region.',
        category: 'Services',
        timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: 'LST-003',
        businessId: 'BIZ-003',
        businessName: 'Naveen Foods',
        type: 'Networking',
        title: 'F&B Partnership Opportunity',
        description: 'Seeking verified cloud kitchens to collaborate on our upcoming food festival in Adyar.',
        category: 'Partnership',
        timestamp: new Date(Date.now() - 172800000).toISOString()
    }
];

export const B2BMarketplace: React.FC<{ 
    businesses: Business[], 
    currentUserBiz?: Business | null,
    setCurrentView: (view: string) => void
}> = ({ businesses, currentUserBiz, setCurrentView }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'All' | 'Offer' | 'Request' | 'Networking'>('All');
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    const filteredListings = MOCK_LISTINGS.filter(lst => {
        const matchesSearch = lst.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              lst.businessName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeFilter === 'All' || lst.type === activeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Offer': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Request': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Networking': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pb-24">
            {/* Header Section */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified Network Only
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Briefcase className="w-8 h-8 text-emerald-400" />
                            B2B Trust Grid Marketplace
                        </h1>
                        <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
                            Connect, trade, and collaborate exclusively with other TN-MBNR government-verified businesses. Zero spam. 100% trust.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={() => setCurrentView('HOME')}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Back to Dashboard
                        </button>
                        <button 
                            onClick={() => setIsPostModalOpen(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl border border-emerald-500/30 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Post Listing
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search listings or verified businesses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                </div>
                <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto hide-scrollbar">
                    {['All', 'Offer', 'Request', 'Networking'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter as any)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                                activeFilter === filter 
                                ? 'bg-slate-800 text-white shadow-sm' 
                                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map(listing => (
                    <div key={listing.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:bg-slate-800/40 transition-colors flex flex-col group">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getTypeColor(listing.type)}`}>
                                {listing.type}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                                {new Date(listing.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors">
                            {listing.title}
                        </h3>
                        <p className="text-slate-400 text-sm mb-6 flex-grow">
                            {listing.description}
                        </p>
                        
                        <div className="pt-4 border-t border-slate-800 mt-auto">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-300 truncate max-w-[120px] sm:max-w-[150px]">
                                            {listing.businessName}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            <span className="text-[10px] text-emerald-500/80 uppercase font-mono">Verified Node</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white" title="Contact Business">
                                    <MessageSquare className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredListings.length === 0 && (
                <div className="text-center py-24 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
                    <Filter className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white">No listings found</h3>
                    <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters.</p>
                </div>
            )}

            {/* Post Modal Placeholder */}
            {isPostModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Create Network Listing</h3>
                        <p className="text-sm text-slate-400 mb-6">Your listing will be visible to all verified businesses on the Trust Grid.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Listing Type</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500">
                                    <option>B2B Offer</option>
                                    <option>Procurement Request</option>
                                    <option>Networking / Partnership</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="e.g., Offering Wholesale Supplies" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                                <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 h-24 resize-none" placeholder="Detail your offer or request..."></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                            <button 
                                onClick={() => setIsPostModalOpen(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    setIsPostModalOpen(false);
                                    alert("In a real app, this would push to the blockchain ledger.");
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium"
                            >
                                Publish to Grid
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
