import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, RotateCcw, ShieldCheck, Zap, Music, Smartphone, Maximize, Minimize } from 'lucide-react';
import {
  AntiCopyrightSettings,
  ScriptData,
  VideoMetadata,
  BgmSettings,
  SubtitleSettings,
  BlurSettings,
  VideoIconSettings,
  VideoSpeechSegment,
  AspectRatioType
} from '../types/recap';
import { createCinematicBgmBuffer, audioBufferToWavBlob } from '../utils/audioExporter';

// --- HELPER FUNCTION: Auto Word Wrap for long subtitles ---
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
// --------------------------------------------------------

export interface RecapVideoPlayerRef {
  getCanvas: () => HTMLCanvasElement | null;
  getVideoElement: () => HTMLVideoElement | null;
  getVoiceoverAudio: () => HTMLAudioElement | null;
  getBgmAudio: () => HTMLAudioElement | null;
  getCurrentTime: () => number;
  seekTo: (timeSec: number) => void;
  play: () => Promise<void>;
  pause: () => void;
}

interface RecapVideoPlayerProps {
  video: VideoMetadata;
  script: ScriptData | null;
  antiCopyright: AntiCopyrightSettings;
  voiceoverAudioUrl?: string;
  bgmSettings: BgmSettings;
  subtitleSettings: SubtitleSettings;
  blurSettings?: BlurSettings;
  iconSettings?: VideoIconSettings;
  speechSegments?: VideoSpeechSegment[];
  aspectRatio: AspectRatioType;
  uiLang: 'my' | 'en';
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const RecapVideoPlayer = forwardRef<RecapVideoPlayerRef, RecapVideoPlayerProps>(
  (
    {
      video, script, antiCopyright, voiceoverAudioUrl, bgmSettings, subtitleSettings,
      blurSettings, iconSettings, speechSegments, aspectRatio, uiLang, onTimeUpdate
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const voiceAudioRef = useRef<HTMLAudioElement>(null);
    const bgmAudioRef = useRef<HTMLAudioElement>(null);
    const customIconImgRef = useRef<HTMLImageElement | null>(null);

    const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });
    const [isFullscreen, setIsFullscreen] = useState(false);

    const lastRenderTimeRef = useRef<number>(0);
    const targetFPS = 30; 
    const frameInterval = 1000 / targetFPS;

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(video.duration || 30);
    const [isFreezing, setIsFreezing] = useState(false);
    const [activeSubtitle, setActiveSubtitle] = useState<{ burmese: string; english: string } | null>(null);
    const [bgmAudioUrl, setBgmAudioUrl] = useState<string | null>(null);

    const lastFreezeCheckRef = useRef<number>(-1);
    const freezeTimeoutRef = useRef<any>(null);

    useEffect(() => {
      if (!bgmSettings.enabled || bgmSettings.track === 'none') {
        setBgmAudioUrl(null);
        if (bgmAudioRef.current) bgmAudioRef.current.pause();
        return;
      }
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = createCinematicBgmBuffer(audioCtx, bgmSettings.track as any, 50);
        const wav = audioBufferToWavBlob(buffer);
        setBgmAudioUrl(URL.createObjectURL(wav));
        if (bgmAudioRef.current) bgmAudioRef.current.volume = bgmSettings.volume;
      } catch (err) {}
    }, [bgmSettings.track, bgmSettings.enabled]);

