import React, { useState } from 'react';
import Header from './components/Header';
import VideoUpload from './components/VideoUpload';
import AnalysisResult from './components/AnalysisResult';
import LiveAnalysis from './components/LiveAnalysis';
import { VideoFile, AnalysisStatus } from './types';
import { analyzeVideo } from './services/geminiService';
import { Play, Upload, Radio, Cpu, Database, Network } from 'lucide-react';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Mode state
  const [mode, setMode] = useState<'upload' | 'live'>('upload');

  const handleVideoSelected = (file: VideoFile | null) => {
    setVideoFile(file);
    if (file) {
      setStatus(AnalysisStatus.IDLE);
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;

    setStatus(AnalysisStatus.ANALYZING);
    setError(null);

    try {
      const analysisResult = await analyzeVideo(videoFile.file);
      setResult(analysisResult);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during analysis.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden font-inter">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(30,41,59,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <Header />
      
      <main className="flex-grow p-4 md:p-8 max-w-[1600px] mx-auto w-full relative z-10">
        
        {/* Control Panel / Mode Switcher */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Dashboard // {mode}</h2>
            <p className="text-slate-500 text-xs font-mono mt-1">SELECT OPERATION MODE</p>
          </div>

          <div className="flex gap-2 mt-4 md:mt-0 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setMode('upload')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                mode === 'upload' 
                  ? 'bg-slate-800 text-orange-500 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Upload className="w-3 h-3" />
              File Analysis
            </button>
            <button
              onClick={() => setMode('live')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                mode === 'live' 
                  ? 'bg-slate-800 text-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Radio className={`w-3 h-3 ${mode === 'live' ? 'animate-pulse' : ''}`} />
              Live Stream
            </button>
          </div>
        </div>

        {mode === 'upload' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            
            {/* Left Column: Input (4 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Upload Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 overflow-hidden shadow-2xl">
                 <div className="bg-slate-950 rounded border border-slate-800/50 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                           Input Stream
                        </h3>
                        <span className="text-[10px] font-mono text-slate-600">CH_01</span>
                    </div>
                    
                    <VideoUpload 
                      onVideoSelected={handleVideoSelected} 
                      status={status}
                    />
                    
                    <div className="mt-5">
                      <button
                        onClick={handleAnalyze}
                        disabled={!videoFile || status === AnalysisStatus.ANALYZING}
                        className={`w-full py-3.5 px-6 rounded border font-mono text-sm font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group
                          ${!videoFile || status === AnalysisStatus.ANALYZING
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-orange-600 hover:bg-orange-500 border-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                          }`}
                      >
                        {status === AnalysisStatus.ANALYZING ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                                PROCESSING...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                EXECUTE ANALYSIS
                            </>
                        )}
                      </button>
                    </div>
                 </div>
              </div>

              {/* System Diagnostics Panel (Replacing simple bullets) */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 shadow-xl">
                 <div className="bg-slate-950 rounded border border-slate-800/50 p-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
                        System Diagnostics
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-900 rounded border border-slate-800 group-hover:border-slate-600 transition-colors">
                                    <Cpu className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-200">AI CORE</p>
                                    <p className="text-[10px] text-slate-500 font-mono">GEMINI-3-PRO // READY</p>
                                </div>
                            </div>
                            <div className="h-1.5 w-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                        </div>

                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-900 rounded border border-slate-800 group-hover:border-slate-600 transition-colors">
                                    <Database className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-200">KNOWLEDGE BASE</p>
                                    <p className="text-[10px] text-slate-500 font-mono">STRUCTURAL ENG // LOADED</p>
                                </div>
                            </div>
                            <div className="h-1.5 w-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                        </div>

                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-900 rounded border border-slate-800 group-hover:border-slate-600 transition-colors">
                                    <Network className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-200">UPLINK</p>
                                    <p className="text-[10px] text-slate-500 font-mono">ENCRYPTED // STABLE</p>
                                </div>
                            </div>
                            <div className="h-1.5 w-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Right Column: Output (8 cols) */}
            <div className="lg:col-span-7 flex flex-col h-full">
               <div className="h-full">
                 <AnalysisResult 
                    status={status}
                    result={result}
                    error={error}
                  />
               </div>
            </div>
          </div>
        ) : (
          /* Live Mode View */
          <div className="max-w-5xl mx-auto">
             <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-1 backdrop-blur-sm">
                 <div className="bg-slate-950 rounded-xl border border-slate-800/50 p-6">
                    <LiveAnalysis />
                 </div>
             </div>

             <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Processing Latency</h4>
                    <p className="text-sm font-mono text-emerald-400">145ms</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Model</h4>
                    <p className="text-sm font-mono text-orange-400">GEMINI-3-PRO</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Threat Threshold</h4>
                    <p className="text-sm font-mono text-white">HIGH (0.8)</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Audio Feedback</h4>
                    <p className="text-sm font-mono text-blue-400">ENABLED</p>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;