import React, { useRef, useState, useEffect } from 'react';
import { AlertTriangle, Activity, Volume2, VolumeX, RefreshCw, SwitchCamera, PlayCircle, WifiOff, Mic, MicOff, Radio, Cpu, Wifi, Lock, Zap } from 'lucide-react';
import { analyzeLiveFrame } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const LiveAnalysis: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const demoCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs for state accessed inside intervals (to solve closure staleness)
  const isDemoModeRef = useRef(false);
  const isAudioEnabledRef = useRef(true);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("INITIALIZING LINK...");
  const [isDanger, setIsDanger] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Camera state
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment' | undefined>(undefined);
  
  // LIVE API STATE
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const liveSessionRef = useRef<any>(null); // To store the session object
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioInputContextRef = useRef<AudioContext | null>(null);
  
  const analysisInterval = useRef<number | null>(null);
  const analysisDelayRef = useRef<number>(6000); // Dynamic delay for backoff
  const analysisTimeoutRef = useRef<number | null>(null); // Use timeout for dynamic scheduling

  const demoAnimationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTime = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Sync state to refs
  useEffect(() => {
    isDemoModeRef.current = isDemoMode;
  }, [isDemoMode]);

  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      stopDemoMode();
      disconnectLiveAPI();
    };
  }, []);

  // --- LIVE API (Gemini Native Audio) LOGIC ---
  
  const connectToLiveAPI = async () => {
    if (isDemoMode) return;
    
    stopAnalysisLoop(); // Stop the REST polling
    setIsVoiceMode(true);
    setCurrentStatus("ESTABLISHING SECURE VOICE UPLINK...");
    
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key missing");

        const ai = new GoogleGenAI({ apiKey });
        
        // Setup Audio Contexts
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioContextClass({ sampleRate: 16000 });
        const outputCtx = new AudioContextClass({ sampleRate: 24000 });
        
        audioInputContextRef.current = inputCtx;
        audioContextRef.current = outputCtx;
        nextStartTime.current = 0;

        // Get Audio Stream
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Connect Live Session
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: "You are ResQ-Eye, a tactical AI assistant. Keep responses concise, professional, and military-styled. You are seeing a live video feed.",
            },
            callbacks: {
                onopen: () => {
                    setIsConnected(true);
                    setCurrentStatus("VOICE UPLINK ESTABLISHED // LISTENING");
                    
                    // Setup Audio Input Processing
                    const source = inputCtx.createMediaStreamSource(audioStream);
                    const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmData = createPcmBlob(inputData);
                        
                        // Send Audio
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({ media: pcmData });
                        });
                    };
                    
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputCtx.destination);
                    
                    // Start Video Streaming Loop
                    startLiveVideoStreaming(sessionPromise);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    // Handle Audio Output
                    const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && outputCtx) {
                         const audioData = decodeBase64(base64Audio);
                         const audioBuffer = await decodeAudioData(audioData, outputCtx, 24000, 1);
                         
                         const source = outputCtx.createBufferSource();
                         source.buffer = audioBuffer;
                         source.connect(outputCtx.destination);
                         
                         // Schedule playback
                         const now = outputCtx.currentTime;
                         // If next time is in the past, reset to now
                         if (nextStartTime.current < now) nextStartTime.current = now;
                         
                         source.start(nextStartTime.current);
                         nextStartTime.current += audioBuffer.duration;
                         
                         sourcesRef.current.add(source);
                         source.onended = () => sourcesRef.current.delete(source);
                         
                         setCurrentStatus("RECEIVING TACTICAL AUDIO...");
                    }
                    
                    if (msg.serverContent?.turnComplete) {
                        setCurrentStatus("VOICE UPLINK ACTIVE // STANDBY");
                    }
                },
                onclose: () => {
                    setIsConnected(false);
                    setIsVoiceMode(false);
                    startAnalysis(); // Resume polling
                },
                onerror: (e) => {
                    console.error("Live API Error:", e);
                    setCurrentStatus("UPLINK ERROR // REVERTING");
                    disconnectLiveAPI();
                }
            }
        });
        
        liveSessionRef.current = sessionPromise;

    } catch (e: any) {
        console.error("Failed to connect Live API", e);
        setError("VOICE COMM FAILED: " + e.message);
        setIsVoiceMode(false);
        startAnalysis();
    }
  };

  const startLiveVideoStreaming = (sessionPromise: Promise<any>) => {
      // 2 FPS video stream for Live API
      const interval = window.setInterval(async () => {
         if (!videoRef.current || !canvasRef.current) return;
         if (videoRef.current.readyState !== 4) return;
         
         const ctx = canvasRef.current.getContext('2d');
         if (!ctx) return;
         
         canvasRef.current.width = videoRef.current.videoWidth * 0.5; // Downscale for bandwidth
         canvasRef.current.height = videoRef.current.videoHeight * 0.5;
         ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
         
         const base64 = canvasRef.current.toDataURL('image/jpeg', 0.6);
         const data = base64.split(',')[1];
         
         sessionPromise.then(session => {
             session.sendRealtimeInput({
                 media: {
                     mimeType: 'image/jpeg',
                     data: data
                 }
             });
         });

      }, 500); // 500ms = 2fps
      
      // Store interval ID in a way we can clear it? 
      // Reuse analysisInterval ref since we cleared it for polling
      analysisInterval.current = interval;
  };

  const disconnectLiveAPI = () => {
      // Stop Audio Contexts
      if (audioContextRef.current) audioContextRef.current.close();
      if (audioInputContextRef.current) audioInputContextRef.current.close();
      
      // Stop Sources
      sourcesRef.current.forEach(s => s.stop());
      sourcesRef.current.clear();
      
      // Close Session if possible (not directly exposed in basic promise, relying on ref logic if we had the object)
      // The API doesn't have a clean 'close' on the promise wrapper easily without storing the result.
      if (liveSessionRef.current) {
          liveSessionRef.current.then((session: any) => {
               // Assuming session has close, if not we just kill connection logic
               if(session.close) session.close();
          });
      }
      
      setIsConnected(false);
      setIsVoiceMode(false);
      startAnalysis(); // Go back to snapshot mode
  };

  // --- AUDIO UTILS ---
  function createPcmBlob(data: Float32Array): { data: string, mimeType: string } {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
      }
      const u8 = new Uint8Array(int16.buffer);
      let binary = '';
      const len = u8.byteLength;
      for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(u8[i]);
      }
      return {
          data: btoa(binary),
          mimeType: 'audio/pcm;rate=16000'
      };
  }
  
  function decodeBase64(base64: string) {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
  }
  
  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
      const dataInt16 = new Int16Array(data.buffer);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      for (let i = 0; i < numChannels; i++) {
          const channelData = buffer.getChannelData(i);
          for (let j = 0; j < frameCount; j++) {
              channelData[j] = dataInt16[j * numChannels + i] / 32768.0;
          }
      }
      return buffer;
  }

  // --- CAMERA LOGIC ---

  const toggleCamera = async () => {
    if (isDemoMode) return;
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    await startCamera(newMode);
  };

  const startCamera = async (overrideFacingMode?: 'user' | 'environment') => {
    stopCamera(); 
    stopDemoMode();
    setError(null);
    setDemoModeState(false);
    
    const targetFacingMode = overrideFacingMode !== undefined ? overrideFacingMode : facingMode;
    
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (e) {
        console.warn("Device enumeration failed:", e);
      }

      let stream: MediaStream;

      try {
        const constraints: MediaStreamConstraints = {
          video: targetFacingMode ? { facingMode: targetFacingMode } : true,
          audio: false
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        console.warn(`Camera start failed with mode ${targetFacingMode}, attempting fallback...`, firstErr);
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (targetFacingMode) setFacingMode(undefined); 
        } catch (secondErr: any) {
            throw secondErr;
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Play error:", e));
        };
      }
      
      // If we were in voice mode, we need to restart the stream maybe?
      // For now, default to REST analysis when camera restarts
      startAnalysis();

    } catch (err: any) {
      console.warn("Camera initialization failed, switching to Simulation Mode:", err.message || err);
      startDemoMode();
    }
  };

  const stopCamera = () => {
    stopAnalysisLoop();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const stopAnalysisLoop = () => {
      if (analysisInterval.current) {
        window.clearInterval(analysisInterval.current);
        analysisInterval.current = null;
      }
      if (analysisTimeoutRef.current) {
          clearTimeout(analysisTimeoutRef.current);
          analysisTimeoutRef.current = null;
      }
  }

  const stopDemoMode = () => {
     if (demoAnimationRef.current) {
         cancelAnimationFrame(demoAnimationRef.current);
         demoAnimationRef.current = null;
     }
  }

  const setDemoModeState = (enabled: boolean) => {
      setIsDemoMode(enabled);
      isDemoModeRef.current = enabled;
  }

  const simulateSignalLoss = () => {
    stopCamera();
    stopDemoMode();
    disconnectLiveAPI();
    setError("CONNECTION TERMINATED // MANUAL OVERRIDE");
  };

  const startDemoMode = () => {
    stopCamera();
    setError(null);
    setDemoModeState(true);
    setCurrentStatus("SIMULATION ACTIVE // SCANNING SYNTHETIC FEED");
    
    // Start animation loop
    const animate = () => {
        if (!demoCanvasRef.current) return;
        const ctx = demoCanvasRef.current.getContext('2d');
        if (!ctx) return;
        
        const w = demoCanvasRef.current.width;
        const h = demoCanvasRef.current.height;
        const time = Date.now() / 1000;
        
        // Dark tactical background
        ctx.fillStyle = '#020617'; 
        ctx.fillRect(0, 0, w, h);
        
        // Grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        const gridSize = 40;
        const offset = (time * 20) % gridSize;
        
        ctx.beginPath();
        for(let x = 0; x < w; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        for(let y = offset - gridSize; y < h; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        ctx.stroke();
        
        // Radar
        ctx.save();
        ctx.translate(w/2, h/2);
        ctx.rotate(time * 2);
        const gradient = ctx.createLinearGradient(0, 0, w/2, 0);
        gradient.addColorStop(0, 'rgba(249, 115, 22, 0)');
        gradient.addColorStop(1, 'rgba(249, 115, 22, 0.2)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0, 0, Math.max(w,h), 0, 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        if (Math.random() > 0.95) {
             const bx = Math.random() * w;
             const by = Math.random() * h;
             ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
             ctx.beginPath();
             ctx.arc(bx, by, 5, 0, Math.PI * 2);
             ctx.fill();
        }
        demoAnimationRef.current = requestAnimationFrame(animate);
    };
    
    setTimeout(() => {
        if (demoCanvasRef.current) {
            demoCanvasRef.current.width = 640;
            demoCanvasRef.current.height = 360;
            animate();
            startAnalysis(); 
        } else {
            setTimeout(() => {
                if (demoCanvasRef.current) {
                    demoCanvasRef.current.width = 640;
                    demoCanvasRef.current.height = 360;
                    animate();
                    startAnalysis();
                }
            }, 200);
        }
    }, 100);
  };

  const startAnalysis = () => {
    stopAnalysisLoop();
    analysisDelayRef.current = 6000; // Reset delay to 6s
    
    // Recursive timeout function for dynamic delay
    const runAnalysisLoop = async () => {
        await captureAndAnalyze();
        
        // Schedule next run
        analysisTimeoutRef.current = setTimeout(runAnalysisLoop, analysisDelayRef.current);
    };
    
    analysisTimeoutRef.current = setTimeout(runAnalysisLoop, 1000);
  };

  const captureAndAnalyze = async () => {
      let base64Image = '';
      const inDemoMode = isDemoModeRef.current; 

      if (inDemoMode) {
          if (!demoCanvasRef.current) return;
          base64Image = demoCanvasRef.current.toDataURL('image/jpeg', 0.8);
      } else {
          if (!videoRef.current || !canvasRef.current) return;
          if (videoRef.current.readyState !== 4) return;
          
          const context = canvasRef.current.getContext('2d');
          if (context) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8);
          }
      }
      
      if (!base64Image) return;

      setIsAnalyzing(true);
      try {
          const result = await analyzeLiveFrame(base64Image);
          
          // Check for Rate Limit to backoff
          if (result.includes("RATE LIMIT") || result.includes("STANDBY")) {
              // Increase delay, max 30s
              analysisDelayRef.current = Math.min(analysisDelayRef.current * 1.5, 30000); 
          } else {
              // Slowly return to normal speed
              if (analysisDelayRef.current > 6000) {
                  analysisDelayRef.current = Math.max(analysisDelayRef.current * 0.8, 6000);
              }
          }
          
          handleAnalysisResult(result);
      } catch (err) {
          console.error("Frame analysis failed", err);
      }
      setIsAnalyzing(false);
  }

  const handleAnalysisResult = (text: string) => {
    const cleanText = text.trim();
    setCurrentStatus(cleanText);

    const isSafe = cleanText.toUpperCase().includes("SAFE");
    setIsDanger(!isSafe);

    if (!isSafe && isAudioEnabledRef.current) { 
      speakAlert(cleanText);
    }
  };

  const speakAlert = (text: string) => {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.speaking) return;
    if (text.includes("RATE LIMIT") || text.includes("STANDBY")) return;

    const speechText = text.replace(/^ALERT:/i, "").trim();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleAudioToggle = () => {
      const newState = !isAudioEnabled;
      setIsAudioEnabled(newState);
      isAudioEnabledRef.current = newState;
  }

  const toggleVoiceMode = () => {
      if (isVoiceMode) {
          disconnectLiveAPI();
      } else {
          connectToLiveAPI();
      }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Signal Lost</h3>
        <p className="text-slate-400 mt-0 max-w-md text-sm mb-6">{error}</p>
        <div className="flex gap-4">
            <button 
                onClick={() => startCamera()}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
            >
                <RefreshCw className="w-4 h-4" />
                Retry Feed
            </button>
            <button 
                onClick={startDemoMode}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-orange-900/20"
            >
                <PlayCircle className="w-4 h-4" />
                Start Simulation
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border-2 transition-all duration-300 ${isDanger ? 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]' : isVoiceMode ? 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'border-slate-700 shadow-2xl'}`}>
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative aspect-video bg-black group">
        
        {isDemoMode ? (
            <canvas ref={demoCanvasRef} className="w-full h-full object-cover" />
        ) : (
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        )}
        
        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6">
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDemoMode ? 'bg-orange-400' : isVoiceMode ? 'bg-cyan-400' : 'bg-red-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isDemoMode ? 'bg-orange-500' : isVoiceMode ? 'bg-cyan-500' : 'bg-red-500'}`}></span>
                        </span>
                        <span className={`font-mono font-bold tracking-wider bg-black/60 backdrop-blur-sm px-3 py-1 rounded border text-xs md:text-sm ${isDemoMode ? 'text-orange-500 border-orange-500/30' : isVoiceMode ? 'text-cyan-500 border-cyan-500/30' : 'text-red-500 border-red-500/30'}`}>
                            {isDemoMode ? 'SIMULATION MODE' : isVoiceMode ? 'VOICE UPLINK ACTIVE' : `LIVE FEED // ${facingMode === 'environment' ? 'REAR' : 'FRONT'} CAM`}
                        </span>
                    </div>

                    {/* NEW: Tactical Indicators */}
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-4 duration-700">
                        {/* Model Indicator */}
                        <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded-sm border-l-2 border-orange-500 shadow-lg">
                            <Cpu className="w-3 h-3 text-orange-400" />
                            <span className="text-[10px] font-mono font-bold text-orange-400/90 tracking-widest uppercase">
                                {isVoiceMode ? 'GEMINI-NATIVE' : 'GEMINI-2.0-FLASH'}
                            </span>
                        </div>
                        
                        {/* Connectivity Indicator */}
                        <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded-sm border-l-2 border-cyan-500 shadow-lg">
                             {isConnected || isAnalyzing ? (
                                 <Lock className="w-3 h-3 text-cyan-400" />
                             ) : (
                                 <Wifi className="w-3 h-3 text-slate-500" />
                             )}
                            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${isConnected || isAnalyzing ? 'text-cyan-400' : 'text-slate-500'}`}>
                                {isConnected || isAnalyzing ? 'LINK: SECURE' : 'LINK: READY'}
                            </span>
                        </div>
                        
                        {/* Latency/FPS Simulation */}
                        {!isDemoMode && (
                            <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded-sm border-l-2 border-green-500 shadow-lg hidden md:flex">
                                <Zap className="w-3 h-3 text-green-400" />
                                <span className="text-[10px] font-mono font-bold text-green-400 tracking-widest uppercase">
                                    LATENCY: 12ms
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex gap-2 pointer-events-auto">
                    {/* Voice Button - Styled to Cyan */}
                    <button 
                        onClick={toggleVoiceMode}
                        disabled={isDemoMode}
                        className={`p-2.5 bg-black/60 border rounded-lg backdrop-blur-sm transition-colors ${
                            isVoiceMode 
                                ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400 animate-pulse' 
                                : 'border-slate-700 text-white hover:bg-slate-800'
                        } ${isDemoMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Two-Way Voice Comms"
                    >
                        {isVoiceMode ? <Mic className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
                    </button>

                    {!isDemoMode && hasMultipleCameras && (
                        <button 
                            onClick={toggleCamera}
                            className="p-2.5 bg-black/60 hover:bg-slate-800 border border-slate-700 rounded-lg text-white backdrop-blur-sm transition-colors"
                        >
                            <SwitchCamera className="w-5 h-5" />
                        </button>
                    )}
                    <button 
                        onClick={handleAudioToggle}
                        className={`p-2.5 bg-black/60 border rounded-lg text-white backdrop-blur-sm transition-colors ${isAudioEnabled ? 'border-slate-700 hover:bg-slate-800' : 'border-red-500/50 bg-red-900/20 text-red-400'}`}
                    >
                        {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={simulateSignalLoss}
                        className="p-2.5 bg-black/60 border border-slate-700 hover:bg-red-900/30 hover:border-red-500 hover:text-red-500 rounded-lg text-white backdrop-blur-sm transition-colors"
                        title="Simulate Signal Loss"
                    >
                        <WifiOff className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Central Target Reticle */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 border rounded-full flex items-center justify-center opacity-30 pointer-events-none ${isVoiceMode ? 'border-cyan-400' : 'border-white/10'}`}>
                <div className="w-1 h-4 bg-white/50 absolute top-0 left-1/2 -translate-x-1/2"></div>
                <div className="w-1 h-4 bg-white/50 absolute bottom-0 left-1/2 -translate-x-1/2"></div>
                <div className="h-1 w-4 bg-white/50 absolute left-0 top-1/2 -translate-y-1/2"></div>
                <div className="h-1 w-4 bg-white/50 absolute right-0 top-1/2 -translate-y-1/2"></div>
                {isVoiceMode && <div className="absolute inset-0 border-2 border-cyan-500 rounded-full animate-ping opacity-20"></div>}
                <div className={`w-2 h-2 rounded-full animate-pulse ${isDanger ? 'bg-red-500/50' : 'bg-green-500/50'}`}></div>
            </div>

            {/* Status Bar */}
            <div className={`mt-auto backdrop-blur-md border rounded-xl p-4 transition-colors duration-500 ${isDanger ? 'bg-red-950/90 border-red-500' : isVoiceMode ? 'bg-cyan-950/90 border-cyan-500' : 'bg-slate-900/90 border-slate-600'}`}>
                <div className="flex items-center gap-4">
                    {isAnalyzing || isVoiceMode ? (
                         <div className="relative w-10 h-10 flex-shrink-0">
                             <div className="absolute inset-0 border-2 border-slate-600 rounded-full"></div>
                             <div className={`absolute inset-0 border-2 rounded-full border-t-transparent animate-spin ${isVoiceMode ? 'border-cyan-500' : 'border-orange-500'}`}></div>
                         </div>
                    ) : (
                        <div className={`p-2 rounded-lg flex-shrink-0 ${isDanger ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                            {isDanger ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <Activity className="w-6 h-6" />}
                        </div>
                    )}
                    
                    <div className="flex-grow overflow-hidden">
                        <h4 className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDanger ? 'text-red-400' : isVoiceMode ? 'text-cyan-400' : 'text-green-400'}`}>
                            {isDanger ? '⚠️ THREAT DETECTED' : isVoiceMode ? '🎙️ VOICE CHANNEL OPEN' : '✅ SYSTEM NOMINAL'}
                        </h4>
                        <p className="text-lg md:text-xl font-mono text-white truncate">
                            {currentStatus}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAnalysis;