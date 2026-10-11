export type LanguageMode = 'my' | 'en' | 'both';

export interface Scene {
  sceneNumber: number;
  startSec: number;
  endSec: number;
  visualPrompt: string;
  narrationBurmese: string;
  narrationEnglish: string;
  emotionalTone: string;
  actionNote?: string;
}

export interface ScriptData {
  title: string;
  burmeseTitle?: string;
  hook: string;
  scenes: Scene[];
  fullNarrationBurmese: string;
  fullNarrationEnglish: string;
  viralHashtags?: string[];
  antiCopyrightAdvice?: string;
}

export interface AntiCopyrightSettings {
  flipHorizontal: boolean; // (5) မူရင်း video ကို ဘယ်ညာပြောင်း
  freezeIntervalSec: number; // 5 စက္ကန့်ခြားစီ
  freezeDurationSec: number; // 0.8s freeze
  muteOriginalAudio: boolean; // (6) မူရင်းအသံ ဖျောက်မည်
  subtitlesEnabled: boolean;
  filmGrainOverlay: boolean;
  colorGradeFilter: 'none' | 'cinematic' | 'warm' | 'noir' | 'matrix';
  microZoom: boolean; // 1.05x zoom to evade border detection
  playbackSpeed: number; // 1.0x, 1.03x, 1.05x (micro speed shift to break audio-visual frame signature)
  customWatermark: string; // Dynamic Channel branding
}

export interface BgmSettings {
  enabled: boolean;
  track: 'none' | 'suspense' | 'action' | 'emotional' | 'horror' | 'cyberpunk';
  volume: number; // 0.0 to 1.0
  autoDucking: boolean; // Dips BGM volume when voiceover speaks
}

export interface SubtitleSettings {
  fontSize: 'small' | 'medium' | 'large' | 'huge';
  color: 'yellow' | 'white' | 'cyan' | 'green' | 'pink';
  position: 'bottom' | 'center' | 'top' | 'custom';
  customYPercent?: number; // 10 to 90%
  fontFamily: 'Padauk' | 'Pyidaungsu' | 'Sans';
  showBurmese: boolean;
  showEnglish: boolean;
  boxedBackground: boolean;
  boxStyle?: 'dark' | 'yellow' | 'blur' | 'none';
}

export interface BlurSettings {
  enabled: boolean;
  position: 'full-background' | 'top-bar' | 'bottom-bar' | 'custom-box';
  blurPx: number; // 4 to 30 px
  boxY: number; // 0 to 100 %
  boxHeight: number; // 10 to 60 %
  boxX: number; // 0 to 100 %
  boxWidth: number; // 20 to 100 %
}

export interface VideoIconSettings {
  enabled: boolean;
  type: 'preset' | 'custom';
  preset: 'recap-hd' | 'pro-4k' | 'vip-channel' | 'star' | 'verified' | 'fire';
  customImageUrl: string | null;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
  customX: number; // 0 to 100 %
  customY: number; // 0 to 100 %
  size: number; // 24 to 120 px
  opacity: number; // 0.2 to 1.0
}

export interface VideoSpeechSegment {
  id: string;
  startSec: number;
  endSec: number;
  originalText: string;
  translationBurmese: string;
  translationEnglish: string;
  audioUrl?: string;
  audioBase64?: string;
  isGenerating?: boolean;
}

export type AspectRatioType = '16:9' | '9:16' | '1:1';

export interface VideoMetadata {
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  url: string;
  isSample?: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
}

export interface EmotionProfile {
  id: string;
  label: string;
  emoji: string;
}

