import React, { useState } from 'react';
import { MessageSquare, X, Send, ThumbsUp, AlertTriangle } from 'lucide-react';

export const FeedbackButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<'issue' | 'suggestion'>('suggestion');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would send data to a backend or service like Sentry/LogRocket
        console.log('Feedback submitted:', { type, message });
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setIsOpen(false);
            setMessage('');
        }, 2000);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-50 bg-yellow-500 hover:bg-yellow-400 text-slate-900 p-3 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
                title="Send Feedback"
            >
                <MessageSquare className="h-6 w-6" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <MessageSquare className="h-5 w-5 text-yellow-500 mr-2" />
                                Feedback
                            </h3>

                            {submitted ? (
                                <div className="text-center py-8 animate-fade-in">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/30 text-green-500 mb-4">
                                        <ThumbsUp className="h-8 w-8" />
                                    </div>
                                    <p className="text-lg font-bold text-white">Thank You!</p>
                                    <p className="text-slate-400">Your feedback helps us improve.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="flex space-x-4 mb-6">
                                        <button
                                            type="button"
                                            onClick={() => setType('suggestion')}
                                            className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center ${type === 'suggestion'
                                                ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            <ThumbsUp className="h-4 w-4 mr-2" />
                                            Suggestion
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setType('issue')}
                                            className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center ${type === 'issue'
                                                ? 'bg-red-500/10 border-red-500 text-red-500'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                            Report Issue
                                        </button>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            {type === 'suggestion' ? 'How can we improve?' : 'What went wrong?'}
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                            rows={4}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none resize-none"
                                            placeholder={type === 'suggestion' ? "I think it would be cool if..." : "I encountered an error when..."}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        Send Feedback
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
