import React from 'react';
import { Film, ShieldCheck, LayoutDashboard, MessageSquareText, Sparkles, Globe, Video, Music, Type, Languages } from 'lucide-react';

interface NavbarProps {
  activeTab: 'studio' | 'dubbing' | 'bgm' | 'copyright' | 'admin' | 'chat';
  setActiveTab: (tab: 'studio' | 'dubbing' | 'bgm' | 'copyright' | 'admin' | 'chat') => void;
  uiLang: 'my' | 'en';
  setUiLang: (lang: 'my' | 'en') => void;
  onOpenChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  uiLang,
  setUiLang,
  onOpenChat,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-400 p-0.5 shadow-lg shadow-rose-900/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Film className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-rose-200 bg-clip-text text-transparent">
                MovieRecap AI
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Pro Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {uiLang === 'my' ? 'ရုပ်ရှင် Recap အလိုအလျောက်ဖန်တီးစနစ်' : 'Automated Anti-Copyright Video Recap Platform'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{uiLang === 'my' ? 'Recap ဖန်တီးခန်း' : 'Studio'}</span>
          </button>

          <button
            onClick={() => setActiveTab('dubbing')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'dubbing'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm ring-1 ring-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Languages className="w-4 h-4 text-rose-400" />
            <span className="hidden md:inline">{uiLang === 'my' ? 'ဗီဒီယို ဘာသာပြန် & Dubbing' : 'Video Dubbing & Translate'}</span>
            <span className="md:hidden">Dubbing</span>
          </button>

          <button
            onClick={() => setActiveTab('bgm')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'bgm'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Music className="w-4 h-4" />
            <span className="hidden md:inline">{uiLang === 'my' ? 'တေးဂီတ & စာတန်းထိုး' : 'BGM & Subtitles'}</span>
            <span className="md:hidden">BGM</span>
          </button>

          <button
            onClick={() => setActiveTab('copyright')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'copyright'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline">{uiLang === 'my' ? 'မူပိုင်ခွင့် ကာကွယ်မှု' : 'Anti-Copyright'}</span>
            <span className="md:hidden">Armor</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'admin'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{uiLang === 'my' ? 'အက်ဒမင်' : 'Admin'}</span>
          </button>
        </nav>

        {/* Actions & Language Switch */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Chat AI Director */}
          <button
            onClick={onOpenChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs sm:text-sm font-medium transition-colors shadow-sm"
            title="Chat with MovieRecap AI Director"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{uiLang === 'my' ? 'AI ဒါရိုက်တာ' : 'AI Director'}</span>
            <MessageSquareText className="w-3.5 h-3.5 md:hidden text-amber-400" />
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setUiLang(uiLang === 'my' ? 'en' : 'my')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors"
            title="Toggle Language / ဘာသာစကားပြောင်းရန်"
          >
            <Globe className="w-3.5 h-3.5 text-rose-400" />
            <span>{uiLang === 'my' ? 'မြန်မာ' : 'English'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
