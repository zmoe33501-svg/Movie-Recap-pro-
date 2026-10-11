import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  Sliders,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { BgmSettings, VoiceoverConfig } from '../types/recap';
import { createCinematicBgmBuffer, audioBufferToWavBlob } from '../utils/audioExporter';

interface AudioMixerPanelProps {
  bgmSettings: BgmSettings;
  onChangeBgm: (settings: BgmSettings) => void;
  voiceConfig: VoiceoverConfig;
  uiLang: 'my' | 'en';
}

export const AudioMixerPanel: React.FC<AudioMixerPanelProps> = ({
  bgmSettings,
  onChangeBgm,
  voiceConfig,
  uiLang,
}) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [bgmAudioUrl, setBgmAudioUrl] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const bgmTracks = [
    {
      id: 'none',
      name: 'BGM မသုံးပါ (None)',
      nameEn: 'No Music (Voiceover Only)',
      descMy: 'အသံသွင်းထားသော စကားပြောသီးသန့်သာ ထည့်သွင်းမည်',
      descEn: 'Clean solo voiceover track',
      badge: 'Silent',
    },
    {
      id: 'suspense',
      name: 'သည်းထိတ်ရင်ဖို အသံ (Suspense Drone)',
      nameEn: 'Cinematic Suspense Drone',
      descMy: 'ရင်တထိတ်ထိတ် ဖြစ်စေမည့် နက်နဲသော Sub-bass နှင့် နာရီသံစတိုင်လ်',
      descEn: 'Low frequency cinematic drone with tension pulses',
      badge: 'Viral Top Choice',
    },
    {
      id: 'action',
      name: 'သွက်လက်သော အက်ရှင် (Action Heist Beat)',
      nameEn: 'Action Heist Driving Beat',
      descMy: 'လူဖမ်း/ရတနာတိုက် ဖောက်ထွင်းခန်းများအတွက် ရင်ခုန်ဖွယ် Beat',
      descEn: 'Propulsive energetic cadence for crime & action summaries',
      badge: 'High Energy',
    },
    {
      id: 'emotional',
      name: 'ရင်နင့်ဖွယ် ဒရာမာ (Emotional Melancholy)',
      nameEn: 'Emotional Piano & Pad',
      descMy: 'ခံစားချက်နက်ရှိုင်းသော အဖြစ်ဆိုးနှင့် မေတ္တာဖွဲ့ ဇာတ်ကားများအတွက်',
      descEn: 'Lush pads for dramatic tearjerkers and tragedy recaps',
      badge: 'Drama',
    },
    {
      id: 'horror',
      name: 'သရဲတစ္ဆေ/သဘာဝလွန် (Horror Dissonance)',
      nameEn: 'Dark Horror Atmosphere',
      descMy: 'ကြောက်လန့်ဖွယ် သဘာဝလွန် ဇာတ်ကားများအတွက် အလွန်ဆန်းပြားသော အသံ',
      descEn: 'Eerie microtonal textures for ghost & mystery stories',
      badge: 'Eerie',
    },
    {
      id: 'cyberpunk',
      name: 'အနာဂတ်နည်းပညာ (Cyberpunk Synth)',
      nameEn: 'Cyberpunk Arpeggiator',
      descMy: 'စက်ရုပ်နှင့် ၂၀၉၉ အနာဂတ် သိပ္ပံဇာတ်ကားများအတွက် Synth အသံ',
      descEn: 'Fast synthesizer arpeggios for futuristic sci-fi recaps',
      badge: 'Sci-Fi',
    },
  ];

  // Generate audio buffer when track changes
  useEffect(() => {
    if (bgmSettings.track === 'none') {
      setBgmAudioUrl(null);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setIsPlayingPreview(false);
      return;
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = createCinematicBgmBuffer(audioCtx, bgmSettings.track as any, 45);
      const wav = audioBufferToWavBlob(buffer);
      const url = URL.createObjectURL(wav);
      setBgmAudioUrl(url);

      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio(url);
        audioPreviewRef.current.loop = true;
      } else {
        audioPreviewRef.current.src = url;
      }
      audioPreviewRef.current.volume = bgmSettings.volume;
    } catch (err) {
      console.error('Failed to generate BGM preview:', err);
    }
  }, [bgmSettings.track]);

  useEffect(() => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.volume = bgmSettings.volume;
    }
  }, [bgmSettings.volume]);

  const handleToggleBgmTrack = (trackId: string) => {
    onChangeBgm({
      ...bgmSettings,
      track: trackId as any,
      enabled: trackId !== 'none',
    });
  };

  const handleTogglePreview = () => {
    if (!audioPreviewRef.current || !bgmAudioUrl) return;
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play().then(() => setIsPlayingPreview(true)).catch(console.error);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
      {/* Title & Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Music className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              {uiLang === 'my'
                ? 'ရုပ်ရှင်နောက်ခံတေးဂီတ စနစ် (Cinematic BGM & Audio Ducking)'
                : 'Cinematic BGM Music & Audio Ducking Mixer'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {uiLang === 'my'
              ? 'မူရင်းအသံဖျောက်ထားသော ဗီဒီယိုထဲသို့ စိတ်လှုပ်ရှားဖွယ် Royalty-Free တေးဂီတ ထည့်သွင်းပေးခြင်း'
              : 'Add tension, heartbeat sub-bass, and action beats with intelligent auto-ducking'}
          </p>
        </div>

        {/* Auto Ducking toggle */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <input
            type="checkbox"
            id="ducking"
            checked={bgmSettings.autoDucking}
            onChange={(e) => onChangeBgm({ ...bgmSettings, autoDucking: e.target.checked })}
            className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
          />
          <label htmlFor="ducking" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
            {uiLang === 'my' ? 'Auto-Ducking ဖွင့်မည် (စကားပြောချိန် အသံအလိုအလျောက် တိုးပေးခြင်း)' : 'Smart Auto-Ducking (Lowers music while speaking)'}
          </label>
        </div>
      </div>

      {/* Track Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {bgmTracks.map((trk) => {
          const isSelected = bgmSettings.track === trk.id;
          return (
            <div
              key={trk.id}
              onClick={() => handleToggleBgmTrack(trk.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/40'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-100">
                  {uiLang === 'my' ? trk.name : trk.nameEn}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {trk.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                {uiLang === 'my' ? trk.descMy : trk.descEn}
              </p>
            </div>
          );
        })}
      </div>

      {/* Volume & Preview Row */}
      {bgmSettings.track !== 'none' && (
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center space-x-3 flex-1 min-w-[200px]">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs text-slate-300 font-semibold">
                <span>{uiLang === 'my' ? 'နောက်ခံတေးဂီတ အသံအတိုးအကျယ် (BGM Volume)' : 'BGM Level'}:</span>
                <span className="font-mono text-amber-400">{Math.round(bgmSettings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={bgmSettings.volume}
                onChange={(e) => onChangeBgm({ ...bgmSettings, volume: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleTogglePreview}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors"
          >
            {isPlayingPreview ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>{uiLang === 'my' ? 'တေးဂီတ ခဏရပ်မည်' : 'Pause BGM'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{uiLang === 'my' ? 'တေးဂီတ စမ်းနားဆင်ရန်' : 'Preview BGM'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
