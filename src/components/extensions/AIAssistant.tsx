import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Minimize2, MessageSquare, Loader2 } from 'lucide-react';
import { aiService } from '../../services/geminiService';
import { useLanguage } from '../../context/LanguageContext';

const AIAssistant: React.FC = () => {
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isTamil = language === 'ta';

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;

        const userMsg = { role: 'user' as const, parts: [{ text: input }] };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        try {
            const response = await aiService.getChatResponse(input, messages);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
        } catch {
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: "System node failure. Reconnecting..." }] }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[60] font-sans">
            {/* Chat Window */}
            {isOpen ? (
                <div className="bg-slate-900 border border-white/10 w-80 md:w-96 h-[500px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col backdrop-blur-3xl animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-slate-950 p-6 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-500/10 p-2 rounded-xl">
                                <Bot className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">{isTamil ? 'தமிழ் AI உதவி' : 'TN AI Support'}</h3>
                                <p className="text-[10px] text-green-500 font-mono flex items-center gap-1 uppercase tracking-tighter">
                                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span> {isTamil ? 'நேரலையில்' : 'Online'} • Gemini 2.0
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
                                <Minimize2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
                        {messages.length === 0 && (
                            <div className="bg-slate-850 p-4 rounded-2xl text-[11px] text-slate-400 leading-relaxed border border-white/5">
                                <p className="mb-2 italic">{isTamil ? 'வணக்கம் குடிமகன் / வணிகர்.' : 'Greetings Citizen / Merchant.'}</p>
                                <p>{isTamil ? 'நான் MBNR AI மையம். என்னிடம் கேட்கவும்:' : 'I am the MBNR AI Intelligence Hub. Ask me about:'}</p>
                                <ul className="mt-2 space-y-1 list-disc list-inside text-yellow-500/80">
                                    <li>{isTamil ? 'கடை பதிவு' : 'Shop Registration'}</li>
                                    <li>{isTamil ? 'QR பாதுகாப்பு' : 'QR Security (HMAC/Geofence)'}</li>
                                    <li>{isTamil ? 'சரிபார்ப்பு தோல்விகள்' : 'Verification Failures'}</li>
                                </ul>
                            </div>
                        )}
                        
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                                    m.role === 'user' 
                                    ? 'bg-yellow-500 text-slate-950 font-bold ml-4' 
                                    : 'bg-slate-800 text-slate-200 border border-white/5 mr-4'
                                } shadow-xl`}>
                                    {m.parts[0].text}
                                </div>
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-slate-850 p-4 rounded-2xl border border-white/5 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Processing...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-950 border-t border-white/5">
                        <div className="relative">
                            <input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={isTamil ? 'உங்கள் கேள்வியை இங்கே கேட்கவும்...' : "Quantum query here..."}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                            />
                            <button 
                                onClick={handleSend}
                                className="absolute right-2 top-1.5 p-1.5 bg-yellow-500 text-slate-950 rounded-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="p-4 bg-yellow-500 text-slate-950 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all group relative"
                >
                    <div className="absolute -top-12 right-0 bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-lg border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest pointer-events-none">
                        {isTamil ? 'AI நேரலையில்' : 'AI Node Online'}
                    </div>
                    <MessageSquare className="h-6 w-6" />
                </button>
            )}
        </div>
    );
};

export default AIAssistant;
