import React, { useState, useEffect } from 'react';
import { Type, Monitor, Moon, Sun } from 'lucide-react';

export const AccessibilityToolbar: React.FC = () => {
    const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
    const [theme, setTheme] = useState<'dark' | 'light' | 'high-contrast'>('dark');

    useEffect(() => {
        // Handle Font Sizing
        const html = document.documentElement;
        html.classList.remove('text-size-normal', 'text-size-large', 'text-size-xlarge');
        html.classList.add(`text-size-${fontSize}`);

        // Handle Theme
        html.classList.remove('light-theme', 'high-contrast');
        if (theme === 'light') {
            html.classList.add('light-theme');
        } else if (theme === 'high-contrast') {
            html.classList.add('high-contrast');
        }
    }, [fontSize, theme]);

    const changeFontSize = (size: 'normal' | 'large' | 'xlarge') => setFontSize(size);

    return (
        <div className="bg-slate-950/80 backdrop-blur-md border-b border-white/5 text-[11px] text-slate-300 py-2 px-6 flex flex-col sm:flex-row items-center justify-between z-[60] relative ignore-invert font-medium tracking-wide">
            <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-400 text-black">
                    <Monitor className="w-3 h-3" />
                </div>
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 uppercase tracking-widest hidden sm:inline">GOVERNMENT OF TAMIL NADU</span>
                <span className="hidden sm:inline text-slate-600">|</span>
                <span className="text-slate-400 uppercase tracking-wider">Municipal Administration & Water Supply</span>
            </div>
            
            <div className="flex items-center space-x-4">
                {/* Text Size Controls */}
                <div className="flex items-center bg-slate-900/50 rounded-full p-1 border border-white/10 shadow-inner">
                    <button 
                        onClick={() => changeFontSize('normal')}
                        className={`w-8 h-6 flex items-center justify-center rounded-full transition-all duration-300 ${fontSize === 'normal' ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'hover:bg-white/10 text-slate-400'}`}
                        title="Normal Text Size"
                        aria-label="Normal Text Size"
                    >
                        A-
                    </button>
                    <button 
                        onClick={() => changeFontSize('large')}
                        className={`w-8 h-6 flex items-center justify-center rounded-full transition-all duration-300 ${fontSize === 'large' ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'hover:bg-white/10 text-slate-400'}`}
                        title="Large Text Size"
                        aria-label="Large Text Size"
                    >
                        A
                    </button>
                    <button 
                        onClick={() => changeFontSize('xlarge')}
                        className={`w-8 h-6 flex items-center justify-center rounded-full transition-all duration-300 ${fontSize === 'xlarge' ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'hover:bg-white/10 text-slate-400'}`}
                        title="Extra Large Text Size"
                        aria-label="Extra Large Text Size"
                    >
                        A+
                    </button>
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center bg-slate-900/50 rounded-full p-1 border border-white/10 shadow-inner">
                    <button 
                        onClick={() => setTheme('light')}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-full transition-all duration-300 ${theme === 'light' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'text-slate-400 hover:bg-white/10'}`}
                        title="Light Mode"
                    >
                        <Sun className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Light</span>
                    </button>
                    <button 
                        onClick={() => setTheme('dark')}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'text-slate-400 hover:bg-white/10'}`}
                        title="Dark Mode"
                    >
                        <Moon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Dark</span>
                    </button>
                    <button 
                        onClick={() => setTheme('high-contrast')}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-full transition-all duration-300 ${theme === 'high-contrast' ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'text-slate-400 hover:bg-white/10'}`}
                        title="Toggle High Contrast"
                    >
                        <Monitor className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Contrast</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
