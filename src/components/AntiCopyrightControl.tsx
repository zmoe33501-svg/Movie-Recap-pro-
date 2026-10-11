import React from 'react';
import {
  ShieldCheck,
  Sliders,
  Zap,
  VolumeX,
  Type,
  Maximize,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  FastForward,
  Stamp
} from 'lucide-react';
import { AntiCopyrightSettings } from '../types/recap';

interface AntiCopyrightControlProps {
  settings: AntiCopyrightSettings;
  onChange: (settings: AntiCopyrightSettings) => void;
  uiLang: 'my' | 'en';
}

export const AntiCopyrightControl: React.FC<AntiCopyrightControlProps> = ({
  settings,
  onChange,
  uiLang,
}) => {
  const updateSetting = <K extends keyof AntiCopyrightSettings>(
    key: K,
    value: AntiCopyrightSettings[K]
  ) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  // Calculate copyright protection score based on active features
  let score = 25; // base score
  if (settings.flipHorizontal) score += 25; // requirement (5)
  if (settings.freezeIntervalSec > 0) score += 25; // requirement (5)
  if (settings.muteOriginalAudio) score += 15; // requirement (6)
  if (settings.subtitlesEnabled) score += 5;
  if (settings.playbackSpeed && settings.playbackSpeed > 1.0) score += 5;
  if (settings.customWatermark) score += 4;
  score = Math.min(99, score);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* Header & Safety Score */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              {uiLang === 'my'
                ? 'Anti-Copyright မူပိုင်ခွင့် ကာကွယ်ရေး အင်ဂျင်'
                : 'Anti-Copyright Protection Engine'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {uiLang === 'my'
              ? 'YouTube, Facebook, TikTok တို့တွင် Copyright Strike မငြိစေရန် အလိုအလျောက် ဗီဒီယို ပုံစံပြောင်းလဲခြင်း'
              : 'Automated video transposition to evade Content ID & automated audio/visual fingerprint strikes'}
          </p>
        </div>

        {/* Protection Score Meter */}
        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              {uiLang === 'my' ? 'လုံခြုံမှု အဆင့်' : 'Safety Score'}
            </div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              {score}% SAFE
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Primary Rules Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requirement (5): Horizontal Flip (Mirroring) */}
        <div
          onClick={() => updateSetting('flipHorizontal', !settings.flipHorizontal)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            settings.flipHorizontal
              ? 'border-emerald-500/50 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/20'
              : 'border-slate-800 bg-slate-950/60 opacity-60'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {uiLang === 'my'
                    ? '(၁) ဗီဒီယို ဘယ်ညာပြောင်းခြင်း (Horizontal Flip)'
                    : '1. Horizontal Flip (Mirroring)'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {uiLang === 'my'
                    ? 'ဗီဒီယိုကို ဘယ်ညာမှန်ပြန်လှန်၍ Spatial pixel matching ကို ရှောင်လွှဲခြင်း'
                    : 'Inverts video along X-axis to break studio frame alignment'}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.flipHorizontal}
              readOnly
              className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
            />
          </div>
        </div>

        {/* Requirement (5): 5-Second Freeze-Frame Interval */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {uiLang === 'my'
                    ? '(၂) ၅ စက္ကန့်ခြား Freeze ရပ်တန့်ခြင်း'
                    : '2. 5-Second Interval Freeze Frame'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {uiLang === 'my'
                    ? '၅ စက္ကန့်ခြားတိုင်း ဗီဒီယို frame ကို ခေတ္တရပ်တန့်၍ Temporal hash ကို ဖြတ်တောက်ခြင်း'
                    : 'Freezes video frame momentarily every 5s while voiceover plays seamlessly'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                {uiLang === 'my' ? 'ရပ်တန့်မည့် စက္ကန့်ခြား' : 'Interval (Seconds)'}
              </span>
              <select
                value={settings.freezeIntervalSec}
                onChange={(e) => updateSetting('freezeIntervalSec', parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value={3}>3 စက္ကန့်ခြား (Strict)</option>
                <option value={5}>5 စက္ကန့်ခြား (Recommended - သတ်မှတ်ချက်)</option>
                <option value={7}>7 စက္ကန့်ခြား (Subtle)</option>
                <option value={0}>မသုံးပါ (Disable)</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                {uiLang === 'my' ? 'ရပ်တန့်မည့်ကြာချိန်' : 'Freeze Duration'}
              </span>
              <select
                value={settings.freezeDurationSec}
                onChange={(e) => updateSetting('freezeDurationSec', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value={0.5}>0.5 စက္ကန့် (Fast)</option>
                <option value={0.8}>0.8 စက္ကန့် (Standard)</option>
                <option value={1.2}>1.2 စက္ကန့် (Maximum Break)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requirement (6): Mute Original Studio Audio */}
        <div
          onClick={() => updateSetting('muteOriginalAudio', !settings.muteOriginalAudio)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            settings.muteOriginalAudio
              ? 'border-emerald-500/50 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/20'
              : 'border-slate-800 bg-slate-950/60 opacity-60'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <VolumeX className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {uiLang === 'my'
                    ? '(၃) မူရင်းအသံ ဖျောက်ခြင်း (Audio Strip & Mute)'
                    : '3. Strip Original Studio Audio'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {uiLang === 'my'
                    ? 'မူရင်းနောက်ခံအသံနှင့် စကားပြောများကို ဖျောက်၍ AI Voiceover ဖြင့် အစားထိုးခြင်း'
                    : 'Completely eliminates studio audio soundtrack to defeat audio fingerprinting'}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.muteOriginalAudio}
              readOnly
              className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
            />
          </div>
        </div>

        {/* Playback Micro-Speed Shift */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <FastForward className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {uiLang === 'my'
                    ? '(၄) အမြန်နှုန်း အနည်းငယ်ပြောင်းခြင်း (Micro-Speed Shift)'
                    : '4. Micro-Speed Pitch Alteration'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {uiLang === 'my'
                    ? 'အမြန်နှုန်းကို +3% သို့မဟုတ် +5% ပြောင်းလဲ၍ Timestamp hash ကို ရှောင်ခြင်း'
                    : 'Slightly offsets video playback speed to prevent exact runtime correlation'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { val: 1.0, label: '1.0x (Normal)' },
              { val: 1.03, label: '+3% (1.03x)' },
              { val: 1.05, label: '+5% (1.05x)' },
            ].map((sp) => (
              <button
                key={sp.val}
                type="button"
                onClick={() => updateSetting('playbackSpeed', sp.val)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  settings.playbackSpeed === sp.val
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Visual Armor: Color Grading & Custom Watermark Branding */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Color Grade */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            {uiLang === 'my' ? 'ရုပ်ရှင် ကာလာ စတိုင်လ် (Color Grade Filter)' : 'Anti-Fingerprint Color Tint'}
          </label>
          <select
            value={settings.colorGradeFilter}
            onChange={(e) => updateSetting('colorGradeFilter', e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="none">Normal (မူလအရောင်)</option>
            <option value="cinematic">Cinematic Blue Tint (ဟောလိဝုဒ် အပြာရောင်)</option>
            <option value="warm">Warm Dramatic (ရွှေဝါရောင် နွေးထွေးသော စတိုင်လ်)</option>
            <option value="matrix">Matrix Cyber Green (စိမ်းဖန့်ဖန့် နည်းပညာ စတိုင်လ်)</option>
          </select>
        </div>

        {/* Custom Watermark Branding */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            {uiLang === 'my' ? 'သင့် Channel Watermark / Logo စာသား' : 'Channel Watermark Branding'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={settings.customWatermark}
              onChange={(e) => updateSetting('customWatermark', e.target.value)}
              placeholder="e.g. MovieRecap MM, CinemaShorts"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
            <Stamp className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Educational Anti-Strike explanation box */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start space-x-3 text-xs text-slate-400 leading-relaxed">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200 block mb-0.5">
            {uiLang === 'my'
              ? 'အဘယ်ကြောင့် ဘယ်ညာပြောင်းပြီး ၅ စက္ကန့်ခြား Freeze လုပ်ရသနည်း?'
              : 'Why Horizontal Flip + 5s Freeze Frames Defeat Copyright Algorithms:'}
          </span>
          {uiLang === 'my' ? (
            <p>
              ရုပ်ရှင်ကုမ္ပဏီများ၏ အလိုအလျောက် Content ID စနစ်များသည် ဗီဒီယိုတစ်ခုချင်းစီ၏ Pixel တည်နေရာနှင့် စက္ကန့်မပြတ် ဆက်တိုက်လှုပ်ရှားမှု (Continuous Motion Hash) ကို နှိုင်းယှဉ်စစ်ဆေးပါသည်။ ဘယ်ညာလှန်လိုက်ခြင်း (Flip) နှင့် ၅ စက္ကန့်ခြားတိုင်း ရပ်တန့် (Freeze) ပေးခြင်းဖြင့် အဆိုပါ Algorithm များကို အောင်မြင်စွာ ကျော်လွှားနိုင်ပြီး မူရင်းအသံအစား AI Voiceover အသံဖြင့် အစားထိုးထားသဖြင့် အသံမူပိုင်ခွင့်လည်း လုံးဝကင်းလွတ်ပါသည်။
            </p>
          ) : (
            <p>
              Automated video recognition algorithms rely on temporal keyframe motion vectors and audio spectral hashes. Mirroring inverts 2D spatial coordinates, while 5-second periodic freeze frames disrupt the continuous frame sequence hash. Muting original studio audio removes acoustic signatures entirely.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
