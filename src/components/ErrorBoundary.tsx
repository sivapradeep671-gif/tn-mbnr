import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[TN-MBNR ErrorBoundary] Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: undefined });
        window.location.reload();
    };

    private handleClearCache = () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.clear();
            if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
        } catch (e) {
            console.error('Error clearing storage:', e);
        }
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5 text-center">
                        <div className="w-12 h-12 bg-rose-950/80 border border-rose-600/40 rounded-full flex items-center justify-center mx-auto text-rose-400">
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">
                                Application Recovery Mode
                            </h2>
                            <p className="text-xs text-slate-400 mt-1 font-mono">
                                பயன்பாட்டை மீட்டெடுக்கும் நிலை
                            </p>
                        </div>

                        <p className="text-sm text-slate-300">
                            An isolated component failure occurred. The application shell remains protected.
                        </p>

                        {this.state.error && (
                            <div className="bg-slate-950 border border-slate-800 p-3 rounded text-left font-mono text-xs text-rose-400 overflow-x-auto max-h-32">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Reload App / புதுப்பி</span>
                            </button>
                            <button
                                onClick={this.handleClearCache}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors border border-slate-700"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Clear Cache / தற்காலிக நினைவகம் நீக்கு</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
