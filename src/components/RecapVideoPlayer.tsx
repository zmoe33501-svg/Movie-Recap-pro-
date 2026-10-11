import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldCheck,
  Maximize2,
  Eye,
  Sliders,
  Sparkles,
  Zap,
  Music,
  Smartphone
} from 'lucide-react';
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
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const voiceAudioRef = useRef<HTMLAudioElement>(null);
    const bgmAudioRef = useRef<HTMLAudioElement>(null);
    const customIconImgRef = useRef<HTMLImageElement | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(video.duration || 30);
    const [isFreezing, setIsFreezing] = useState(false);
    const [activeSubtitle, setActiveSubtitle] = useState<{ burmese: string; english: string } | null>(null);
    const [voiceVolume, setVoiceVolume] = useState(1);
    const [bgmAudioUrl, setBgmAudioUrl] = useState<string | null>(null);

    const lastFreezeCheckRef = useRef<number>(-1);
    const freezeTimeoutRef = useRef<any>(null);

    // Canvas dimensions based on aspect ratio
    const canvasWidth = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 1080 : 1280;
    const canvasHeight = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 1080 : 720;

    // Generate BGM audio URL when track changes
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
        console.error('Failed to create BGM buffer:', err);
      }
    }, [bgmSettings.track, bgmSettings.enabled]);

    // Handle BGM volume & auto-ducking
    useEffect(() => {
      if (!bgmAudioRef.current) return;
      if (bgmSettings.autoDucking && voiceoverAudioUrl && isPlaying && !isFreezing) {
        // Lower BGM during voiceover speech
        bgmAudioRef.current.volume = Math.max(0.04, bgmSettings.volume * 0.35);
      } else {
        // Swell BGM during freeze pauses or pauses
        bgmAudioRef.current.volume = bgmSettings.volume;
      }
    }, [bgmSettings.volume, bgmSettings.autoDucking, voiceoverAudioUrl, isPlaying, isFreezing]);

    // Apply playback speed to video
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.playbackRate = antiCopyright.playbackSpeed || 1.0;
      }
    }, [antiCopyright.playbackSpeed]);

    // Expose methods for recording / exporting
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
          try {
            if (videoRef.current.error || !videoRef.current.src) {
              videoRef.current.src = '/sample-heist.mp4';
              videoRef.current.load();
            }
            await videoRef.current.play();
            if (voiceAudioRef.current && voiceoverAudioUrl) {
              voiceAudioRef.current.play().catch(() => {});
            }
            if (bgmAudioRef.current && bgmSettings.enabled) {
              bgmAudioRef.current.play().catch(() => {});
            }
            setIsPlaying(true);
          } catch {
            try {
              videoRef.current.src = '/sample-heist.mp4';
              videoRef.current.load();
              await videoRef.current.play();
              setIsPlaying(true);
            } catch {
              setIsPlaying(false);
            }
          }
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

    // Preload custom image logo if supplied
    useEffect(() => {
      if (iconSettings?.customImageUrl) {
        const img = new Image();
        img.src = iconSettings.customImageUrl;
        img.onload = () => {
          customIconImgRef.current = img;
        };
      } else {
        customIconImgRef.current = null;
      }
    }, [iconSettings?.customImageUrl]);

    // Track active subtitle from either video speechSegments or script scenes
    useEffect(() => {
      // 1. If speechSegments exist from video dialogue extraction, use them
      if (speechSegments && speechSegments.length > 0) {
        const activeSeg = speechSegments.find(
          (s) => currentTime >= s.startSec && currentTime < s.endSec + 0.2
        );
        if (activeSeg) {
          setActiveSubtitle({
            burmese: activeSeg.translationBurmese,
            english: activeSeg.translationEnglish || activeSeg.originalText,
          });
          return;
        }
      }

      // 2. Fallback to script scenes
      if (!script || !script.scenes || script.scenes.length === 0) {
        setActiveSubtitle(null);
        return;
      }

      const activeScene = script.scenes.find(
        (s) => currentTime >= s.startSec && currentTime < s.endSec
      );

      if (activeScene) {
        setActiveSubtitle({
          burmese: activeScene.narrationBurmese,
          english: activeScene.narrationEnglish,
        });
      } else {
        if (currentTime < 4 && script.hook) {
          setActiveSubtitle({
            burmese: script.hook,
            english: script.hook,
          });
        } else {
          setActiveSubtitle(null);
        }
      }
    }, [currentTime, script, speechSegments]);

    // Handle 5-second interval freeze frame logic
    useEffect(() => {
      if (!antiCopyright.freezeIntervalSec || antiCopyright.freezeIntervalSec <= 0) return;

      const currentIntSecond = Math.floor(currentTime);
      if (
        currentIntSecond > 0 &&
        currentIntSecond % antiCopyright.freezeIntervalSec === 0 &&
        lastFreezeCheckRef.current !== currentIntSecond &&
        isPlaying &&
        !isFreezing
      ) {
        lastFreezeCheckRef.current = currentIntSecond;
        setIsFreezing(true);

        if (videoRef.current) {
          videoRef.current.pause();
        }

        if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
        freezeTimeoutRef.current = setTimeout(() => {
          setIsFreezing(false);
          if (videoRef.current && isPlaying) {
            videoRef.current.play().catch(() => {});
          }
        }, antiCopyright.freezeDurationSec * 1000);
      }
    }, [currentTime, antiCopyright.freezeIntervalSec, antiCopyright.freezeDurationSec, isPlaying, isFreezing]);

    // Canvas render loop for live mirroring, freeze frames, aspect ratios, and subtitle overlay
    useEffect(() => {
      let animationFrameId: number;
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c) return;

      const ctx = c.getContext('2d');
      if (!ctx) return;

      const render = () => {
        if (v.readyState >= 2) {
          const width = c.width;
          const height = c.height;

          ctx.clearRect(0, 0, width, height);

          // 1. Background Blur (Full 9:16 or user specified background blur)
          if (blurSettings?.enabled && blurSettings.position === 'full-background') {
            ctx.save();
            ctx.filter = `blur(${blurSettings.blurPx || 16}px) brightness(0.45)`;
            ctx.drawImage(v, -width * 0.25, 0, width * 1.5, height);
            ctx.restore();
          } else if (aspectRatio === '9:16') {
            ctx.save();
            ctx.filter = 'blur(16px) brightness(0.4)';
            ctx.drawImage(v, -width * 0.5, 0, width * 2, height);
            ctx.restore();
          } else {
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.save();

          // Calculate center video fit
          let targetW = width;
          let targetH = height;
          let targetX = 0;
          let targetY = 0;

          if (aspectRatio === '9:16') {
            targetW = width;
            targetH = Math.round((width * 9) / 16);
            targetX = 0;
            targetY = Math.round((height - targetH) / 2);
          } else if (aspectRatio === '1:1') {
            targetW = width;
            targetH = Math.round((width * 9) / 16);
            targetX = 0;
            targetY = Math.round((height - targetH) / 2);
          }

          // Anti-Copyright: Horizontal Flip / Mirroring (မူရင်း video ကို ဘယ်ညာပြောင်း)
          if (antiCopyright.flipHorizontal) {
            ctx.translate(targetX + targetW, targetY);
            ctx.scale(-1, 1);
            targetX = 0;
            targetY = 0;
          } else {
            ctx.translate(targetX, targetY);
            targetX = 0;
            targetY = 0;
          }

          // Anti-Copyright: Micro-zoom to cut border signatures
          if (antiCopyright.microZoom) {
            const scale = 1.05;
            const dw = targetW * scale;
            const dh = targetH * scale;
            const dx = (targetW - dw) / 2;
            const dy = (targetH - dh) / 2;
            ctx.drawImage(v, dx, dy, dw, dh);
          } else {
            ctx.drawImage(v, targetX, targetY, targetW, targetH);
          }

          ctx.restore();

          // 2. Custom Regional Blur Placements (Top Bar, Bottom Bar, Custom Box)
          if (blurSettings?.enabled) {
            const bPx = blurSettings.blurPx || 14;
            if (blurSettings.position === 'top-bar') {
              const bH = Math.round(height * 0.22);
              ctx.save();
              ctx.filter = `blur(${bPx}px)`;
              ctx.drawImage(v, 0, 0, width, bH, 0, 0, width, bH);
              ctx.restore();
            } else if (blurSettings.position === 'bottom-bar') {
              const bY = Math.round((height * (blurSettings.boxY || 75)) / 100);
              const bH = Math.round((height * (blurSettings.boxHeight || 25)) / 100);
              ctx.save();
              ctx.filter = `blur(${bPx}px)`;
              ctx.drawImage(v, 0, bY, width, bH, 0, bY, width, bH);
              ctx.restore();
            } else if (blurSettings.position === 'custom-box') {
              const bX = Math.round((width * (blurSettings.boxX || 0)) / 100);
              const bY = Math.round((height * (blurSettings.boxY || 70)) / 100);
              const bW = Math.round((width * (blurSettings.boxWidth || 100)) / 100);
              const bH = Math.round((height * (blurSettings.boxHeight || 25)) / 100);
              ctx.save();
              ctx.filter = `blur(${bPx}px)`;
              ctx.drawImage(v, bX, bY, bW, bH, bX, bY, bW, bH);
              ctx.restore();
            }
          }

          // Anti-Copyright visual filters: Cinematic tone / Vignette
          if (antiCopyright.colorGradeFilter === 'cinematic') {
            ctx.fillStyle = 'rgba(15, 30, 60, 0.08)';
            ctx.fillRect(0, 0, width, height);
          } else if (antiCopyright.colorGradeFilter === 'warm') {
            ctx.fillStyle = 'rgba(60, 35, 10, 0.08)';
            ctx.fillRect(0, 0, width, height);
          } else if (antiCopyright.colorGradeFilter === 'matrix') {
            ctx.fillStyle = 'rgba(10, 60, 30, 0.08)';
            ctx.fillRect(0, 0, width, height);
          }

          // Anti-Copyright: Freeze Frame Visual Glitch/Strobe Ring
          if (isFreezing) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
            ctx.lineWidth = 6;
            ctx.strokeRect(6, 6, width - 12, height - 12);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(14, 14, 250, 38);

            ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = '#f87171';
            ctx.fillText('⚡ 5s COPYRIGHT FREEZE', 26, 38);
          }

          // 3. Draw Custom Subtitles
          if (antiCopyright.subtitlesEnabled && activeSubtitle) {
            const fontSizePx =
              subtitleSettings.fontSize === 'huge'
                ? 26
                : subtitleSettings.fontSize === 'large'
                ? 21
                : subtitleSettings.fontSize === 'medium'
                ? 17
                : 14;

            const subBoxHeight = (subtitleSettings.showBurmese && subtitleSettings.showEnglish) ? 68 : 46;

            let yPos = height - subBoxHeight - 24;
            if (subtitleSettings.position === 'center') {
              yPos = Math.round(height * 0.48);
            } else if (subtitleSettings.position === 'top') {
              yPos = 36;
            } else if (subtitleSettings.position === 'custom' && subtitleSettings.customYPercent) {
              yPos = Math.round((height * subtitleSettings.customYPercent) / 100);
            }

            // Boxed backdrop card
            if (subtitleSettings.boxedBackground) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
              const boxW = width * 0.92;
              const boxX = (width - boxW) / 2;
              ctx.roundRect
                ? ctx.roundRect(boxX, yPos, boxW, subBoxHeight, 10)
                : ctx.fillRect(boxX, yPos, boxW, subBoxHeight);
              ctx.fill();

              ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }

            // Color selection
            const textColor =
              subtitleSettings.color === 'yellow'
                ? '#fde047'
                : subtitleSettings.color === 'cyan'
                ? '#38bdf8'
                : subtitleSettings.color === 'green'
                ? '#4ade80'
                : subtitleSettings.color === 'pink'
                ? '#fb7185'
                : '#ffffff';

            ctx.textAlign = 'center';

            if (subtitleSettings.showBurmese) {
              ctx.font = `bold ${fontSizePx}px "Padauk", "Pyidaungsu", sans-serif`;
              ctx.fillStyle = textColor;
              const burmeseText =
                activeSubtitle.burmese.length > 70
                  ? activeSubtitle.burmese.slice(0, 68) + '...'
                  : activeSubtitle.burmese;
              ctx.fillText(burmeseText, width / 2, yPos + (fontSizePx > 20 ? 30 : 25));
            }

            if (subtitleSettings.showEnglish) {
              const engY = subtitleSettings.showBurmese ? yPos + 52 : yPos + 28;
              ctx.font = `bold ${Math.round(fontSizePx * 0.75)}px "Plus Jakarta Sans", sans-serif`;
              ctx.fillStyle = '#f1f5f9';
              const englishText =
                activeSubtitle.english.length > 80
                  ? activeSubtitle.english.slice(0, 78) + '...'
                  : activeSubtitle.english;
              ctx.fillText(englishText, width / 2, engY);
            }
          }

          // 4. Video Icon / Custom Logo / Channel Badge
          if (iconSettings?.enabled) {
            const iSize = iconSettings.size || 50;
            let iX = 20;
            let iY = 20;

            if (iconSettings.position === 'top-right') {
              iX = width - iSize - 20;
              iY = 20;
            } else if (iconSettings.position === 'bottom-left') {
              iX = 20;
              iY = height - iSize - 35;
            } else if (iconSettings.position === 'bottom-right') {
              iX = width - iSize - 20;
              iY = height - iSize - 35;
            } else if (iconSettings.position === 'custom') {
              iX = Math.round((width * (iconSettings.customX || 80)) / 100);
              iY = Math.round((height * (iconSettings.customY || 20)) / 100);
            }

            ctx.save();
            ctx.globalAlpha = iconSettings.opacity || 0.9;

            if (iconSettings.type === 'custom' && customIconImgRef.current) {
              ctx.drawImage(customIconImgRef.current, iX, iY, iSize, iSize);
            } else {
              // Preset badges
              const badgeW = Math.max(90, iSize * 1.8);
              const badgeH = Math.max(28, iSize * 0.6);

              ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
              ctx.roundRect ? ctx.roundRect(iX, iY, badgeW, badgeH, 6) : ctx.fillRect(iX, iY, badgeW, badgeH);
              ctx.fill();

              ctx.strokeStyle = '#f43f5e';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';

              let badgeText = '🎬 RECAP HD';
              if (iconSettings.preset === 'pro-4k') badgeText = '💎 4K ULTRA';
              else if (iconSettings.preset === 'vip-channel') badgeText = '★ VIP';
              else if (iconSettings.preset === 'verified') badgeText = '✓ VERIFIED';
              else if (iconSettings.preset === 'fire') badgeText = '🔥 TRENDING';

              ctx.fillText(badgeText, iX + badgeW / 2, iY + badgeH / 2 + 4);
            }
            ctx.restore();
          }

          // Top right subtle watermark branding fallback
          if (!iconSettings?.enabled) {
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.textAlign = 'right';
            ctx.fillText(antiCopyright.customWatermark || 'MovieRecap Studio', width - 16, 26);
          }
        }

        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animationFrameId);
        if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
      };
    }, [antiCopyright, isFreezing, activeSubtitle, aspectRatio, subtitleSettings, blurSettings, iconSettings]);

    const handlePlayPause = async () => {
      const v = videoRef.current;
      const va = voiceAudioRef.current;
      const bgm = bgmAudioRef.current;
      if (!v) return;

      if (isPlaying) {
        v.pause();
        if (va) va.pause();
        if (bgm) bgm.pause();
        setIsPlaying(false);
      } else {
        try {
          if (v.error || !v.src) {
            v.src = '/sample-heist.mp4';
            v.load();
          }
          await v.play();
          if (va && voiceoverAudioUrl) {
            va.currentTime = v.currentTime;
            va.play().catch(() => {});
          }
          if (bgm && bgmSettings.enabled) {
            bgm.currentTime = v.currentTime % (bgm.duration || 1);
            bgm.play().catch(() => {});
          }
          setIsPlaying(true);
        } catch {
          try {
            v.src = '/sample-heist.mp4';
            v.load();
            await v.play();
            setIsPlaying(true);
          } catch {
            setIsPlaying(false);
          }
        }
      }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      const v = videoRef.current;
      const va = voiceAudioRef.current;
      const bgm = bgmAudioRef.current;
      if (v) {
        v.currentTime = time;
        setCurrentTime(time);
      }
      if (va) {
        va.currentTime = time;
      }
      if (bgm && bgm.duration) {
        bgm.currentTime = time % bgm.duration;
      }
      lastFreezeCheckRef.current = Math.floor(time);
    };

    const handleRestart = () => {
      const v = videoRef.current;
      const va = voiceAudioRef.current;
      const bgm = bgmAudioRef.current;
      if (v) v.currentTime = 0;
      if (va) va.currentTime = 0;
      if (bgm) bgm.currentTime = 0;
      setCurrentTime(0);
      lastFreezeCheckRef.current = -1;
    };

    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Hidden video element for canvas drawing */}
        <video
          ref={videoRef}
          src={video.url || '/sample-heist.mp4'}
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          muted={antiCopyright.muteOriginalAudio}
          onError={() => {
            if (videoRef.current && !videoRef.current.src.endsWith('/sample-heist.mp4')) {
              videoRef.current.src = '/sample-heist.mp4';
              videoRef.current.load();
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              const ct = videoRef.current.currentTime;
              setCurrentTime(ct);
              onTimeUpdate?.(ct, duration);
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration || video.duration);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (voiceAudioRef.current) voiceAudioRef.current.pause();
            if (bgmAudioRef.current) bgmAudioRef.current.pause();
          }}
          className="hidden"
        />

        {/* Voiceover audio element */}
        {voiceoverAudioUrl && (
          <audio ref={voiceAudioRef} src={voiceoverAudioUrl} />
        )}

        {/* BGM background music audio element */}
        {bgmAudioUrl && (
          <audio ref={bgmAudioRef} src={bgmAudioUrl} loop />
        )}

        {/* Video Canvas Container with dynamic aspect ratio */}
        <div
          className={`relative bg-black flex items-center justify-center overflow-hidden mx-auto transition-all ${
            aspectRatio === '9:16'
              ? 'max-h-[580px] aspect-[9/16]'
              : aspectRatio === '1:1'
              ? 'max-h-[480px] aspect-square'
              : 'aspect-video w-full'
          }`}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="w-full h-full object-contain cursor-pointer"
            onClick={handlePlayPause}
          />

          {/* Anti-Copyright & Format Status Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/90 text-rose-300 border border-rose-500/30 flex items-center space-x-1 shadow-md">
              <Smartphone className="w-3 h-3" />
              <span>{aspectRatio}</span>
            </span>

            {antiCopyright.flipHorizontal && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/90 text-slate-950 flex items-center space-x-1 shadow-md">
                <Sliders className="w-3 h-3" />
                <span>FLIPPED (ဘယ်ညာပြောင်း)</span>
              </span>
            )}

            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center space-x-1 shadow-md ${
                isFreezing
                  ? 'bg-rose-500 text-white animate-pulse scale-105'
                  : 'bg-slate-900/80 text-emerald-400 border border-slate-700'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>{isFreezing ? 'FREEZE ACTIVE (ရပ်တန့်ခြင်း)' : '5s Anti-Strike'}</span>
            </span>

            {bgmSettings.enabled && bgmSettings.track !== 'none' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                <Music className="w-3 h-3" />
                <span>BGM Active</span>
              </span>
            )}
          </div>

          {/* Play Center Overlay when paused */}
          {!isPlaying && (
            <div
              onClick={handlePlayPause}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity group-hover:bg-black/30"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-950/50 transform hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-current translate-x-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Video Control Bar */}
        <div className="p-4 space-y-3 bg-slate-950/80 border-t border-slate-800">
          {/* Progress Timeline Slider */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-400 w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400"
            />
            <span className="text-xs font-mono text-slate-400 w-12">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePlayPause}
                className="w-9 h-9 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-colors shadow-md shadow-rose-950/40"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={handleRestart}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Voice Volume */}
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800 text-xs text-slate-400">
                <Volume2 className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Voice:</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={voiceVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVoiceVolume(v);
                    if (voiceAudioRef.current) voiceAudioRef.current.volume = v;
                  }}
                  className="w-14 h-1 bg-slate-700 rounded appearance-none accent-rose-500"
                  title="Voiceover Volume"
                />
              </div>

              {/* BGM Indicator */}
              {bgmSettings.enabled && bgmSettings.track !== 'none' && (
                <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800 text-xs text-amber-400">
                  <Music className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">BGM Mixed</span>
                </div>
              )}
            </div>

            {/* Quick Status */}
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
                <span>Anti-Copyright Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
RecapVideoPlayer.displayName = 'RecapVideoPlayer';
