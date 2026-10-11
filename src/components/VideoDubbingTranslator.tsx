import React, { useState } from 'react';
import {
  FileVideo,
  Languages,
  Mic,
  RotateCcw,
  Volume2,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Sliders,
  Layers,
  Type,
  Edit3
} from 'lucide-react';
import {
  VideoMetadata,
  VideoSpeechSegment,
  SubtitleSettings,
  BlurSettings,
  VideoIconSettings,
  VOICES,
  EMOTIONS,
} from '../types/recap';

// --- (NEW) Audio Extraction Helpers ---
// ဗီဒီယိုထဲက အသံကို ဆွဲထုတ်ပြီး AI နားလည်တဲ့ ဖော်မတ်ပြောင်းပေးမည့် စနစ်
async function extractAudioBase64(videoUrl: string): Promise<string | null> {
  try {
    const res = await fetch(videoUrl);
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({ sampleRate: 16000 }); // Low sample rate for faster processing
    
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0); // Downmix to Mono
    
    const wavBuffer = encodeWAV(channelData, 16000);
    return arrayBufferToBase64(wavBuffer);
  } catch (e) {
    console.error("Audio extraction failed:", e);
    return null;
  }
}

function encodeWAV(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); 
  view.setUint16(22, 1, true); 
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
// --------------------------------------

interface VideoDubbingTranslatorProps {
  video: VideoMetadata;
  segments: VideoSpeechSegment[];
  onSegmentsChange: (segments: VideoSpeechSegment[]) => void;
  subtitleSettings: SubtitleSettings;
  onSubtitleSettingsChange: (settings: SubtitleSettings) => void;
  blurSettings: BlurSettings;
  onBlurSettingsChange: (settings: BlurSettings) => void;
  iconSettings: VideoIconSettings;
  onIconSettingsChange: (settings: VideoIconSettings) => void;
  uiLang: 'my' | 'en';
  onSyncVoiceoverComplete: (audioUrl: string) => void;
}

