import React from 'react';
import { Bell, ShieldAlert, CheckCircle, Info, Clock, X } from 'lucide-react';
import { clsx } from 'clsx';

interface Notification {
    id: string;
    type: 'ALERT' | 'SUCCESS' | 'INFO';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'SUCCESS',
        title: 'Render Grid Connected',
        message: 'Live connection established with Render production backend server.',
        timestamp: new Date().toISOString(),
        read: false
    },
    {
        id: '2',
        type: 'SUCCESS',
        title: 'Business Verified',
        message: 'A field inspector has approved your pending business registration.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read: false
    },
    {
        id: '3',
        type: 'INFO',
        title: 'Municipal Update',
        message: 'SLA for license renewals is now 10 business days.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: true
    }
];

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = React.useState(MOCK_NOTIFICATIONS);

    if (!isOpen) return null;

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="absolute top-16 right-4 w-80 sm:w-96 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl z-50 overflow-hidden animate-reveal-up">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-yellow-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Notifications</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition-colors"
                    >
                        Mark All Read
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-hide p-2 bg-slate-900">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm font-medium">
                        No new notifications.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id} 
                                className={`p-4 rounded-xl flex items-start gap-3 transition-colors ${notif.read ? 'bg-transparent' : 'bg-white/5 border border-white/5'}`}
                            >
                                <div className="mt-0.5 shrink-0">
                                    {notif.type === 'ALERT' && <ShieldAlert className="h-5 w-5 text-red-500" />}
                                    {notif.type === 'SUCCESS' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                                    {notif.type === 'INFO' && <Info className="h-5 w-5 text-blue-500" />}
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold ${notif.read ? 'text-slate-400' : 'text-slate-200'}`}>
                                        {notif.title}
                                    </h4>
                                    <p className={`text-[11px] mt-1 ${notif.read ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {notif.message}
                                    </p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-2">
                                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                {!notif.read && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 ml-auto mt-2 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
