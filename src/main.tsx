import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen w-full bg-[#050406] text-stone-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0b0a0e] border border-red-700/70 rounded-lg p-5 space-y-3">
            <h1 className="font-bold text-red-400 text-base">Dungeon Bouncer failed to render</h1>
            <p className="text-xs text-stone-300 font-mono break-words">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

(window as { __DUNGEON_BOUNCER_BOOTED__?: boolean }).__DUNGEON_BOUNCER_BOOTED__ = true;
createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
