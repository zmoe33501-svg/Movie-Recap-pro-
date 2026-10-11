import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, ShieldCheck, Zap, Music, Smartphone, Move, Maximize, Minimize } from 'lucide-react';
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
  targetDubLanguage?: 'my' | 'en';
  aspectRatio: AspectRatioType;
  uiLang: 'my' | 'en';
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  
  onUpdateSubtitleSettings?: (settings: SubtitleSettings) => void;
  onUpdateIconSettings?: (settings: VideoIconSettings) => void;
  onUpdateBlurSettings?: (settings: BlurSettings) => void;
}

export const RecapVideoPlayer = forwardRef<RecapVideoPlayerRef, RecapVideoPlayerProps>(
  (
    {
      video,
      script,
      antiCopyright,
      voiceoverAudioUrl,
      bgmSettings,
      subtitleSettings,
      blurSettings,
      iconSettings,
      speechSegments,
      targetDubLanguage = 'my',
      aspectRatio,
      uiLang,
      onTimeUpdate,
      onUpdateSubtitleSettings,
      onUpdateIconSettings,
      onUpdateBlurSettings,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const voiceAudioRef = useRef<HTMLAudioElement>(null);
    const bgmAudioRef = useRef<HTMLAudioElement>(null);
    const customIconImgRef = useRef<HTMLImageElement | null>(null);

    const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });
    const [isFullscreen, setIsFullscreen] = useState(false); // NEW: Fullscreen state

    const lastRenderTimeRef = useRef<number>(0);
    const targetFPS = 30; 
    const frameInterval = 1000 / targetFPS;

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(video.duration || 30);
    const [isFreezing, setIsFreezing] = useState(false);
    const [activeSubtitle, setActiveSubtitle] = useState<{ burmese: string; english: string } | null>(null);
    const [voiceVolume, setVoiceVolume] = useState(1);
    const [bgmAudioUrl, setBgmAudioUrl] = useState<string | null>(null);

    const [dragState, setDragState] = useState<{
      item: 'none' | 'logo' | 'subtitle' | 'blur-box' | 'blur-resize';
      startX: number;
      startY: number;
      initialValX: number;
      initialValY: number;
    }>({ item: 'none', startX: 0, startY: 0, initialValX: 0, initialValY: 0 });

    const [localSubtitle, setLocalSubtitle] = useState<SubtitleSettings>(subtitleSettings);
    const [localIcon, setLocalIcon] = useState<VideoIconSettings>(iconSettings || {} as VideoIconSettings);
    const [localBlur, setLocalBlur] = useState<BlurSettings>(blurSettings || {} as BlurSettings);

    useEffect(() => { setLocalSubtitle(subtitleSettings); }, [subtitleSettings]);
    useEffect(() => { setLocalIcon(iconSettings || {} as VideoIconSettings); }, [iconSettings]);
    useEffect(() => { setLocalBlur(blurSettings || {} as BlurSettings); }, [blurSettings]);

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
        const url = URL.createObjectURL(wav);
        setBgmAudioUrl(url);
        if (bgmAudioRef.current) {
          bgmAudioRef.current.src = url;
          bgmAudioRef.current.volume = bgmSettings.volume;
        }
      } catch (err) {
        console.error('BGM Error:', err);
      }
    }, [bgmSettings.track, bgmSettings.enabled]);

    useEffect(() => {
      if (!bgmAudioRef.current) return;
      if (bgmSettings.autoDucking && voiceoverAudioUrl && isPlaying && !isFreezing) {
        bgmAudioRef.current.volume = Math.max(0.04, bgmSettings.volume * 0.35);
      } else {
        bgmAudioRef.current.volume = bgmSettings.volume;
      }
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
      if (iconSettings?.customImageUrl) {
        const img = new Image();
        img.src = iconSettings.customImageUrl;
        img.onload = () => { customIconImgRef.current = img; };
      } else {
        customIconImgRef.current = null;
      }
    }, [iconSettings?.customImageUrl]);

    useEffect(() => {
      if (speechSegments && speechSegments.length > 0) {
        const activeSeg = speechSegments.find((s) => currentTime >= s.startSec && currentTime < s.endSec + 0.2);
        if (activeSeg) {
          setActiveSubtitle({ burmese: activeSeg.translationBurmese, english: activeSeg.translationEnglish || activeSeg.originalText });
          return;
        }
      }
      if (!script || !script.scenes || script.scenes.length === 0) {
        setActiveSubtitle(null);
        return;
      }
      const activeScene = script.scenes.find((s) => currentTime >= s.startSec && currentTime < s.endSec);
      if (activeScene) {
        setActiveSubtitle({ burmese: activeScene.narrationBurmese, english: activeScene.narrationEnglish });
      } else {
        if (currentTime < 4 && script.hook) {
          setActiveSubtitle({ burmese: script.hook, english: script.hook });
        } else {
          setActiveSubtitle(null);
        }
      }
    }, [currentTime, script, speechSegments]);

    useEffect(() => {
      if (!antiCopyright.freezeIntervalSec || antiCopyright.freezeIntervalSec <= 0) return;
      const currentIntSecond = Math.floor(currentTime);
      if (
        currentIntSecond > 0 &&
        currentIntSecond % antiCopyright.freezeIntervalSec === 0 &&
        lastFreezeCheckRef.current !== currentIntSecond &&
        isPlaying && !isFreezing
      ) {
        lastFreezeCheckRef.current = currentIntSecond;
        setIsFreezing(true);
        if (videoRef.current) videoRef.current.pause();
        
        if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
        freezeTimeoutRef.current = setTimeout(() => {
          setIsFreezing(false);
          if (videoRef.current && isPlaying) videoRef.current.play().catch(()=>{});
        }, antiCopyright.freezeDurationSec * 1000);
      }
    }, [currentTime, antiCopyright.freezeIntervalSec, antiCopyright.freezeDurationSec, isPlaying, isFreezing]);

    useEffect(() => {
      let animationFrameId: number;
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;

      let needsSingleRender = true;

      const render = (time: number) => {
        if (!isPlaying && !isFreezing && !needsSingleRender && dragState.item === 'none') {
           animationFrameId = requestAnimationFrame(render);
           return;
        }
        if (time - lastRenderTimeRef.current < frameInterval) {
           animationFrameId = requestAnimationFrame(render);
           return; 
        }
        lastRenderTimeRef.current = time;
        needsSingleRender = false;

        if (v.readyState >= 2) {
          const width = videoSize.width;
          const height = videoSize.height;

          ctx.clearRect(0, 0, width, height);
          ctx.save();

          if (antiCopyright.flipHorizontal) {
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
          }
          
          if (antiCopyright.microZoom) {
            const scale = 1.05;
            const dw = width * scale;
            const dh = height * scale;
            const dx = (width - dw) / 2;
            const dy = (height - dh) / 2;
            ctx.drawImage(v, dx, dy, dw, dh);
          } else {
            ctx.drawImage(v, 0, 0, width, height);
          }
          ctx.restore();

          // Blur Rendering
          if (localBlur?.enabled) {
            const bPx = localBlur.blurPx || 14;
            if (localBlur.position === 'full-background') {
               ctx.save(); ctx.filter = `blur(${bPx}px)`; ctx.drawImage(v, 0, 0, width, height); ctx.restore();
            } else if (localBlur.position === 'top-bar') {
               const bH = Math.round(height * 0.22);
               ctx.save(); ctx.filter = `blur(${bPx}px)`; ctx.drawImage(v, 0, 0, width, bH, 0, 0, width, bH); ctx.restore();
            } else if (localBlur.position === 'bottom-bar') {
               const bY = Math.round((height * (localBlur.boxY || 75)) / 100);
               const bH = Math.round((height * (localBlur.boxHeight || 25)) / 100);
               ctx.save(); ctx.filter = `blur(${bPx}px)`; ctx.drawImage(v, 0, bY, width, bH, 0, bY, width, bH); ctx.restore();
            } else if (localBlur.position === 'custom-box') {
               const bX = Math.round((width * (localBlur.boxX || 0)) / 100);
               const bY = Math.round((height * (localBlur.boxY || 70)) / 100);
               const bW = Math.round((width * (localBlur.boxWidth || 100)) / 100);
               const bH = Math.round((height * (localBlur.boxHeight || 25)) / 100);
               ctx.save(); ctx.filter = `blur(${bPx}px)`; ctx.drawImage(v, bX, bY, bW, bH, bX, bY, bW, bH); ctx.restore();
               
               if (!isPlaying || dragState.item === 'blur-box' || dragState.item === 'blur-resize') {
                 ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.setLineDash([10, 10]);
                 ctx.strokeRect(bX, bY, bW, bH);
                 ctx.fillStyle = '#38bdf8';
                 ctx.fillRect(bX + bW - 20, bY + bH - 20, 20, 20); // Resize Handle
                 ctx.setLineDash([]);
               }
            }
          }

          if (antiCopyright.colorGradeFilter === 'cinematic') {
            ctx.fillStyle = 'rgba(15, 30, 60, 0.08)'; ctx.fillRect(0, 0, width, height);
          } else if (antiCopyright.colorGradeFilter === 'warm') {
            ctx.fillStyle = 'rgba(60, 35, 10, 0.08)'; ctx.fillRect(0, 0, width, height);
          } else if (antiCopyright.colorGradeFilter === 'matrix') {
            ctx.fillStyle = 'rgba(10, 60, 30, 0.08)'; ctx.fillRect(0, 0, width, height);
          }

          if (isFreezing) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)'; ctx.lineWidth = 6; ctx.strokeRect(6, 6, width - 12, height - 12);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(14, 14, 250, 38);
            ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#f87171'; ctx.fillText('⚡ 5s COPYRIGHT FREEZE', 26, 38);
          }

          // Subtitles
          if (antiCopyright.subtitlesEnabled && activeSubtitle) {
            const fontSizePx = localSubtitle.fontSize === 'huge' ? 42 : localSubtitle.fontSize === 'large' ? 34 : localSubtitle.fontSize === 'medium' ? 26 : 20;
            const subBoxHeight = (localSubtitle.showBurmese && localSubtitle.showEnglish) ? fontSizePx * 3 : fontSizePx * 2;
            
            let yPos = Math.round((height * (localSubtitle.customYPercent || 82)) / 100);

            if (localSubtitle.boxedBackground) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
              const boxW = width * 0.92;
              const boxX = (width - boxW) / 2;
              ctx.roundRect ? ctx.roundRect(boxX, yPos - (fontSizePx*1.2), boxW, subBoxHeight, 10) : ctx.fillRect(boxX, yPos - (fontSizePx*1.2), boxW, subBoxHeight);
              ctx.fill();
              
              if (!isPlaying || dragState.item === 'subtitle') {
                 ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 4; ctx.setLineDash([8, 8]);
                 ctx.strokeRect(boxX, yPos - (fontSizePx*1.2), boxW, subBoxHeight);
                 ctx.setLineDash([]);
              }
            }

            const textColor = localSubtitle.color === 'yellow' ? '#fde047' : localSubtitle.color === 'cyan' ? '#38bdf8' : localSubtitle.color === 'green' ? '#4ade80' : localSubtitle.color === 'pink' ? '#fb7185' : '#ffffff';
            ctx.textAlign = 'center';

            if (localSubtitle.showBurmese) {
              ctx.font = `bold ${fontSizePx}px sans-serif`; ctx.fillStyle = textColor;
              ctx.fillText(activeSubtitle.burmese.slice(0, 70), width / 2, yPos);
            }
            if (localSubtitle.showEnglish) {
              ctx.font = `bold ${Math.round(fontSizePx * 0.75)}px sans-serif`; ctx.fillStyle = '#f1f5f9';
              ctx.fillText(activeSubtitle.english.slice(0, 80), width / 2, yPos + (localSubtitle.showBurmese ? fontSizePx + 10 : 0));
            }
          }

          // Custom Logo / Typed Text / Badge
          if (localIcon?.enabled) {
            const iSize = localIcon.size || 50;
            let iX = Math.round((width * (localIcon.customX || 85)) / 100);
            let iY = Math.round((height * (localIcon.customY || 10)) / 100);

            ctx.save();
            ctx.globalAlpha = localIcon.opacity || 0.9;
            
            if (!isPlaying || dragState.item === 'logo') {
               ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
               ctx.strokeRect(iX - 5, iY - 5, iSize + 10, iSize + 10);
               ctx.setLineDash([]);
            }

            if (localIcon.type === 'custom' && customIconImgRef.current) {
              // Draw uploaded image
              ctx.drawImage(customIconImgRef.current, iX, iY, iSize, iSize);
            } else {
              // Draw typed Custom Watermark text as Logo fallback
              const text = antiCopyright.customWatermark || 'MovieRecap Studio';
              ctx.font = `bold ${iSize * 0.4}px sans-serif`; 
              
              // Add a nice background box for the text so it's visible
              const textWidth = ctx.measureText(text).width;
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.roundRect ? ctx.roundRect(iX, iY, textWidth + 20, iSize, 8) : ctx.fillRect(iX, iY, textWidth + 20, iSize);
              ctx.fill();

              ctx.fillStyle = '#ffffff'; 
              ctx.textAlign = 'left';
              ctx.fillText(text, iX + 10, iY + (iSize * 0.65));
            }
            ctx.restore();
          }
        }
        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);
      return () => { cancelAnimationFrame(animationFrameId); };
    }, [antiCopyright, isFreezing, activeSubtitle, localSubtitle, localBlur, localIcon, isPlaying, videoSize, dragState]);

    // --- NEW: TOUCH-SAFE DRAG AND DROP HANDLERS ---
    const getEventPos = (e: React.PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      return { x, y };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (isPlaying) return; 
      
      // CRITICAL FOR MOBILE: Capture pointer to prevent browser scroll/pull-to-refresh
      e.currentTarget.setPointerCapture(e.pointerId);

      const { x, y } = getEventPos(e);
      
      // 1. Blur Box
      if (localBlur.enabled && localBlur.position === 'custom-box') {
        const bx = localBlur.boxX || 0; const by = localBlur.boxY || 70;
        const bw = localBlur.boxWidth || 100; const bh = localBlur.boxHeight || 25;
        if (x > bx + bw - 10 && x <= bx + bw + 10 && y > by + bh - 10 && y <= by + bh + 10) {
          setDragState({ item: 'blur-resize', startX: x, startY: y, initialValX: bw, initialValY: bh });
          return;
        }
        if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
          setDragState({ item: 'blur-box', startX: x, startY: y, initialValX: bx, initialValY: by });
          return;
        }
      }

      // 2. Logo/Watermark text
      if (localIcon.enabled) {
         const ix = localIcon.customX || 85; const iy = localIcon.customY || 10;
         const sizePct = (localIcon.size / videoSize.width) * 100;
         if (x >= ix - 5 && x <= ix + sizePct * 3 && y >= iy - 5 && y <= iy + sizePct + 5) {
            setDragState({ item: 'logo', startX: x, startY: y, initialValX: ix, initialValY: iy });
            return;
         }
      }

      // 3. Subtitles
      if (antiCopyright.subtitlesEnabled && activeSubtitle) {
         const sy = localSubtitle.customYPercent || 82;
         if (y >= sy - 20 && y <= sy + 20) { 
            setDragState({ item: 'subtitle', startX: x, startY: y, initialValX: 0, initialValY: sy });
            return;
         }
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragState.item === 'none') return;
      const { x, y } = getEventPos(e);
      const dx = x - dragState.startX;
      const dy = y - dragState.startY;

      if (dragState.item === 'logo') {
         const newX = Math.max(0, Math.min(100, dragState.initialValX + dx));
         const newY = Math.max(0, Math.min(100, dragState.initialValY + dy));
         setLocalIcon({ ...localIcon, position: 'custom', customX: newX, customY: newY });
      } 
      else if (dragState.item === 'subtitle') {
         const newY = Math.max(5, Math.min(95, dragState.initialValY + dy));
         setLocalSubtitle({ ...localSubtitle, position: 'custom', customYPercent: newY });
      }
      else if (dragState.item === 'blur-box') {
         const newX = Math.max(0, Math.min(100 - (localBlur.boxWidth || 100), dragState.initialValX + dx));
         const newY = Math.max(0, Math.min(100 - (localBlur.boxHeight || 25), dragState.initialValY + dy));
         setLocalBlur({ ...localBlur, boxX: newX, boxY: newY });
      }
      else if (dragState.item === 'blur-resize') {
         const newW = Math.max(10, Math.min(100 - (localBlur.boxX || 0), dragState.initialValX + dx));
         const newH = Math.max(10, Math.min(100 - (localBlur.boxY || 0), dragState.initialValY + dy));
         setLocalBlur({ ...localBlur, boxWidth: newW, boxHeight: newH });
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId); // Release lock
      if (dragState.item === 'logo' && onUpdateIconSettings) onUpdateIconSettings(localIcon);
      if (dragState.item === 'subtitle' && onUpdateSubtitleSettings) onUpdateSubtitleSettings(localSubtitle);
      if ((dragState.item === 'blur-box' || dragState.item === 'blur-resize') && onUpdateBlurSettings) onUpdateBlurSettings(localBlur);
      setDragState({ item: 'none', startX: 0, startY: 0, initialValX: 0, initialValY: 0 });
    };

    const handlePlayPause = async () => {
      const v = videoRef.current;
      if (!v || dragState.item !== 'none') return;
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

    const toggleFullscreen = () => {
      setIsFullscreen(!isFullscreen);
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
            className={`w-full h-full object-contain touch-none select-none ${!isPlaying ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />

          {!isPlaying && dragState.item === 'none' && (
            <div
              onClick={handlePlayPause}
              className="absolute inset-0 bg-black/10 flex items-center justify-center cursor-pointer hover:bg-black/20"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-current translate-x-0.5" />
              </div>
              <div className="absolute top-4 bg-slate-900/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1.5 border border-slate-700">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>Logo၊ Blur၊ စာတန်းများကို လက်ဖြင့် ဖိဆွဲပြီး နေရာရွှေ့ပါ (Pause ထားချိန်သာ ရမည်)</span>
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

             {/* Fullscreen Toggle Button */}
             <button 
                onClick={toggleFullscreen}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 hover:bg-amber-500/30 transition-colors"
             >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'ပုံမှန်အနေအထားသို့ (Exit Fullscreen)' : 'မျက်နှာပြင်ချဲ့ရန် (Fullscreen Edit)'}</span>
             </button>
          </div>
        </div>
      </div>
    );
  }
);
RecapVideoPlayer.displayName = 'RecapVideoPlayer';
