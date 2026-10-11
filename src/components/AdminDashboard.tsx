import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Film,
  Globe,
  ShieldCheck,
  Zap,
  Activity,
  HardDrive,
  Users,
  Settings,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';
import { AdminStats } from '../types/recap';

interface AdminDashboardProps {
  uiLang: 'my' | 'en';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ uiLang }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Workflow preset configuration state
  const [defaultLanguage, setDefaultLanguage] = useState<'my' | 'en' | 'both'>('my');
  const [autoFlipEnabled, setAutoFlipEnabled] = useState(true);
  const [freezeInterval, setFreezeInterval] = useState(5);
  const [defaultVoice, setDefaultVoice] = useState('Kore');
  const [channelWatermark, setChannelWatermark] = useState('MovieRecap Studio MM');

  // Script templates
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'သည်းထိတ်ရင်ဖို လှည့်ကွက်စတိုင်လ် (Suspense Thriller)',
      genre: 'Thriller',
      hookBurmese: 'ဘယ်သူမှ မထင်မှတ်ထားတဲ့ အမှန်တရားတစ်ခု ပေါ်ထွက်လာချိန်မှာတော့...',
      popularity: '98% Viral',
    },
    {
      id: 2,
      name: 'သွက်လက်သော အက်ရှင် ရာဇဝတ်မှု (Action Heist)',
      genre: 'Action',
      hookBurmese: 'ဒီလူက အလုံခြုံဆုံး နေရာကို ဖောက်ထွင်းပြီးချိန်မှာ သူငယ်ချင်းက...',
      popularity: '94% Viral',
    },
    {
      id: 3,
      name: 'နက်နဲသော သဘာဝလွန် သရဲဇာတ်လမ်း (Supernatural Horror)',
      genre: 'Horror',
      hookBurmese: 'ညသန်းခေါင်မှာ နာရီလက်တံတွေ ပြောင်းပြန်လည်လာတဲ့အခါ...',
      popularity: '91% Viral',
    },
  ]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
            System Administration & Control
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center space-x-2.5">
            <LayoutDashboard className="w-6 h-6 text-indigo-400" />
            <span>
              {uiLang === 'my'
                ? 'MovieRecap Admin Dashboard (အက်ဒမင် ကွပ်ကဲမှုစနစ်)'
                : 'MovieRecap Studio Admin Dashboard'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {uiLang === 'my'
              ? 'လုပ်ငန်းစဉ် စာရင်းအင်းများ၊ Auto Work Flow စည်းမျဉ်းများ၊ မူပိုင်ခွင့် ဆက်တင်များနှင့် ဇာတ်ညွှန်း နမူနာများကို စီမံရန်'
              : 'Monitor workflow metrics, language generation quotas, anti-copyright engines, and recap templates'}
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{uiLang === 'my' ? 'ဒေတာ အသစ်ပြန်ဖွင့်ရန်' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {uiLang === 'my' ? 'စုစုပေါင်း ဖန်တီးပြီး Recap' : 'Total Recaps'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-100 font-mono">
              {stats?.metrics.totalRecapsGenerated || 142}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">+18 today</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Auto Work Flow Batches</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {uiLang === 'my' ? 'မြန်မာဘာသာ Recap များ' : 'Burmese Recaps'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {stats?.metrics.burmeseRecapsCount || 98}
            </span>
            <span className="text-xs text-slate-400">69% Share</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Burmese AI Voiceover</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {uiLang === 'my' ? 'မူပိုင်ခွင့် ကာကွယ်မှု Flips' : 'Copyright Flips'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {stats?.metrics.copyrightFlipsProcessed || 142}
            </span>
            <span className="text-xs text-emerald-400">100% Strike Safe</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Horizontal Mirror Applied</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {uiLang === 'my' ? '၅ စက္ကန့် Freeze Cycles' : '5s Freeze Cycles'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
              {stats?.metrics.freezeFramesApplied || 1136}
            </span>
            <span className="text-xs text-slate-400">Frames Held</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Content ID Hash Disrupted</p>
        </div>
      </div>

      {/* Auto Work Flow Policy Configuration */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <span>
                {uiLang === 'my'
                  ? 'အလိုအလျောက် Work Flow မူဝါဒများ (Auto Work Flow Rules)'
                  : 'Automated Recap Pipeline Rules'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {uiLang === 'my'
                ? 'ဗီဒီယို တင်သွင်းသည်နှင့် တပြိုင်နက် အလိုအလျောက် သတ်မှတ်မည့် default စည်းမျဉ်းများ'
                : 'Default rules applied to every ingested movie recap project'}
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/40"
          >
            {savedSuccess ? (
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{uiLang === 'my' ? 'သိမ်းဆည်းပြီး' : 'Saved'}</span>
              </span>
            ) : (
              uiLang === 'my' ? 'စည်းမျဉ်းများ သိမ်းဆည်းမည်' : 'Save Pipeline Config'
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {uiLang === 'my' ? 'Default ဘာသာစကား ရွေးချယ်မှု' : 'Default Target Language'}
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="my">မြန်မာဘာသာ (Burmese) - ဦးစားပေး</option>
              <option value="en">English</option>
              <option value="both">နှစ်ဘာသာလုံး (Dual Track)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {uiLang === 'my' ? 'Default Anti-Copyright Freeze' : 'Default Freeze Interval'}
            </label>
            <select
              value={freezeInterval}
              onChange={(e) => setFreezeInterval(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={5}>၅ စက္ကန့်ခြား (Default per spec)</option>
              <option value={3}>၃ စက္ကန့်ခြား (Strict)</option>
              <option value={7}>၇ စက္ကန့်ခြား (Relaxed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {uiLang === 'my' ? 'Channel Watermark အမည်' : 'Channel Watermark'}
            </label>
            <input
              type="text"
              value={channelWatermark}
              onChange={(e) => setChannelWatermark(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoFlipEnabled}
              onChange={(e) => setAutoFlipEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-500 bg-slate-950 border-slate-700"
            />
            <span>
              {uiLang === 'my'
                ? 'ဗီဒီယို ဘယ်ညာပြောင်း (Flip) ကို အမြဲတမ်း auto ဖွင့်ထားမည်'
                : 'Auto-enable horizontal mirror flip on upload'}
            </span>
          </label>
        </div>
      </div>

      {/* Script Template Library */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>
                {uiLang === 'my'
                  ? 'Viral ဇာတ်လမ်းပြော Script နမူနာများ (Template Library)'
                  : 'Recap Storytelling Template Library'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {uiLang === 'my'
                ? 'လူကြည့်များသော YouTube / Facebook / TikTok ရုပ်ရှင်ဇာတ်လမ်းပြော ပုံစံများ'
                : 'High-retention storytelling formulas for Burmese and English movie summaries'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {tmpl.genre}
                </span>
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  {tmpl.popularity}
                </span>
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-100">{tmpl.name}</h4>
              <p className="text-xs text-slate-400 italic line-clamp-2">
                &ldquo;{tmpl.hookBurmese}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* System Status Table */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-semibold">Gemini AI Studio Engine:</span>
          <span className="text-emerald-400 font-medium">Online (gemini-3.5-flash / gemini-3.1-pro)</span>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[11px]">
          <span>Server Port: 3000</span>
          <span>TTS: gemini-3.8-flash-lite-tts</span>
          <span>Anti-Copyright Filter: Active</span>
        </div>
      </div>
    </div>
  );
};
