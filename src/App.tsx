/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  UploadCloud,
  FileText,
  Mic,
  ShieldCheck,
  Download,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  Sliders,
  Zap,
  Globe,
  Music,
  Smartphone,
  Type,
  Languages,
  Key // Added Key icon for API settings
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { VideoUploader } from './components/VideoUploader';
import { RecapVideoPlayer, RecapVideoPlayerRef } from './components/RecapVideoPlayer';
import { VoiceoverPanel } from './components/VoiceoverPanel';
import { AudioMixerPanel } from './components/AudioMixerPanel';
import { SubtitleCustomizer } from './components/SubtitleCustomizer';
import { AntiCopyrightControl } from './components/AntiCopyrightControl';
import { VideoDubbingTranslator } from './components/VideoDubbingTranslator';
import { ExportModal } from './components/ExportModal';
import { AdminDashboard } from './components/AdminDashboard';
import { GeminiChatbot } from './components/GeminiChatbot';
import {
  VideoMetadata,
  ScriptData,
  VoiceoverConfig,
  AntiCopyrightSettings,
  BgmSettings,
  SubtitleSettings,
  AspectRatioType,
  BlurSettings,
  VideoIconSettings,
  VideoSpeechSegment
} from './types/recap';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'dubbing' | 'bgm' | 'copyright' | 'admin' | 'chat'>('studio');
  const [uiLang, setUiLang] = useState<'my' | 'en'>('my');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // --- API Key Settings State (New) ---
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Load saved API Key on startup
  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_key');
    if (savedKey) {
      setApiKeyInput(savedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('user_gemini_key', apiKeyInput.trim());
    setIsApiKeyModalOpen(false);
    alert(uiLang === 'my' ? 'API Key အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!' : 'API Key saved successfully!');
  };
  // ------------------------------------

  // Workflow current active step (1 to 6)
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(1);

  // Default initial video project
  const [video, setVideo] = useState<VideoMetadata>({
    name: 'Movie Video.mp4',
    size: 15 * 1024 * 1024,
    duration: 30,
    width: 1280,
    height: 720,
    url: '/sample-heist.mp4',
    isSample: false,
  });

  const [script, setScript] = useState<ScriptData | null>(null);

  const [voiceConfig, setVoiceConfig] = useState<VoiceoverConfig>({
    voice: 'Charon',
    emotion: 'Storytelling',
    gender: 'Male',
    language: 'my',
    speed: 1.0,
    pitch: 1.0,
  });

  // Video speech transcription segments
  const [speechSegments, setSpeechSegments] = useState<VideoSpeechSegment[]>([]);

  // Background Blur Placement & Intensity
  const [blurSettings, setBlurSettings] = useState<BlurSettings>({
    enabled: false,
    position: 'full-background',
    blurPx: 16,
    boxY: 74,
    boxHeight: 26,
    boxX: 0,
    boxWidth: 100,
  });

  // Video Icon / Channel Logo / Badge Placement
  const [iconSettings, setIconSettings] = useState<VideoIconSettings>({
    enabled: false,
    type: 'preset',
    preset: 'recap-hd',
    customImageUrl: null,
    position: 'top-right',
    customX: 85,
    customY: 10,
    size: 50,
    opacity: 0.9,
  });

  // Background Music & Auto-Ducking
  const [bgmSettings, setBgmSettings] = useState<BgmSettings>({
    enabled: true,
    track: 'suspense',
    volume: 0.3,
    autoDucking: true,
  });

  // Custom Subtitle typography & styling
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({
    fontSize: 'large',
    color: 'yellow',
    position: 'bottom',
    customYPercent: 82,
    fontFamily: 'Padauk',
    showBurmese: true,
    showEnglish: true,
    boxedBackground: true,
  });

  // Platform Aspect Ratio (16:9 Landscape vs 9:16 Vertical Shorts/TikTok vs 1:1)
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('16:9');

  // Anti-Copyright Protection Settings
  const [antiCopyright, setAntiCopyright] = useState<AntiCopyrightSettings>({
    flipHorizontal: true,
    freezeIntervalSec: 5,
    freezeDurationSec: 0.8,
    muteOriginalAudio: true,
    subtitlesEnabled: true,
    filmGrainOverlay: false,
    colorGradeFilter: 'none',
    microZoom: true,
    playbackSpeed: 1.0,
    customWatermark: 'MovieRecap Studio MM',
  });

  const playerRef = useRef<RecapVideoPlayerRef>(null);

  const handleVideoSelected = (newVideo: VideoMetadata) => {
    setVideo(newVideo);
    setActiveWorkflowStep(2);
  };

  const workflowSteps = [
    {
      num: 1,
      titleMy: '(၁) ဗီဒီယို တင်ရန်',
      titleEn: '1. Upload Video',
      icon: UploadCloud,
      done: !!video,
    },
    {
      num: 2,
      titleMy: '(၂) ဘာသာပြန် & Dubbing',
      titleEn: '2. Dubbing & Translate',
      icon: Languages,
      done: speechSegments.length > 0,
    },
    {
      num: 3,
      titleMy: '(၃) Voiceover & BGM',
      titleEn: '3. Voiceover & BGM',
      icon: Mic,
      done: !!voiceConfig.audioUrl,
    },
    {
      num: 4,
      titleMy: '(၄) စာတန်းထိုး & Format',
      titleEn: '4. Subtitles & Format',
      icon: Smartphone,
      done: true,
    },
    {
      num: 5,
      titleMy: '(၅) Anti-Copyright Armor',
      titleEn: '5. Anti-Copyright',
      icon: ShieldCheck,
      done: antiCopyright.flipHorizontal && antiCopyright.freezeIntervalSec > 0,
    },
    {
      num: 6,
      titleMy: '(၆) MP4/MP3 ဒေါင်းလုဒ်',
      titleEn: '6. Export MP4 & MP3',
      icon: Download,
      done: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-200">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        uiLang={uiLang}
        setUiLang={setUiLang}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Studio View */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            {/* Hero / Workflow Stepper Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-rose-950/30 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {uiLang === 'my'
                        ? 'Auto Work Flow • Anti-Copyright Protected • BGM & Shorts 9:16'
                        : 'Auto Work Flow • Anti-Copyright Protected • BGM & Shorts 9:16'}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                    {uiLang === 'my'
                      ? 'MovieRecap အလိုအလျောက်ဖန်တီးရေး စတူဒီယို'
                      : 'MovieRecap Automated Creation Studio'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    {uiLang === 'my'
                      ? 'ဗီဒီယိုမှ မူရင်းစကားပြော ထုတ်ယူခြင်း၊ မြန်မာ/English ဘာသာပြန်ဆိုခြင်း၊ AI တစ်ထပ်တည်းကျ အသံထပ်သွင်းခြင်း (Dubbing)၊ တေးဂီတ၊ စာတန်းထိုး၊ Blur နှင့် Anti-Copyright မူပိုင်ခွင့် ကာကွယ်မှုဖြင့် Shorts/TikTok (9:16) နှင့် YouTube (16:9) MP4 ဒေါင်းလုဒ် ရယူနိုင်ပါသည်။'
                      : 'Extract speech from video, translate into Burmese/English, synthesize synced neural dubbing, mix cinematic BGM, apply custom blur/logo and anti-copyright protection, then export in 9:16 Shorts or 16:9.'}
                  </p>
                </div>

                {/* Quick Export CTA */}
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-xl shadow-rose-950/60 transform hover:scale-105 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{uiLang === 'my' ? 'MP4 / MP3 ဒေါင်းလုဒ် ရယူရန်' : 'Export & Download'}</span>
                </button>
              </div>

              {/* Step Navigation Pill Bar */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-6 gap-2">
                {workflowSteps.map((step) => {
                  const Icon = step.icon;
                  const isActive = activeWorkflowStep === step.num;
                  return (
                    <button
                      key={step.num}
                      onClick={() => {
                        if (step.num === 6) {
                          setIsExportModalOpen(true);
                        } else {
                          setActiveWorkflowStep(step.num);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                        isActive
                          ? 'border-rose-500 bg-rose-500/15 text-rose-200 shadow-md ring-1 ring-rose-500/40'
                          : step.done
                          ? 'border-slate-800 bg-slate-950/60 text-emerald-400 hover:border-slate-700'
                          : 'border-slate-800/60 bg-slate-950/30 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isActive
                            ? 'bg-rose-600 text-white'
                            : step.done
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                      </div>
                      <div className="truncate">
                        <span className="block text-[11px] font-bold truncate">
                          {uiLang === 'my' ? step.titleMy : step.titleEn}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Studio Workspace: Left Video Player & Right Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Live Canvas Player & Format Controller (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Film className="w-4 h-4 text-rose-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                      {uiLang === 'my' ? 'ဗီဒီယို ပြသမည့် မျက်နှာပြင် (Live Canvas Player)' : 'Live Video Player'}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Quick Aspect Ratio Switcher */}
                    <div className="flex items-center space-x-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-bold">
                      <button
                        onClick={() => setAspectRatio('16:9')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          aspectRatio === '16:9' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        16:9
                      </button>
                      <button
                        onClick={() => setAspectRatio('9:16')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          aspectRatio === '9:16' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        9:16 Shorts
                      </button>
                      <button
                        onClick={() => setAspectRatio('1:1')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          aspectRatio === '1:1' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        1:1
                      </button>
                    </div>
                  </div>
                </div>

                {/* Player Component */}
                <RecapVideoPlayer
                  ref={playerRef}
                  video={video}
                  script={script}
                  antiCopyright={antiCopyright}
                  voiceoverAudioUrl={voiceConfig.audioUrl}
                  bgmSettings={bgmSettings}
                  subtitleSettings={subtitleSettings}
                  blurSettings={blurSettings}
                  iconSettings={iconSettings}
                  speechSegments={speechSegments}
                  aspectRatio={aspectRatio}
                  uiLang={uiLang}
                />

                {/* Quick Link to Video Dubbing & Translation */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-rose-400 font-bold">✨ NEW:</span>
                    <span className="text-slate-200">
                      {uiLang === 'my'
                        ? 'ဗီဒီယိုမှ မူရင်းစကားပြောထုတ်ယူခြင်း၊ ဘာသာပြန်ခြင်းနှင့် တစ်ထပ်တည်းကျ အသံထပ်သွင်းခြင်း'
                        : 'Video Dialogue Transcription, Translation & Synced Dubbing'}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('dubbing')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1 shadow-md transition-all"
                  >
                    <span>{uiLang === 'my' ? 'Dubbing Studio သို့ သွားမည်' : 'Open Dubbing Studio'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Anti-Copyright Quick Status Card */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                  <div className="flex items-center space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      {uiLang === 'my'
                        ? 'မူရင်းဗီဒီယို ဘယ်ညာပြောင်းထားပြီး ၅ စက္ကန့်ခြားစီ Freeze လုပ်ထားသဖြင့် YouTube & TikTok မူပိုင်ခွင့် လုံးဝကင်းလွတ်ပါသည်။'
                        : 'Horizontal flip and 5s freeze frame prevent studio automated matching.'}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveWorkflowStep(5)}
                    className="text-rose-400 hover:text-rose-300 font-semibold underline text-[11px]"
                  >
                    {uiLang === 'my' ? 'ဆက်တင် ပြင်ရန်' : 'Adjust Settings'}
                  </button>
                </div>
              </div>

              {/* Right Column: Step-Based Workflow Controls (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Step 1: Video Uploader */}
                {activeWorkflowStep === 1 && (
                  <div className="space-y-4">
                    <VideoUploader
                      currentVideo={video}
                      onVideoSelected={handleVideoSelected}
                      uiLang={uiLang}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => setActiveWorkflowStep(2)}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-lg shadow-rose-950/50"
                      >
                        <span>{uiLang === 'my' ? 'အဆင့် (၂) သို့ သွားရန်' : 'Proceed to Step 2'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Dialogue Extraction & Translation Dubbing */}
                {activeWorkflowStep === 2 && (
                  <div className="space-y-4">
                    <VideoDubbingTranslator
                      video={video}
                      segments={speechSegments}
                      onSegmentsChange={(segs) => setSpeechSegments(segs)}
                      subtitleSettings={subtitleSettings}
                      onSubtitleSettingsChange={(settings) => setSubtitleSettings(settings)}
                      blurSettings={blurSettings}
                      onBlurSettingsChange={(settings) => setBlurSettings(settings)}
                      iconSettings={iconSettings}
                      onIconSettingsChange={(settings) => setIconSettings(settings)}
                      uiLang={uiLang}
                      onSyncVoiceoverComplete={(url) => {
                        setVoiceConfig((prev) => ({ ...prev, audioUrl: url }));
                      }}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setActiveWorkflowStep(1)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        {uiLang === 'my' ? '← နောက်သို့' : '← Back'}
                      </button>
                      <button
                        onClick={() => setActiveWorkflowStep(3)}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-lg shadow-rose-950/50"
                      >
                        <span>{uiLang === 'my' ? 'အဆင့် (၃) သို့ သွားရန်' : 'Proceed to Step 3'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Voiceover & BGM Music Panel */}
                {activeWorkflowStep === 3 && (
                  <div className="space-y-4">
                    <VoiceoverPanel
                      script={script}
                      speechSegments={speechSegments}
                      voiceConfig={voiceConfig}
                      onVoiceConfigChange={(updated) => setVoiceConfig(updated)}
                      uiLang={uiLang}
                    />

                    <AudioMixerPanel
                      bgmSettings={bgmSettings}
                      onChangeBgm={(updated) => setBgmSettings(updated)}
                      voiceConfig={voiceConfig}
                      uiLang={uiLang}
                    />

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setActiveWorkflowStep(2)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        {uiLang === 'my' ? '← နောက်သို့' : '← Back'}
                      </button>
                      <button
                        onClick={() => setActiveWorkflowStep(4)}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-lg shadow-rose-950/50"
                      >
                        <span>{uiLang === 'my' ? 'အဆင့် (၄) သို့ သွားရန်' : 'Proceed to Step 4'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Subtitles & Video Format */}
                {activeWorkflowStep === 4 && (
                  <div className="space-y-4">
                    <SubtitleCustomizer
                      subtitleSettings={subtitleSettings}
                      onChangeSubtitle={(updated) => setSubtitleSettings(updated)}
                      aspectRatio={aspectRatio}
                      onChangeAspectRatio={(r) => setAspectRatio(r)}
                      uiLang={uiLang}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setActiveWorkflowStep(3)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        {uiLang === 'my' ? '← နောက်သို့' : '← Back'}
                      </button>
                      <button
                        onClick={() => setActiveWorkflowStep(5)}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-lg shadow-rose-950/50"
                      >
                        <span>{uiLang === 'my' ? 'အဆင့် (၅) သို့ သွားရန်' : 'Proceed to Step 5'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 5: Anti-Copyright Controls */}
                {activeWorkflowStep === 5 && (
                  <div className="space-y-4">
                    <AntiCopyrightControl
                      settings={antiCopyright}
                      onChange={(updated) => setAntiCopyright(updated)}
                      uiLang={uiLang}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setActiveWorkflowStep(4)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        {uiLang === 'my' ? '← နောက်သို့' : '← Back'}
                      </button>
                      <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-950/50"
                      >
                        <span>{uiLang === 'my' ? 'MP4 / MP3 ဒေါင်းလုဒ် ရယူရန်' : 'Open Export Window'}</span>
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Video Dubbing, Dialogue Translation & Synced Voiceover Tab */}
        {activeTab === 'dubbing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Real-time Live Player showing Blur, Subtitle Y-position, and Video Icon live */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {uiLang === 'my' ? 'ဗီဒီယို တိုက်ရိုက် ကြည့်ရှုစစ်ဆေးခန်း (Live Preview)' : 'Live Dubbed Preview'}
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs">
                    <span className="text-slate-400">Ratio:</span>
                    <button
                      onClick={() => setAspectRatio('16:9')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        aspectRatio === '16:9' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      16:9
                    </button>
                    <button
                      onClick={() => setAspectRatio('9:16')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        aspectRatio === '9:16' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      9:16 Shorts
                    </button>
                  </div>
                </div>

                <RecapVideoPlayer
                  ref={playerRef}
                  video={video}
                  script={script}
                  antiCopyright={antiCopyright}
                  voiceoverAudioUrl={voiceConfig.audioUrl}
                  bgmSettings={bgmSettings}
                  subtitleSettings={subtitleSettings}
                  blurSettings={blurSettings}
                  iconSettings={iconSettings}
                  speechSegments={speechSegments}
                  aspectRatio={aspectRatio}
                  uiLang={uiLang}
                />

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {uiLang === 'my'
                      ? '✓ ဗီဒီယို မူရင်းအသံကို အလိုအလျောက် ပိတ်ထားပြီး ဘာသာပြန်အသံဖြင့် အစားထိုးထားပါသည်'
                      : '✓ Original video audio muted, dubbed with synced neural voiceover'}
                  </span>
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-950/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{uiLang === 'my' ? 'ဗီဒီယို ဒေါင်းလုဒ် ရယူရန်' : 'Export Dubbed Video'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Full Video Dubbing & Translation Suite */}
              <div className="lg:col-span-6">
                <VideoDubbingTranslator
                  video={video}
                  segments={speechSegments}
                  onSegmentsChange={(segs) => setSpeechSegments(segs)}
                  subtitleSettings={subtitleSettings}
                  onSubtitleSettingsChange={(settings) => setSubtitleSettings(settings)}
                  blurSettings={blurSettings}
                  onBlurSettingsChange={(settings) => setBlurSettings(settings)}
                  iconSettings={iconSettings}
                  onIconSettingsChange={(settings) => setIconSettings(settings)}
                  uiLang={uiLang}
                  onSyncVoiceoverComplete={(url) => {
                    setVoiceConfig((prev) => ({ ...prev, audioUrl: url }));
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dedicated BGM & Subtitles Tab */}
        {activeTab === 'bgm' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AudioMixerPanel
              bgmSettings={bgmSettings}
              onChangeBgm={(updated) => setBgmSettings(updated)}
              voiceConfig={voiceConfig}
              uiLang={uiLang}
            />
            <SubtitleCustomizer
              subtitleSettings={subtitleSettings}
              onChangeSubtitle={(updated) => setSubtitleSettings(updated)}
              aspectRatio={aspectRatio}
              onChangeAspectRatio={(r) => setAspectRatio(r)}
              uiLang={uiLang}
            />
          </div>
        )}

        {/* Dedicated Anti-Copyright Lab Tab */}
        {activeTab === 'copyright' && (
          <div className="space-y-6">
            <AntiCopyrightControl
              settings={antiCopyright}
              onChange={(updated) => setAntiCopyright(updated)}
              uiLang={uiLang}
            />
          </div>
        )}

        {/* Dedicated Admin Dashboard Tab */}
        {activeTab === 'admin' && (
          <AdminDashboard uiLang={uiLang} />
        )}
      </main>

      {/* API Key Modal (New Feature) */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2 mb-4">
              <Key className="w-5 h-5 text-rose-500" />
              <span>{uiLang === 'my' ? 'API Key သတ်မှတ်ရန်' : 'Set Gemini API Key'}</span>
            </h2>
            
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              {uiLang === 'my' 
                ? 'Website တွင် ဘာသာပြန်ခြင်းကို အခမဲ့ အသုံးပြုနိုင်ရန် သင်၏ ကိုယ်ပိုင် Google Gemini API Key ကို ထည့်သွင်းပေးပါ။'
                : 'Enter your personal Google Gemini API Key to use the translation and AI features for free.'}
            </p>

            <input
              type="text"
              placeholder="AIzaSyB-xxxxxxxxxxxxxxx"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 mb-3"
            />

            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-rose-400 hover:text-rose-300 underline block mb-6"
            >
              {uiLang === 'my' ? '>> API Key အခမဲ့ ရယူရန် ဤနေရာကို နှိပ်ပါ <<' : '>> Click here to get a FREE API Key <<'}
            </a>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {uiLang === 'my' ? 'ပိတ်မည်' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg"
              >
                {uiLang === 'my' ? 'သိမ်းဆည်းမည် (Save)' : 'Save Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating API Key Setup Trigger (New) */}
      <button
        onClick={() => setIsApiKeyModalOpen(true)}
        className="fixed bottom-5 left-5 z-40 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-2xl transition-all border border-slate-700"
        title="Settings"
      >
        <Key className="w-4 h-4 text-amber-500" />
        <span>{uiLang === 'my' ? 'API Key ထည့်ရန်' : 'Setup API Key'}</span>
      </button>

      {/* Export / Download Modal (Requirement 7) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        video={video}
        script={script}
        voiceConfig={voiceConfig}
        antiCopyright={antiCopyright}
        aspectRatio={aspectRatio}
        uiLang={uiLang}
        getCanvasElement={() => playerRef.current?.getCanvas() || null}
        getVideoElement={() => playerRef.current?.getVideoElement() || null}
        getVoiceoverAudio={() => playerRef.current?.getVoiceoverAudio() || null}
        getBgmAudio={() => playerRef.current?.getBgmAudio() || null}
      />

      {/* Floating Gemini Chatbot Modal */}
      <GeminiChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        uiLang={uiLang}
      />

      {/* Floating Chat Trigger Button when closed */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:scale-105 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-2xl shadow-rose-950/80 transition-all border border-rose-400/30"
          title="Open AI Director Chat"
        >
          <Sparkles className="w-4 h-4" />
          <span>{uiLang === 'my' ? 'AI ဇာတ်ညွှန်း လက်ထောက်' : 'AI Director'}</span>
        </button>
      )}
    </div>
  );
}