export const VOICES: VoiceProfile[] = [
  { id: 'Charon', name: 'အောင်အောင်', gender: 'Male' },
  { id: 'Fenrir', name: 'ရဲရင့်', gender: 'Male' },
  { id: 'Orus', name: 'မင်းခန့်', gender: 'Male' },
  { id: 'Enceladus', name: 'ဇေယျာ', gender: 'Male' },
  { id: 'Iapetus', name: 'ထက်မြတ်', gender: 'Male' },
  { id: 'Algenib', name: 'မျိုးမင်း', gender: 'Male' },
  { id: 'Rasalgethi', name: 'စည်သူ', gender: 'Male' },
  { id: 'Schedar', name: 'ကောင်းကင်', gender: 'Male' },
  { id: 'Alnilam', name: 'သီဟ', gender: 'Male' },
  { id: 'Sadachbia', name: 'ဝေယံ', gender: 'Male' },
  { id: 'Kore', name: 'စုစု', gender: 'Female' },
  { id: 'Aoede', name: 'သန္တာ', gender: 'Female' },
  { id: 'Leda', name: 'လှိုင်', gender: 'Female' },
  { id: 'Callirrhoe', name: 'အေးအေး', gender: 'Female' },
  { id: 'Autonoe', name: 'မြမြ', gender: 'Female' },
  { id: 'Despina', name: 'နန်းဆု', gender: 'Female' },
  { id: 'Erinome', name: 'ရွှေရည်', gender: 'Female' },
  { id: 'Laomedeia', name: 'သီရိ', gender: 'Female' },
  { id: 'Achernar', name: 'မေမီ', gender: 'Female' },
  { id: 'Gacrux', name: 'နှင်းနှင်း', gender: 'Female' }
];

export const EMOTIONS: EmotionProfile[] = [
  { id: 'Neutral', label: 'ပုံမှန်', emoji: '😐' },
  { id: 'Happy', label: 'ပျော်ရွှင်သော', emoji: '😊' },
  { id: 'Sad', label: 'ဝမ်းနည်းသော', emoji: '😢' },
  { id: 'Angry', label: 'ဒေါသထွက်သော', emoji: '😠' },
  { id: 'Calm', label: 'တည်ငြိမ်သော', emoji: '😌' },
  { id: 'Energetic', label: 'တက်ကြွသော', emoji: '⚡️' },
  { id: 'Whisper', label: 'တိုးတိုးပြော', emoji: '🤫' },
  { id: 'Storytelling', label: 'ပုံပြင်ပြော', emoji: '📖' },
  { id: 'Professional', label: 'လုပ်ငန်းသုံး', emoji: '👔' },
  { id: 'Casual', label: 'ပေါ့ပေါ့ပါးပါး', emoji: '☕️' },
  { id: 'Fearful', label: 'ကြောက်ရွံသော', emoji: '😨' },
  { id: 'Surprised', label: 'အံ့သြသော', emoji: '😲' },
  { id: 'Excited', label: 'စိတ်လှုပ်ရှားသော', emoji: '🤩' },
  { id: 'Romantic', label: 'ချစ်စရာကောင်းသော', emoji: '🥰' },
  { id: 'Sarcastic', label: 'ခနဲ့တဲ့တဲ့', emoji: '😏' },
  { id: 'Serious', label: 'လေးနက်သော', emoji: '🧐' },
  { id: 'Confident', label: 'ယုံကြည်မှုရှိသော', emoji: '😎' },
  { id: 'Shy', label: 'ရှက်တတ်သော', emoji: '😳' },
  { id: 'Hopeful', label: 'မျှော်လင့်ချက်ရှိသော', emoji: '🤞' },
  { id: 'Tired', label: 'ပင်ပန်းနေသော', emoji: '😫' }
];

export interface VoiceoverConfig {
  voice: string;
  emotion: string;
  gender?: 'Male' | 'Female';
  language: 'my' | 'en';
  speed: number;
  pitch: number;
  audioBase64?: string;
  audioUrl?: string;
  isGenerating?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  thoughtProcess?: string;
}

export interface AdminStats {
  metrics: {
    totalRecapsGenerated: number;
    burmeseRecapsCount: number;
    englishRecapsCount: number;
    copyrightFlipsProcessed: number;
    freezeFramesApplied: number;
    totalMinutesRendered: number;
    apiCallsCount: number;
  };
  serverTime: string;
  supportedLanguages: string[];
  antiCopyrightFeatures: Array<{
    name: string;
    active: boolean;
    description: string;
  }>;
}