export const VideoDubbingTranslator: React.FC<VideoDubbingTranslatorProps> = ({
  video,
  segments,
  onSegmentsChange,
  subtitleSettings,
  onSubtitleSettingsChange,
  blurSettings,
  onBlurSettingsChange,
  iconSettings,
  onIconSettingsChange,
  uiLang,
  onSyncVoiceoverComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'transcribe' | 'voiceover' | 'visuals'>('transcribe');
  const [targetLang, setTargetLang] = useState<'my' | 'en'>('my');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSyncingVoices, setIsSyncingVoices] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('Charon');
  const [selectedEmotionId, setSelectedEmotionId] = useState<string>('Storytelling');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);

  const currentVoice = VOICES.find((v) => v.id === selectedVoiceId) || VOICES[0];
  const currentEmotion = EMOTIONS.find((e) => e.id === selectedEmotionId) || EMOTIONS[7];

  const getApiKey = () => {
    return localStorage.getItem('user_gemini_key') || '';
  };

  // 1. Transcribe Original Dialogue from Video & Translate
  const handleAutoTranscribeVideo = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      alert(uiLang === 'my' ? 'ကျေးဇူးပြု၍ ဘယ်ဘက်အောက်ထောင့်ရှိ "API Key ထည့်ရန်" ကိုနှိပ်ပြီး API Key အရင်ထည့်ပါ။' : 'Please click "Setup API Key" at the bottom left first.');
      return;
    }

    if (!video.url) {
      alert(uiLang === 'my' ? 'ဗီဒီယို ဖိုင်ရှာမတွေ့ပါ။ ဗီဒီယိုအရင်တင်ပါ။' : 'Video file not found.');
      return;
    }

    setIsTranscribing(true);
    setNoticeMessage(uiLang === 'my' ? 'ဗီဒီယိုထဲမှ အသံကို ခွဲထုတ်နေပါသည် (စက္ကန့်အနည်းငယ် ကြာနိုင်သည်)...' : 'Extracting audio from video...');

    try {
      // (NEW) Extract audio before calling API
      const extractedAudioBase64 = await extractAudioBase64(video.url);
      
      if (!extractedAudioBase64) {
         alert(uiLang === 'my' ? 'ဗီဒီယိုထဲမှ အသံကို ခွဲထုတ်၍ မရပါ။' : 'Failed to extract audio.');
         setIsTranscribing(false);
         return;
      }

      setNoticeMessage(uiLang === 'my' ? 'AI ဆီသို့ပို့ဆောင်၍ ဘာသာပြန်နေပါသည်...' : 'Sending to AI for translation...');

      const response = await fetch('/api/video/transcribe-and-translate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey
        },
        body: JSON.stringify({
          audioBase64: extractedAudioBase64, // ပျောက်နေတဲ့ အသံဖိုင်ကို ပို့ပေးလိုက်ပါပြီ
          videoTitle: video.name,
          duration: video.duration || 30,
          targetLang,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.segments) && data.segments.length > 0) {
        onSegmentsChange(data.segments);
        setNoticeMessage(
          uiLang === 'my'
            ? `✓ မူရင်းစကားပြောစာသား (${data.segments.length} ကြောင်း) ကို အောင်မြင်စွာ ထုတ်ယူပြီး ဘာသာပြန်ဆိုပြီးပါပြီ!`
            : `✓ Successfully extracted & translated ${data.segments.length} speech segments!`
        );
      } else {
         alert(uiLang === 'my' ? 'ဘာသာပြန်ရာတွင် အခက်အခဲရှိနေပါသည်။ API Key ပြန်စစ်ပါ။' : 'Translation failed. Check API Key.');
         setNoticeMessage(null);
      }
    } catch (err: any) {
      console.error(err);
      alert(uiLang === 'my' ? 'ချိတ်ဆက်မှု ပြဿနာရှိနေပါသည်။' : 'Connection Error.');
      setNoticeMessage(null);
    } finally {
      setIsTranscribing(false);
    }
  };

  // 2. Synchronize Neural Human Voiceover for each Segment
  const handleSyncNeuralVoiceover = async () => {
    if (segments.length === 0) {
      setNoticeMessage(
        uiLang === 'my'
          ? 'ကျေးဇူးပြု၍ ပထမဦးစွာ ဗီဒီယိုမှ စကားပြောစာသားကို ထုတ်ယူပါ'
          : 'Please extract dialogue segments first'
      );
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      alert(uiLang === 'my' ? 'ကျေးဇူးပြု၍ ဘယ်ဘက်အောက်ထောင့်ရှိ "API Key ထည့်ရန်" ကိုနှိပ်ပြီး API Key အရင်ထည့်ပါ။' : 'Please click "Setup API Key" at the bottom left first.');
      return;
    }

    setIsSyncingVoices(true);
    setNoticeMessage(null);

    try {
      const response = await fetch('/api/video/sync-voiceover-segments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey 
        },
        body: JSON.stringify({
          segments,
          voice: selectedVoiceId,
          emotion: selectedEmotionId,
          gender: currentVoice.gender,
          language: targetLang,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.segments)) {
        onSegmentsChange(data.segments);

        const firstAudio = data.segments.find((s: any) => s.audioUrl)?.audioUrl;
        if (firstAudio) {
          onSyncVoiceoverComplete(firstAudio);
        }

        setNoticeMessage(
          uiLang === 'my'
            ? `✓ "${currentVoice.name}" ၏ လူသံစစ်စစ်ဖြင့် ဗီဒီယို စကားပြောချိန်နှင့် တစ်ထပ်တည်းကျ အသံသွင်းပြီးပါပြီ!`
            : `✓ Synchronized voiceover with video timing using ${currentVoice.name}'s natural human voice!`
        );
      } else {
         alert(uiLang === 'my' ? 'အသံသွင်းရာတွင် အခက်အခဲရှိနေပါသည်။ API Key ကို ပြန်စစ်ပါ။' : 'Failed to generate voice. Please check API Key.');
      }
    } catch (err: any) {
      console.error(err);
      alert(uiLang === 'my' ? 'ချိတ်ဆက်မှု ပြဿနာရှိနေပါသည်။' : 'Connection Error.');
    } finally {
      setIsSyncingVoices(false);
    }
  };

  const handlePlaySegmentPreview = (seg: VideoSpeechSegment) => {
    if (!seg.audioUrl) return;
    const a = new Audio(seg.audioUrl);
    setPlayingSegmentId(seg.id);
    a.onended = () => setPlayingSegmentId(null);
    a.play().catch(() => setPlayingSegmentId(null));
  };

  const handleUpdateSegmentTranslation = (id: string, newText: string) => {
    const updated = segments.map((s) => {
      if (s.id === id) {
        return targetLang === 'my'
          ? { ...s, translationBurmese: newText }
          : { ...s, translationEnglish: newText };
      }
      return s;
    });
    onSegmentsChange(updated);
  };

  const handleIconFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onIconSettingsChange({
        ...iconSettings,
        enabled: true,
        type: 'custom',
        customImageUrl: url,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Languages className="w-5 h-5 text-rose-500" />
            <span>
              {uiLang === 'my'
                ? 'ဗီဒီယို မူရင်းစာသား ထုတ်ယူခြင်း၊ ဘာသာပြန်ခြင်းနှင့် တစ်ထပ်တည်းကျ အသံထပ်သွင်းခြင်း'
                : 'Video Dialogue Transcription, Translation & Synced Dubbing'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {uiLang === 'my'
              ? 'ဗီဒီယိုမှ စကားပြောကို မူရင်းအတိုင်း ထုတ်ယူပြီး မြန်မာ/English ဘာသာပြန်ဆိုကာ အသံနှင့် ဗီဒီယို တစ်ထပ်တည်းကျ အသံသွင်းနိုင်သည်'
              : 'Extract spoken dialogue from video, translate to target language, and dub with synchronized timing'}
          </p>
        </div>

        <div className="flex items-center space-x-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('transcribe')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'transcribe'
                ? 'bg-rose-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{uiLang === 'my' ? '၁။ စာသားထုတ်ယူ/ဘာသာပြန်' : '1. Transcript & Translation'}</span>
          </button>
          <button
            onClick={() => setActiveTab('voiceover')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'voiceover'
                ? 'bg-rose-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{uiLang === 'my' ? '၂။ တစ်ထပ်တည်းကျ အသံသွင်း' : '2. Synced Voiceover'}</span>
          </button>
          <button
            onClick={() => setActiveTab('visuals')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'visuals'
                ? 'bg-rose-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{uiLang === 'my' ? '၃။ စာတန်းထိုး / နောက်ခံဝါး / Logo' : '3. Subtitles / Blur / Icon'}</span>
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* TAB 1: TRANSCRIPTION & TRANSLATION */}
      {activeTab === 'transcribe' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-slate-300">
                {uiLang === 'my' ? 'ရွေးချယ်ထားသော ဘာသာပြန်စကား:' : 'Target Language:'}
              </span>
              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setTargetLang('my')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    targetLang === 'my' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  မြန်မာဘာသာ (Burmese)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetLang('en')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    targetLang === 'en' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <button
              onClick={handleAutoTranscribeVideo}
              disabled={isTranscribing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs flex items-center space-x-2 shadow-lg transition-all disabled:opacity-50"
            >
              {isTranscribing ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>{uiLang === 'my' ? 'အသံထုတ်ယူ ဘာသာပြန်နေသည်...' : 'Extracting & Translating...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {uiLang === 'my'
                      ? 'ဗီဒီယိုမှ မူရင်းစကားပြော ထုတ်ယူပြီး ဘာသာပြန်မည်'
                      : 'Auto-Transcribe & Translate Video'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Segment List */}
          {segments.length > 0 ? (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {segments.map((seg, idx) => (
                <div
                  key={seg.id}
                  className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-400 flex items-center space-x-1.5">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>
                        {seg.startSec.toFixed(1)}s - {seg.endSec.toFixed(1)}s
                      </span>
                    </span>

                    {seg.audioUrl && (
                      <button
                        type="button"
                        onClick={() => handlePlaySegmentPreview(seg)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center space-x-1"
                      >
                        <Volume2 className="w-3 h-3 text-rose-400" />
                        <span>{playingSegmentId === seg.id ? 'Playing...' : 'Play Audio'}</span>
                      </button>
                    )}
                  </div>

                  {/* Original Spoken Text */}
                  <div className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      {uiLang === 'my' ? 'မူရင်း ဗီဒီယို စကားပြောစာသား (Original):' : 'Original Spoken Line:'}
                    </span>
                    <span className="font-mono text-slate-300">{seg.originalText}</span>
                  </div>

                  {/* Target Translation Editable Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-400 uppercase flex items-center space-x-1">
                      <Edit3 className="w-3 h-3" />
                      <span>
                        {uiLang === 'my'
                          ? `ဘာသာပြန်ထားသော စာသား (${targetLang === 'my' ? 'မြန်မာ' : 'English'} - ပြင်ဆင်နိုင်သည်):`
                          : `Translated Line (${targetLang === 'my' ? 'Burmese' : 'English'} - Editable):`}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={targetLang === 'my' ? seg.translationBurmese : seg.translationEnglish}
                      onChange={(e) => handleUpdateSegmentTranslation(seg.id, e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/30 focus:border-amber-400 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-sans focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400 space-y-2">
              <FileVideo className="w-8 h-8 text-slate-600 mx-auto" />
              <p>
                {uiLang === 'my'
                  ? 'ဗီဒီယိုမှ မူရင်းစကားပြော ထုတ်ယူထားခြင်း မရှိသေးပါ။ အပေါ်ရှိ "ဗီဒီယိုမှ မူရင်းစကားပြော ထုတ်ယူပြီး ဘာသာပြန်မည်" ခလုတ်ကို နှိပ်ပါ'
                  : 'No dialogue transcribed yet. Click "Auto-Transcribe & Translate Video" above to extract speech from your video.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SYNCHRONIZED NEURAL VOICEOVER */}
      {activeTab === 'voiceover' && (
        <div className="space-y-5">
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Mic className="w-4 h-4 text-rose-500" />
                <span>
                  {uiLang === 'my'
                    ? 'ဗီဒီယိုပြောစကားနှင့် တစ်ထပ်တည်းကျ အသံသွင်းရန် ရွေးချယ်မှု'
                    : 'Synced Voice Character & Emotion Selection'}
                </span>
              </span>

              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                {currentVoice.name} ({currentVoice.gender === 'Female' ? 'အမျိုးသမီး' : 'အမျိုးသား'}) • {currentEmotion.emoji} {currentEmotion.label}
              </span>
            </div>

            {/* Quick Voices select */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
              {VOICES.map((v) => {
                const isSelected = selectedVoiceId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVoiceId(v.id)}
                    className={`p-2 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/20 font-bold text-rose-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="truncate">{v.name}</span>
                      <span className="text-[9px] opacity-75">{v.gender === 'Female' ? 'မ' : 'ကျား'}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Emotions */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-1 pt-2 border-t border-slate-800/80">
              {EMOTIONS.slice(0, 10).map((emo) => {
                const isSelected = selectedEmotionId === emo.id;
                return (
                  <button
                    key={emo.id}
                    type="button"
                    onClick={() => setSelectedEmotionId(emo.id)}
                    className={`p-1.5 rounded-lg border text-left text-[11px] truncate transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/20 font-bold text-amber-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {emo.emoji} {emo.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSyncNeuralVoiceover}
            disabled={isSyncingVoices || segments.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xl shadow-rose-950/50 transition-all disabled:opacity-50"
          >
            {isSyncingVoices ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>
                  {uiLang === 'my'
                    ? 'ဗီဒီယို စကားပြောချိန်များနှင့် တစ်ထပ်တည်းကျ အသံသွင်းနေသည်...'
                    : 'Synthesizing Synchronized Dialogue Voiceovers...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {uiLang === 'my'
                    ? `"${currentVoice.name}" အသံဖြင့် ဗီဒီယိုစကားပြောနှင့် တစ်ထပ်တည်းကျ အသံထပ်သွင်းမည်`
                    : `Dub Video with Synced Voiceover (${currentVoice.name})`}
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* TAB 3: CUSTOM SUBTITLES, BACKGROUND BLUR & VIDEO ICON */}
      {activeTab === 'visuals' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>
                  {uiLang === 'my'
                    ? 'နောက်ခံ ဝါးထားသည့် နေရာ စိတ်ကြိုက်ရွေးချယ်မှု (Background Blur Placement)'
                    : 'Background Blur Position & Intensity'}
                </span>
              </label>
              <input
                type="checkbox"
                checked={blurSettings.enabled}
                onChange={(e) => onBlurSettingsChange({ ...blurSettings, enabled: e.target.checked })}
                className="w-4 h-4 text-rose-600 rounded bg-slate-900 border-slate-700"
              />
            </div>

            {blurSettings.enabled && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'full-background', label: 'နောက်ခံအပြည့် ဝါးမည် (9:16 Shorts)' },
                    { id: 'top-bar', label: 'အပေါ်ပိုင်း ဝါးမည် (Top Bar)' },
                    { id: 'bottom-bar', label: 'အောက်ပိုင်း ဝါးမည် (မူရင်းစာဖျောက်ရန်)' },
                    { id: 'custom-box', label: 'စိတ်ကြိုက်နေရာ (Custom Box)' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        onBlurSettingsChange({ ...blurSettings, position: mode.id as any })
                      }
                      className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                        blurSettings.position === mode.id
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <Type className="w-4 h-4 text-rose-400" />
              <span>
                {uiLang === 'my'
                  ? 'စာတန်းထိုး အရောင်၊ အရွယ်အစားနှင့် ထားရှိမည့် နေရာ'
                  : 'Subtitle Customization'}
              </span>
            </label>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">{uiLang === 'my' ? 'စာတန်းထိုး အရောင်:' : 'Color'}:</span>
                {[
                  { id: 'yellow', hex: '#fde047', label: 'အဝါ' },
                  { id: 'white', hex: '#ffffff', label: 'အဖြူ' },
                  { id: 'cyan', hex: '#38bdf8', label: 'အပြာနု' },
                  { id: 'green', hex: '#4ade80', label: 'အစိမ်း' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      onSubtitleSettingsChange({ ...subtitleSettings, color: c.id as any })
                    }
                    className={`px-2.5 py-1 rounded-lg border font-bold flex items-center space-x-1.5 transition-all ${
                      subtitleSettings.color === c.id
                        ? 'border-rose-500 bg-rose-500/20 text-white ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
