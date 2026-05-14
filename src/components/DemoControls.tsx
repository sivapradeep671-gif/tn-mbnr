import React from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DemoControls: React.FC = () => {
    const { user, login } = useAuth();

    if (!user) return null;

    return (
        <div className="fixed bottom-20 right-4 z-[100] bg-slate-900/90 backdrop-blur-sm border border-slate-700 p-4 rounded-xl shadow-2xl transition-all hover:border-blue-500">
            <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2 gap-4">
                <h4 className="text-white text-xs font-bold flex items-center gap-1 uppercase tracking-widest"><Settings className="h-3 w-3" /> Pilot Controls</h4>
                <span className="bg-blue-900/50 text-blue-400 text-[10px] px-2 py-0.5 rounded font-mono">Role: {user.role}</span>
            </div>
            <div className="flex gap-2 text-xs">
                <button onClick={() => login('0000000000', 'admin')} className={`px-2 py-1 rounded ${user.role === 'admin' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>Admin</button>
                <button onClick={() => login('0000000001', 'business')} className={`px-2 py-1 rounded ${user.role === 'business' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>Business</button>
                <button onClick={() => login('0000000002', 'citizen')} className={`px-2 py-1 rounded ${user.role === 'citizen' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>Citizen</button>
            </div>
        </div>
    );
};

export default DemoControls;