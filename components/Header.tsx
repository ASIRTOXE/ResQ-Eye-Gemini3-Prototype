import React from 'react';
import { Shield, Eye, Wifi, Server, Activity } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* Top decorative line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-orange-500/20 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
            <div className="relative bg-slate-900 border border-slate-700 p-2 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-500" />
                <Eye className="w-3 h-3 text-white absolute" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase flex flex-col leading-none">
              <span>ResQ<span className="text-orange-500">-Eye</span></span>
              <span className="text-[9px] font-mono text-slate-500 tracking-[0.2em] mt-0.5">TACTICAL AI UNIT</span>
            </h1>
          </div>
        </div>

        {/* System Metrics (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-8">
            <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Server Link</span>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-500">
                    <Wifi className="w-3 h-3" />
                    <span>SECURE_V4</span>
                </div>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Latency</span>
                <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
                    <Activity className="w-3 h-3" />
                    <span>12ms</span>
                </div>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Uptime</span>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <Server className="w-3 h-3" />
                    <span>99.9%</span>
                </div>
            </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center">
             <div className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 flex items-center gap-3 shadow-inner">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
               </span>
               <span className="text-xs font-bold text-slate-200 tracking-wide">OPERATIONAL</span>
             </div>
        </div>
      </div>
    </header>
  );
};

export default Header;