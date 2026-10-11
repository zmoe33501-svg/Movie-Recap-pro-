import React from 'react';
import {
  Type,
  Smartphone,
  Monitor,
  Square,
  Sparkles,
  Sliders,
  Check,
  Eye
} from 'lucide-react';
import { SubtitleSettings, AspectRatioType } from '../types/recap';

interface SubtitleCustomizerProps {
  subtitleSettings: SubtitleSettings;
  onChangeSubtitle: (settings: SubtitleSettings) => void;
  aspectRatio: AspectRatioType;
  onChangeAspectRatio: (ratio: AspectRatioType) => void;
  uiLang: 'my' | 'en';
}

export const SubtitleCustomizer: React.FC<SubtitleCustomizerProps> = ({
  subtitleSettings,
  onChangeSubtitle,
  aspectRatio,
  onChangeAspectRatio,
  uiLang,
}) => {
  const update = <K extends keyof SubtitleSettings>(key: K, value: SubtitleSettings[K]) => {
    onChangeSubtitle({
      ...subtitleSettings,
      [key]: value,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* Aspect Ratio Platform Presets */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-rose-500" />
              <span>
                {uiLang === 'my'
                  ? 'ဗီဒီယို အချိုးအစား ရွေးချယ်မှု (Video Aspect Ratio)'
                  : 'Video Format & Aspect Ratio for Social Platforms'}
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {uiLang === 'my'
                ? 'YouTube Shorts / TikTok (9:16) သို့မဟုတ် YouTube Standard (16:9) စိတ်ကြိုက် ပြောင်းလဲနိုင်သည်'
                : 'Optimize dimensions for YouTube Shorts, TikTok Reels, or Desktop widescreen'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3">
          {/* 16:9 Landscape */}
          <button
            type="button"
            onClick={() => onChangeAspectRatio('16:9')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              aspectRatio === '16:9'
                ? 'border-rose-500 bg-rose-500/15 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/40 text-rose-200'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <Monitor className="w-5 h-5 text-rose-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">16:9</span>
            </div>
            <div className="mt-3">
              <span className="font-bold text-xs block text-slate-100">YouTube & FB</span>
              <span className="text-[10px] text-slate-400">Landscape (1280x720)</span>
            </div>
          </button>

          {/* 9:16 Vertical Shorts/TikTok */}
          <button
            type="button"
            onClick={() => onChangeAspectRatio('9:16')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              aspectRatio === '9:16'
                ? 'border-rose-500 bg-rose-500/15 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/40 text-rose-200'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <Smartphone className="w-5 h-5 text-rose-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">Viral 9:16</span>
            </div>
            <div className="mt-3">
              <span className="font-bold text-xs block text-slate-100">Shorts & TikTok</span>
              <span className="text-[10px] text-slate-400">Vertical Mobile (720x1280)</span>
            </div>
          </button>

          {/* 1:1 Square */}
          <button
            type="button"
            onClick={() => onChangeAspectRatio('1:1')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              aspectRatio === '1:1'
                ? 'border-rose-500 bg-rose-500/15 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/40 text-rose-200'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <Square className="w-5 h-5 text-rose-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">1:1</span>
            </div>
            <div className="mt-3">
              <span className="font-bold text-xs block text-slate-100">Square Feed</span>
              <span className="text-[10px] text-slate-400">Instagram / FB Feed</span>
            </div>
          </button>
        </div>
      </div>

      {/* Subtitle Customizer */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Type className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-sm text-slate-100">
              {uiLang === 'my'
                ? 'မြန်မာ & English စာတန်းထိုး စတိုင်လ်များ (Subtitle Styling)'
                : 'Custom Subtitle Typography & Positioning'}
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Font Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {uiLang === 'my' ? 'စာလုံးအရွယ်အစား (Size)' : 'Subtitle Font Size'}
            </label>
            <select
              value={subtitleSettings.fontSize}
              onChange={(e) => update('fontSize', e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="small">Small (သပ်ရပ်သော အရွယ်)</option>
              <option value="medium">Medium (Standard 18px)</option>
              <option value="large">Large (ထင်ရှားသော 22px)</option>
              <option value="huge">Viral Extra Large (CapCut Style 26px)</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {uiLang === 'my' ? 'စာလုံးအရောင် (Highlight Color)' : 'Highlight Color'}
            </label>
            <select
              value={subtitleSettings.color}
              onChange={(e) => update('color', e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="yellow">Vivid Movie Recap Yellow (ဝါဝင်းသော ရုပ်ရှင်အဝါ)</option>
              <option value="white">Pure Cinematic White (ကြည်လင်သော အဖြူရောင်)</option>
              <option value="cyan">Neon Cyan Blue (နီယွန် အပြာနုရောင်)</option>
              <option value="green">Lime Green (စိမ်းလန်းသော စတိုင်လ်)</option>
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {uiLang === 'my' ? 'စာတန်းထိုး တည်နေရာ (Position)' : 'Screen Placement'}
            </label>
            <select
              value={subtitleSettings.position}
              onChange={(e) => update('position', e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="bottom">အောက်ခြေ (Bottom Screen - Recommended)</option>
              <option value="center">အလယ်ဗဟို (Center Dramatic - Shorts Style)</option>
              <option value="top">ထိပ်ပိုင်း (Top Screen)</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={subtitleSettings.showBurmese}
              onChange={(e) => update('showBurmese', e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 bg-slate-950 border-slate-700"
            />
            <span>{uiLang === 'my' ? 'မြန်မာစာတန်းထိုး ပြမည်' : 'Show Burmese Subtitle'}</span>
          </label>

          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={subtitleSettings.showEnglish}
              onChange={(e) => update('showEnglish', e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 bg-slate-950 border-slate-700"
            />
            <span>{uiLang === 'my' ? 'English စာတန်းထိုး ပြမည်' : 'Show English Subtitle'}</span>
          </label>

          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={subtitleSettings.boxedBackground}
              onChange={(e) => update('boxedBackground', e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 bg-slate-950 border-slate-700"
            />
            <span>{uiLang === 'my' ? 'နောက်ခံ အနက်ရောင် Card ထည့်မည်' : 'Dark Translucent Backdrop Card'}</span>
          </label>
        </div>

        {/* Live Subtitle Style Preview Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
            Live Preview
          </span>
          <div className="inline-block px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
            {subtitleSettings.showBurmese && (
              <p
                className={`font-bold leading-snug drop-shadow-md ${
                  subtitleSettings.color === 'yellow'
                    ? 'text-yellow-300'
                    : subtitleSettings.color === 'cyan'
                    ? 'text-cyan-300'
                    : subtitleSettings.color === 'green'
                    ? 'text-emerald-400'
                    : 'text-white'
                } ${
                  subtitleSettings.fontSize === 'huge'
                    ? 'text-lg sm:text-xl'
                    : subtitleSettings.fontSize === 'large'
                    ? 'text-base sm:text-lg'
                    : subtitleSettings.fontSize === 'medium'
                    ? 'text-sm'
                    : 'text-xs'
                }`}
              >
                ဒါပေမဲ့ သူတို့ မသိသေးတဲ့ အမှန်တရားတစ်ခုကတော့...
              </p>
            )}
            {subtitleSettings.showEnglish && (
              <p className="text-slate-300 text-xs mt-0.5 opacity-90">
                However, a dangerous truth was waiting to be uncovered...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