    useEffect(() => {
      if (!bgmAudioRef.current) return;
      bgmAudioRef.current.volume = (bgmSettings.autoDucking && voiceoverAudioUrl && isPlaying && !isFreezing) 
        ? Math.max(0.04, bgmSettings.volume * 0.35) 
        : bgmSettings.volume;
    }, [bgmSettings.volume, bgmSettings.autoDucking, voiceoverAudioUrl, isPlaying, isFreezing]);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      getVideoElement: () => videoRef.current,
      getVoiceoverAudio: () => voiceAudioRef.current,
      getBgmAudio: () => bgmAudioRef.current,
      getCurrentTime: () => videoRef.current?.currentTime || 0,
      seekTo: (timeSec: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = timeSec;
          if (voiceAudioRef.current) voiceAudioRef.current.currentTime = timeSec;
          if (bgmAudioRef.current) bgmAudioRef.current.currentTime = timeSec % (bgmAudioRef.current.duration || 1);
        }
      },
      play: async () => {
        if (videoRef.current) {
          await videoRef.current.play().catch(()=>{});
          if (voiceAudioRef.current && voiceoverAudioUrl) voiceAudioRef.current.play().catch(()=>{});
          if (bgmAudioRef.current && bgmSettings.enabled) bgmAudioRef.current.play().catch(()=>{});
          setIsPlaying(true);
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
          if (voiceAudioRef.current) voiceAudioRef.current.pause();
          if (bgmAudioRef.current) bgmAudioRef.current.pause();
          setIsPlaying(false);
        }
      },
    }));

    useEffect(() => {
      if (iconSettings?.type === 'custom' && iconSettings?.customImageUrl) {
        const img = new Image();
        img.src = iconSettings.customImageUrl;
        img.onload = () => { customIconImgRef.current = img; };
      } else {
        customIconImgRef.current = null;
      }
    }, [iconSettings?.customImageUrl, iconSettings?.type]);

    useEffect(() => {
      if (speechSegments && speechSegments.length > 0) {
        const activeSeg = speechSegments.find((s) => currentTime >= s.startSec && currentTime < s.endSec + 0.2);
        if (activeSeg) {
          setActiveSubtitle({ burmese: activeSeg.translationBurmese, english: activeSeg.translationEnglish || activeSeg.originalText });
          return;
        }
      }
      if (!script || !script.scenes || script.scenes.length === 0) {
        setActiveSubtitle(null); return;
      }
      const activeScene = script.scenes.find((s) => currentTime >= s.startSec && currentTime < s.endSec);
      if (activeScene) {
        setActiveSubtitle({ burmese: activeScene.narrationBurmese, english: activeScene.narrationEnglish });
      } else {
        setActiveSubtitle(currentTime < 4 && script.hook ? { burmese: script.hook, english: script.hook } : null);
      }
    }, [currentTime, script, speechSegments]);

    useEffect(() => {
      if (!antiCopyright.freezeIntervalSec || antiCopyright.freezeIntervalSec <= 0) return;
      const currentIntSecond = Math.floor(currentTime);
      if (currentIntSecond > 0 && currentIntSecond % antiCopyright.freezeIntervalSec === 0 && lastFreezeCheckRef.current !== currentIntSecond && isPlaying && !isFreezing) {
        lastFreezeCheckRef.current = currentIntSecond;
        setIsFreezing(true);
        if (videoRef.current) videoRef.current.pause();
        if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
        freezeTimeoutRef.current = setTimeout(() => {
          setIsFreezing(false);
          if (videoRef.current && isPlaying) videoRef.current.play().catch(()=>{});
        }, antiCopyright.freezeDurationSec * 1000);
      }
    }, [currentTime, antiCopyright, isPlaying, isFreezing]);

    useEffect(() => {
      let animationFrameId: number;
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      let needsSingleRender = true;

      const render = (time: number) => {
        if (!isPlaying && !isFreezing && !needsSingleRender) {
           animationFrameId = requestAnimationFrame(render); return;
        }
        if (time - lastRenderTimeRef.current < frameInterval) {
           animationFrameId = requestAnimationFrame(render); return; 
        }
        lastRenderTimeRef.current = time;
        needsSingleRender = false;

        if (v.readyState >= 2) {
          const width = videoSize.width;
          const height = videoSize.height;

          ctx.clearRect(0, 0, width, height);
          ctx.save();
          if (antiCopyright.flipHorizontal) { ctx.translate(width, 0); ctx.scale(-1, 1); }
          ctx.drawImage(v, 0, 0, width, height);
          ctx.restore();

          // Blur Custom Box Rendering
          if (blurSettings?.enabled && blurSettings.position === 'custom-box') {
             const bPx = blurSettings.blurPx || 14;
             const bX = Math.round((width * (blurSettings.boxX || 0)) / 100);
             const bY = Math.round((height * (blurSettings.boxY || 70)) / 100);
             const bW = Math.round((width * (blurSettings.boxWidth || 100)) / 100);
             const bH = Math.round((height * (blurSettings.boxHeight || 25)) / 100);
             ctx.save(); ctx.filter = `blur(${bPx}px)`; ctx.drawImage(v, bX, bY, bW, bH, bX, bY, bW, bH); ctx.restore();
             
             if (!isPlaying) {
               ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.setLineDash([10, 10]);
               ctx.strokeRect(bX, bY, bW, bH);
               ctx.setLineDash([]);
             }
          }

          // Smart Subtitles (Auto Word Wrap)
          if (antiCopyright.subtitlesEnabled && activeSubtitle) {
            const fontSizePx = subtitleSettings.fontSize === 'huge' ? 46 : subtitleSettings.fontSize === 'large' ? 36 : subtitleSettings.fontSize === 'medium' ? 28 : 22;
            const maxTextWidth = width * 0.90; // Allow 90% of screen width

            ctx.font = `bold ${fontSizePx}px sans-serif`;
            const burmeseLines = subtitleSettings.showBurmese ? wrapText(ctx, activeSubtitle.burmese, maxTextWidth) : [];
            
            ctx.font = `bold ${Math.round(fontSizePx * 0.8)}px sans-serif`;
            const englishLines = subtitleSettings.showEnglish ? wrapText(ctx, activeSubtitle.english, maxTextWidth) : [];

            const totalLines = burmeseLines.length + englishLines.length;
            const lineHeight = fontSizePx * 1.4;
            const subBoxHeight = (totalLines * lineHeight) + 20;
            
            // Subtitle Y Position
            let yPos = Math.round((height * (subtitleSettings.customYPercent || 80)) / 100);

            if (subtitleSettings.boxedBackground) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
              const boxW = maxTextWidth + 40;
              const boxX = (width - boxW) / 2;
              const boxY = yPos - fontSizePx;
              ctx.roundRect ? ctx.roundRect(boxX, boxY, boxW, subBoxHeight, 12) : ctx.fillRect(boxX, boxY, boxW, subBoxHeight);
              ctx.fill();
            }

            const textColor = subtitleSettings.color === 'yellow' ? '#fde047' : subtitleSettings.color === 'cyan' ? '#38bdf8' : subtitleSettings.color === 'green' ? '#4ade80' : subtitleSettings.color === 'pink' ? '#fb7185' : '#ffffff';
            ctx.textAlign = 'center';

            let currentTextY = yPos;

            // Draw Burmese Lines
            if (subtitleSettings.showBurmese) {
              ctx.font = `bold ${fontSizePx}px sans-serif`;
              ctx.fillStyle = textColor;
              burmeseLines.forEach(line => {
                ctx.fillText(line, width / 2, currentTextY);
                currentTextY += lineHeight;
              });
            }

            // Draw English Lines
            if (subtitleSettings.showEnglish) {
              ctx.font = `bold ${Math.round(fontSizePx * 0.8)}px sans-serif`;
              ctx.fillStyle = '#f1f5f9';
              englishLines.forEach(line => {
                ctx.fillText(line, width / 2, currentTextY - (fontSizePx*0.2));
                currentTextY += (lineHeight * 0.8);
              });
            }
          }

          // Custom Logo / Badge / Typed Text
          if (iconSettings?.enabled) {
            const iSize = iconSettings.size || 50;
            let iX = Math.round((width * (iconSettings.customX || 85)) / 100);
            let iY = Math.round((height * (iconSettings.customY || 10)) / 100);

            ctx.save();
            ctx.globalAlpha = iconSettings.opacity || 0.9;
            
            if (!isPlaying) {
               ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
               ctx.strokeRect(iX - 5, iY - 5, iSize + 10, iSize + 10);
               ctx.setLineDash([]);
            }

            if (iconSettings.type === 'custom' && customIconImgRef.current) {
              // User uploaded Image
              ctx.drawImage(customIconImgRef.current, iX, iY, iSize, iSize);
            } 
            else if (iconSettings.type === 'text' || (iconSettings as any).type === 'text') {
              // NEW: User typed Text Logo
              const text = (iconSettings as any).customText || 'MovieRecap';
              ctx.font = `bold ${iSize * 0.5}px sans-serif`; 
              const textWidth = ctx.measureText(text).width;
              
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.roundRect ? ctx.roundRect(iX, iY, textWidth + 30, iSize, 8) : ctx.fillRect(iX, iY, textWidth + 30, iSize);
              ctx.fill();

              ctx.fillStyle = '#ffffff'; 
              ctx.textAlign = 'left';
              ctx.fillText(text, iX + 15, iY + (iSize * 0.65));
            } 
            else {
              // Preset Badges
              const badgeW = Math.max(100, iSize * 1.8);
              const badgeH = Math.max(30, iSize * 0.6);
              ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
              ctx.roundRect ? ctx.roundRect(iX, iY, badgeW, badgeH, 6) : ctx.fillRect(iX, iY, badgeW, badgeH);
              ctx.fill();
              ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2; ctx.stroke();
              ctx.font = `bold ${iSize * 0.25}px sans-serif`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
              ctx.fillText('🎬 RECAP HD', iX + badgeW / 2, iY + badgeH / 2 + (iSize*0.1));
            }
            ctx.restore();
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);
      return () => { cancelAnimationFrame(animationFrameId); };
    }, [antiCopyright, isFreezing, activeSubtitle, subtitleSettings, blurSettings, iconSettings, isPlaying, videoSize]);

    const handlePlayPause = async () => {
      const v = videoRef.current;
      if (!v) return;
      if (isPlaying) {
        v.pause();
        if (voiceAudioRef.current) voiceAudioRef.current.pause();
        if (bgmAudioRef.current) bgmAudioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await v.play();
          if (voiceAudioRef.current && voiceoverAudioUrl) voiceAudioRef.current.play().catch(()=>{});
          if (bgmAudioRef.current && bgmSettings.enabled) bgmAudioRef.current.play().catch(()=>{});
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    };

    return (
      <div className={`${isFullscreen ? 'fixed inset-0 z-[100] bg-slate-950 flex flex-col' : 'bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl'}`}>
        <video
          ref={videoRef}
          src={video.url || '/sample-heist.mp4'}
          playsInline preload="auto" crossOrigin="anonymous"
          muted={antiCopyright.muteOriginalAudio}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration || video.duration);
              setVideoSize({ width: videoRef.current.videoWidth || 1280, height: videoRef.current.videoHeight || 720 });
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              const ct = videoRef.current.currentTime;
              if (Math.abs(ct - currentTime) > 0.5 || ct === 0 || ct === videoRef.current.duration) {
                setCurrentTime(ct);
                onTimeUpdate?.(ct, duration);
              }
            }
          }}
          onEnded={() => { setIsPlaying(false); }}
          className="hidden"
        />

        {voiceoverAudioUrl && <audio ref={voiceAudioRef} src={voiceoverAudioUrl} />}
        {bgmAudioUrl && <audio ref={bgmAudioRef} src={bgmAudioUrl} loop />}

        <div className={`relative bg-black flex items-center justify-center overflow-hidden mx-auto transition-all ${isFullscreen ? 'flex-1 w-full h-full' : 'w-full h-[350px] sm:h-[450px] md:h-[500px]'}`}>
          <canvas
            ref={canvasRef}
            width={videoSize.width}
            height={videoSize.height}
            className="w-full h-full object-contain cursor-pointer"
            onClick={handlePlayPause}
          />
          {!isPlaying && (
            <div onClick={handlePlayPause} className="absolute inset-0 bg-black/10 flex items-center justify-center cursor-pointer hover:bg-black/20">
              <div className="w-16 h-16 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-current translate-x-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Video Control Bar */}
        <div className={`p-4 space-y-3 bg-slate-950/80 border-t border-slate-800 ${isFullscreen ? 'pb-8' : ''}`}>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-400 w-12 text-right">
              {`${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}`}
            </span>
            <input
              type="range"
              min={0} max={duration || 1} step={0.1}
              value={currentTime}
              onChange={(e) => {
                const time = parseFloat(e.target.value);
                if (videoRef.current) videoRef.current.currentTime = time;
                setCurrentTime(time);
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
          
          <div className="flex items-center justify-between pt-1">
             <div className="flex items-center space-x-2">
                <button onClick={handlePlayPause} className="w-9 h-9 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md">
                   {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button onClick={() => { if(videoRef.current) videoRef.current.currentTime = 0; }} className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center">
                   <RotateCcw className="w-4 h-4" />
                </button>
             </div>

             <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 hover:bg-slate-700 transition-colors"
             >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'ပုံမှန်အနေအထားသို့' : 'မျက်နှာပြင်ချဲ့ရန်'}</span>
             </button>
          </div>
        </div>
      </div>
    );
  }
);
RecapVideoPlayer.displayName = 'RecapVideoPlayer';
