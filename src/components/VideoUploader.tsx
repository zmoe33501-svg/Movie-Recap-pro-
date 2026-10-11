import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, FileVideo, Clock } from 'lucide-react';
import { VideoMetadata } from '../types/recap';

interface VideoUploaderProps {
  currentVideo: VideoMetadata | null;
  onVideoSelected: (video: VideoMetadata) => void;
  uiLang: 'my' | 'en';
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  currentVideo,
  onVideoSelected,
  uiLang,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const processVideoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    video.onloadedmetadata = () => {
      onVideoSelected({
        name: file.name,
        size: file.size,
        duration: Math.round(video.duration) || 30,
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        url,
        isSample: false,
      });
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      processVideoFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 group ${
          isDragging
            ? 'border-rose-500 bg-rose-500/10 scale-[1.01]'
            : 'border-slate-700/80 hover:border-rose-500/60 bg-slate-900/40 hover:bg-slate-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 p-0.5 shadow-xl shadow-rose-900/30 group-hover:scale-110 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <UploadCloud className="w-8 h-8 text-rose-400 group-hover:text-rose-300 transition-colors" />
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-rose-200 transition-colors">
              {uiLang === 'my'
                ? 'သင့် Movie Video ဖိုင်ကို ဤနေရာတွင် တင်ပါ'
                : 'Upload Your Movie Video File Here'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {uiLang === 'my'
                ? 'MP4, WebM, MOV ဖိုင်များကို Drag & Drop ဆွဲထည့်နိုင်သည် (သို့မဟုတ် နှိပ်၍ရွေးပါ)'
                : 'Drag and drop MP4, WebM, or MOV files, or click to browse'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold">
              ✓ Up to 5-Minute Video (၅ မိနစ်အထိ)
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">Auto Mute Original Audio</span>
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">Auto Flip Filter</span>
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">5s Freeze-Frame Engine</span>
          </div>
        </div>

        {currentVideo && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{uiLang === 'my' ? 'ရွေးချယ်ထားသော ဗီဒီယို:' : 'Active Video:'} {currentVideo.name}</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{Math.floor(currentVideo.duration / 60)}:{currentVideo.duration % 60 < 10 ? '0' : ''}{currentVideo.duration % 60} ({currentVideo.duration}s)</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <FileVideo className="w-3.5 h-3.5" />
              <span>{currentVideo.width}x{currentVideo.height}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
