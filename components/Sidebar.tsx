import React from 'react';
import { X, Key, ExternalLink } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, apiKey, setApiKey }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-orange-500" />
              Settings
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
                Google Gemini API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Your key is stored locally in your browser session and never sent to our servers.
              </p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <h3 className="text-sm font-semibold text-white mb-2">Need an API Key?</h3>
              <p className="text-xs text-slate-400 mb-3">
                Get a free API key from Google AI Studio to power ResQ-Eye.
              </p>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          
          <div className="mt-auto border-t border-slate-800 pt-6">
             <p className="text-xs text-center text-slate-600">
               ResQ-Eye v1.0.0
             </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;