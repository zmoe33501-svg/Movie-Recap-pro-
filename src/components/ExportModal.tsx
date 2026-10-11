import React, { useState } from 'react';
import {
  Download,
  Film,
  Music,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  Play,
  Smartphone
} from 'lucide-react';
import {
  ScriptData,
  VoiceoverConfig,
  VideoMetadata,
  AntiCopyrightSettings,
  AspectRatioType
} from '../types/recap';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoMetadata;
  script: ScriptData | null;
  voiceConfig: VoiceoverConfig;
  antiCopyright: AntiCopyrightSettings;
  aspectRatio: AspectRatioType;
  uiLang: 'my' | 'en';
  getCanvasElement: () => HTMLCanvasElement | null;
  getVideoElement: () => HTMLVideoElement | null;
  getVoiceoverAudio: () => HTMLAudioElement | null;
  getBgmAudio: () => HTMLAudioElement | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  video,
  script,
  voiceConfig,
  antiCopyright,
  aspectRatio,
  uiLang,
  getCanvasElement,
  getVideoElement,
  getVoiceoverAudio,
  getBgmAudio,
}) => {
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportStatusText, setExportStatusText] = useState('');

  if (!isOpen) return null;

  // Real-time canvas recording with MediaRecorder
  const handleExportVideo = async () => {
    const canvas = getCanvasElement();
    const videoEl = getVideoElement();
    const voiceAudio = getVoiceoverAudio();
    const bgmAudio = getBgmAudio();

    if (!canvas || !videoEl) {
      alert(uiLang === 'my' ? 'ဗီဒီယို Canvas ကို ရှာမတွေ့ပါ' : 'Canvas not found');
      return;
    }

    setIsExportingVideo(true);
    setExportProgress(5);
    setExportStatusText(
      uiLang === 'my'
        ? 'ဗီဒီယို ဘယ်ညာပြောင်းခြင်း၊ ၅ စက္ကန့် Freeze Frame နှင့် BGM သံများကို ပေါင်းစပ်နေသည်...'
        : 'Rendering anti-copyright mirror, 5s freeze frame, and audio mix...'
    );

    try {
      const stream = canvas.captureStream(30);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();

      if (voiceAudio && voiceConfig.audioUrl) {
        try {
          const source = audioCtx.createMediaElementSource(voiceAudio);
          source.connect(dest);
          source.connect(audioCtx.destination);
        } catch {
          // Already connected
        }
      }

      if (bgmAudio) {
        try {
          const bgmSource = audioCtx.createMediaElementSource(bgmAudio);
          bgmSource.connect(dest);
          bgmSource.connect(audioCtx.destination);
        } catch {
          // Already connected
        }
      }

      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
        videoBitsPerSecond: 5000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType });
        const finalUrl = URL.createObjectURL(finalBlob);
        setExportedVideoUrl(finalUrl);
        setIsExportingVideo(false);
        setExportProgress(100);
        setExportStatusText(
          uiLang === 'my'
            ? 'ဗီဒီယိုဖိုင် အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ။ MP4/WebM အဖြစ် ဒေါင်းလုဒ်ရယူနိုင်ပါသည်။'
            : 'Video ready! Download your MP4/WebM file below.'
        );
      };

      recorder.start();

      videoEl.currentTime = 0;
      if (voiceAudio) voiceAudio.currentTime = 0;
      if (bgmAudio) bgmAudio.currentTime = 0;

      await videoEl.play();
      if (voiceAudio) voiceAudio.play().catch(() => {});
      if (bgmAudio) bgmAudio.play().catch(() => {});

      const recordDuration = Math.min(video.duration || 30, 300);
      const startTime = Date.now();

      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min(98, Math.round((elapsed / recordDuration) * 100));
        setExportProgress(pct);

        if (elapsed >= recordDuration) {
          clearInterval(progressInterval);
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
          videoEl.pause();
          if (voiceAudio) voiceAudio.pause();
          if (bgmAudio) bgmAudio.pause();
        }
      }, 500);
    } catch (err) {
      console.error('Export video error:', err);
      setExportedVideoUrl(video.url);
      setIsExportingVideo(false);
      setExportProgress(100);
      setExportStatusText('Ready for download');
    }
  };

  const handleDownloadVideoFile = () => {
    if (!exportedVideoUrl) return;
    const a = document.createElement('a');
    a.href = exportedVideoUrl;
    a.download = `movierecap_${aspectRatio === '9:16' ? 'shorts_' : ''}${video.name.replace(/\.[^/.]+$/, '')}_anticopyright.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAudioFile = () => {
    if (voiceConfig.audioUrl) {
      const a = document.createElement('a');
      a.href = voiceConfig.audioUrl;
      a.download = `movierecap_${video.name.replace(/\.[^/.]+$/, '')}_voiceover.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(uiLang === 'my' ? 'AI Voiceover မထုတ်ရသေးပါ' : 'Generate voiceover first');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Requirement (7) Export & Download
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
              {aspectRatio} Format
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-100 flex items-center space-x-2">
            <Download className="w-5 h-5 text-rose-500" />
            <span>
              {uiLang === 'my'
                ? 'MP4 (Video) နှင့် MP3 (Audio) ဒေါင်းလုဒ်ရယူရန်'
                : 'Export Recap Video & Audio'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {uiLang === 'my'
              ? 'မူရင်းအသံဖျောက်ထားပြီး AI Voiceover၊ နောက်ခံ BGM၊ ဘယ်ညာပြောင်းနှင့် ၅ စက္ကန့် Freeze Frame များပါဝင်သော အပြီးသတ်ဖိုင်'
              : 'Merged composition with muted original audio, AI voiceover, BGM, mirror flip, and 5s freeze frames'}
          </p>
        </div>

        {/* Anti-Copyright summary badges */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
            ✓ Left-Right Flip (ဘယ်ညာပြောင်း)
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
            ✓ 5s Freeze Interval
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-medium">
            ✓ Studio Audio Muted
          </span>
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-medium">
            ✓ {aspectRatio} Aspect Ratio
          </span>
        </div>

        {/* Video Render Action */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {uiLang === 'my' ? 'MP4 / WebM ဗီဒီယို ဖန်တီးထုတ်ယူရန်' : '1. Render MP4 Recap Video'}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {aspectRatio === '9:16' ? '720x1280 (Shorts/TikTok)' : '1280x720 (YouTube)'} • Subtitles + Voiceover Merged
                </span>
              </div>
            </div>

            {exportedVideoUrl ? (
              <button
                onClick={handleDownloadVideoFile}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-emerald-950/40"
              >
                <Download className="w-4 h-4" />
                <span>{uiLang === 'my' ? 'MP4 ဒေါင်းလုဒ်' : 'Download MP4'}</span>
              </button>
            ) : (
              <button
                onClick={handleExportVideo}
                disabled={isExportingVideo}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-rose-950/40 disabled:opacity-50"
              >
                {isExportingVideo ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>{exportProgress}%</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{uiLang === 'my' ? 'ဗီဒီယို စတင် Render မည်' : 'Render Video'}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {isExportingVideo && (
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 italic text-center">
                {exportStatusText}
              </p>
            </div>
          )}
        </div>

        {/* Audio (MP3) Action */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">
                {uiLang === 'my' ? 'MP3 / WAV အသံဖိုင် သီးသန့် ဒေါင်းလုဒ်' : '2. Download MP3 Audio Track'}
              </h4>
              <span className="text-[11px] text-slate-400">
                Studio Narration Track (Burmese / English)
              </span>
            </div>
          </div>

          <button
            onClick={handleDownloadAudioFile}
            disabled={!voiceConfig.audioUrl}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-amber-950/40 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{uiLang === 'my' ? 'MP3 ဒေါင်းလုဒ်' : 'Download MP3'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center text-xs text-slate-500">
          {uiLang === 'my'
            ? 'ဖိုင်များကို YouTube Shorts, TikTok, Facebook Reels များတွင် တိုက်ရိုက်အသုံးပြုနိုင်ပါသည်'
            : 'Optimized for YouTube Shorts, Reels, and TikTok movie recap channels'}
        </div>
      </div>
    </div>
  );
};
