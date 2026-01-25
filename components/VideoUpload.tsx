import React, { useCallback, useState } from 'react';
import { Upload, X, FileVideo, Scan, MonitorPlay } from 'lucide-react';
import { VideoFile, AnalysisStatus } from '../types';
import { formatFileSize } from '../utils/fileUtils';

interface VideoUploadProps {
  onVideoSelected: (file: VideoFile | null) => void;
  status: AnalysisStatus;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoSelected, status }) => {
  const [dragActive, setDragActive] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoFile | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert("INVALID FILE TYPE. SYSTEM REQUIRES VIDEO FORMAT.");
      return;
    }
    const url = URL.createObjectURL(file);
    const videoData = { file, previewUrl: url };
    setCurrentVideo(videoData);
    onVideoSelected(videoData);
  };

  const clearVideo = () => {
    if (currentVideo) {
      URL.revokeObjectURL(currentVideo.previewUrl);
    }
    setCurrentVideo(null);
    onVideoSelected(null);
  };

  if (currentVideo) {
    return (
      <div className="w-full bg-black rounded-lg overflow-hidden border border-slate-700 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative group">
        {/* Header of Video Player */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/90 to-transparent z-10 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-900/80 backdrop-blur rounded border border-slate-700">
            <FileVideo className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-mono text-slate-300 uppercase truncate max-w-[150px]">
              {currentVideo.file.name}
            </span>
            <span className="text-[10px] font-mono text-slate-500 border-l border-slate-600 pl-2">
               {formatFileSize(currentVideo.file.size)}
            </span>
          </div>
          
          {status !== AnalysisStatus.ANALYZING && (
             <button 
               onClick={clearVideo}
               className="p-1.5 bg-red-500/20 hover:bg-red-500 border border-red-500/50 rounded text-red-400 hover:text-white transition-all"
             >
               <X className="w-4 h-4" />
             </button>
          )}
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-slate-950 flex justify-center items-center">
          <video 
            src={currentVideo.previewUrl} 
            controls 
            className="w-full h-full object-contain"
          />
          {/* Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>
        
        {/* Bottom Bar */}
        <div className="bg-slate-900 border-t border-slate-800 p-2 flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>SOURCE: UPLOAD</span>
            <span>STATUS: LOADED</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full h-72 border border-dashed rounded-lg transition-all duration-300 overflow-hidden group
        ${dragActive 
          ? 'border-orange-500 bg-orange-500/5 shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]' 
          : 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-600'
        }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-600 group-hover:border-orange-500 transition-colors"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-600 group-hover:border-orange-500 transition-colors"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-600 group-hover:border-orange-500 transition-colors"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-600 group-hover:border-orange-500 transition-colors"></div>

      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        accept="video/*"
        onChange={handleChange}
        disabled={status === AnalysisStatus.ANALYZING}
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${dragActive ? 'bg-orange-500/20 scale-110' : 'bg-slate-800 border border-slate-700 group-hover:border-slate-500'}`}>
           <Upload className={`w-8 h-8 ${dragActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-200'}`} />
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2 tracking-wide">
          INITIATE DATA UPLINK
        </h3>
        <p className="text-slate-500 text-xs font-mono max-w-xs mx-auto mb-6">
          DRAG FOOTAGE FILE OR CLICK TO BROWSE
          <br/>
          <span className="opacity-50">SUPPORTED: MP4, MOV, AVI</span>
        </p>

        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-600">
            <div className="flex items-center gap-1">
                <Scan className="w-3 h-3" />
                AUTO-SCAN
            </div>
            <div className="flex items-center gap-1">
                <MonitorPlay className="w-3 h-3" />
                HD PLAYBACK
            </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;