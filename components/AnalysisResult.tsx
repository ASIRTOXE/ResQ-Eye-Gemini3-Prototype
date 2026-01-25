import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertTriangle, Activity, Terminal, Clock, ShieldAlert, CheckCircle } from 'lucide-react';
import { AnalysisStatus } from '../types';

interface AnalysisResultProps {
  status: AnalysisStatus;
  result: string | null;
  error: string | null;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ status, result, error }) => {
  // IDLE STATE
  if (status === AnalysisStatus.IDLE) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 min-h-[400px] border border-slate-800 rounded-xl bg-slate-950/50 p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]"></div>
        <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <Activity className="w-10 h-10 opacity-30 text-slate-400" />
        </div>
        <div className="text-center z-10">
            <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest">System Standby</h3>
            <p className="text-xs text-slate-600 font-mono mt-2">WAITING FOR DATA STREAM...</p>
        </div>
      </div>
    );
  }

  // ANALYZING STATE
  if (status === AnalysisStatus.ANALYZING) {
    return (
      <div className="h-full flex flex-col items-center justify-center min-h-[400px] border border-orange-500/30 rounded-xl bg-slate-950 p-8 relative overflow-hidden">
        {/* Scanning Line Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent h-[15%] w-full animate-[scan_2s_linear_infinite]"></div>
        
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-t-2 border-orange-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-b-2 border-orange-700/50 rounded-full animate-[spin_1.5s_reverse_linear_infinite]"></div>
          <ShieldAlert className="absolute inset-0 m-auto text-orange-500 w-8 h-8 animate-pulse" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2 tracking-widest animate-pulse">PROCESSING FEED</h3>
        <div className="flex flex-col space-y-2 text-center font-mono text-xs">
            <p className="text-orange-400">> INITIALIZING GEMINI-3-PRO...</p>
            <p className="text-slate-500">> DETECTING STRUCTURAL ANOMALIES...</p>
            <p className="text-slate-600">> CALCULATING RISK FACTORS...</p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="rounded-xl bg-red-950/20 border border-red-900/50 p-6 flex flex-col items-center text-center justify-center h-full min-h-[400px]">
        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4 border border-red-900/50">
             <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-red-500 uppercase tracking-widest mb-2">Analysis Failed</h3>
        <p className="text-red-400/70 text-sm font-mono max-w-sm">{error}</p>
        <button className="mt-6 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded text-xs font-mono transition-colors">
            RETRY CONNECTION
        </button>
      </div>
    );
  }

  // SUCCESS / REPORT STATE
  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-full relative group min-h-[500px]">
      {/* Decorative HUD Corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-orange-500/50 rounded-tl-lg z-10"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-orange-500/50 rounded-tr-lg z-10"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-orange-500/50 rounded-bl-lg z-10"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-orange-500/50 rounded-br-lg z-10"></div>

      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-800 p-4 flex items-center justify-between backdrop-blur-sm z-20">
        <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-orange-500/10 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                <Terminal className="h-5 w-5 text-orange-500" />
            </div>
            <div>
                <h2 className="text-sm font-bold tracking-[0.2em] text-white">TACTICAL REPORT</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-orange-400 font-mono bg-orange-900/20 px-1.5 py-0.5 rounded border border-orange-900/30">
                        EYES ONLY
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                </div>
            </div>
        </div>
        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-green-500 tracking-wider">LIVE DATA</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                <Clock className="w-3 h-3" />
                {new Date().toLocaleTimeString()}
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative flex-grow overflow-hidden bg-slate-950">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.1)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10 h-full overflow-y-auto p-6 scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800">
             <div className="prose prose-invert prose-sm max-w-none font-mono">
                <ReactMarkdown
                    components={{
                        // Custom H1 for Main Title
                        h1: ({node, ...props}) => (
                            <div className="flex items-center gap-3 border-b-2 border-red-500/50 pb-4 mb-8 mt-2">
                                <ShieldAlert className="w-8 h-8 text-red-500" />
                                <h1 className="text-2xl font-black text-white uppercase tracking-widest m-0" {...props} />
                            </div>
                        ),
                        // Custom H2 for Sections
                        h2: ({node, ...props}) => (
                            <div className="flex items-center gap-2 bg-slate-900/50 border-l-4 border-orange-500 p-3 mt-8 mb-4 rounded-r">
                                <h2 className="text-base font-bold text-orange-400 uppercase tracking-wider m-0" {...props} />
                            </div>
                        ),
                        // Custom lists
                        ul: ({node, ...props}) => <ul className="space-y-3 my-4 list-none pl-2" {...props} />,
                        li: ({node, ...props}) => (
                            <li className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed border-b border-slate-800/50 pb-2 last:border-0">
                                <span className="text-orange-500 mt-1.5 text-[10px]">▶</span>
                                <span {...props} />
                            </li>
                        ),
                        strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                        p: ({node, ...props}) => <p className="text-slate-400 mb-4 leading-relaxed" {...props} />,
                        hr: ({node, ...props}) => <hr className="border-slate-800 my-6" {...props} />
                    }}
                >
                    {result || ''}
                </ReactMarkdown>
             </div>
          </div>
      </div>

      {/* Footer Status */}
      <div className="bg-slate-900 border-t border-slate-800 p-2 flex items-center justify-between text-[10px] font-mono text-slate-500 px-4">
        <span>MODE: ANALYSIS // V.2.1.0</span>
        <span className="flex items-center gap-1">
             <CheckCircle className="w-3 h-3 text-green-500" />
             COMPLETE
        </span>
      </div>
    </div>
  );
};

export default AnalysisResult;