import React, { useState } from 'react';
import {
  FileVideo, Languages, Mic, RotateCcw, Volume2, Image as ImageIcon,
  CheckCircle2, Sparkles, Sliders, Layers, Type, Edit3, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move
} from 'lucide-react';
import {
  VideoMetadata, VideoSpeechSegment, SubtitleSettings, BlurSettings, VideoIconSettings, VOICES, EMOTIONS,
} from '../types/recap';

// Helpers (Audio Extraction)
async function extractAudioBase64(videoUrl: string): Promise<string | null> {
  try {
    const res = await fetch(videoUrl); const blob = await res.blob(); const arrayBuffer = await blob.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({ sampleRate: 16000 });
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const wavBuffer = encodeWAV(channelData, 16000);
    return arrayBufferToBase64(wavBuffer);
  } catch (e) { return null; }
}
function encodeWAV(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2); const view = new DataView(buffer);
  const writeString = (view: DataView, offset: number, string: string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
  writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, 'data'); view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i])); view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ''; const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

// Reusable Directional Pad (D-pad) Component
const DPadControl = ({ onMove, label, verticalOnly = false }: { onMove: (dx: number, dy: number) => void, label: string, verticalOnly?: boolean }) => (
  <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-xl p-2 w-max shadow-inner">
    <span className="text-[10px] text-slate-400 mb-2 uppercase font-bold">{label}</span>
    <div className="grid grid-cols-3 gap-1">
      <div />
      <button onClick={() => onMove(0, -2)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-rose-400"><ArrowUp size={16}/></button>
      <div />
      {!verticalOnly ? <button onClick={() => onMove(-2, 0)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-rose-400"><ArrowLeft size={16}/></button> : <div />}
      <div className="bg-slate-950 p-2 rounded-lg flex items-center justify-center"><Move size={14} className="text-slate-600"/></div>
      {!verticalOnly ? <button onClick={() => onMove(2, 0)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-rose-400"><ArrowRight size={16}/></button> : <div />}
      <div />
      <button onClick={() => onMove(0, 2)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-rose-400"><ArrowDown size={16}/></button>
      <div />
    </div>
  </div>
);

interface VideoDubbingTranslatorProps {
  video: VideoMetadata; segments: VideoSpeechSegment[]; onSegmentsChange: (segments: VideoSpeechSegment[]) => void;
  subtitleSettings: SubtitleSettings; onSubtitleSettingsChange: (settings: SubtitleSettings) => void;
  blurSettings: BlurSettings; onBlurSettingsChange: (settings: BlurSettings) => void;
  iconSettings: VideoIconSettings; onIconSettingsChange: (settings: VideoIconSettings) => void;
  uiLang: 'my' | 'en'; onSyncVoiceoverComplete: (audioUrl: string) => void;
}

export const VideoDubbingTranslator: React.FC<VideoDubbingTranslatorProps> = ({
  video, segments, onSegmentsChange, subtitleSettings, onSubtitleSettingsChange, blurSettings, onBlurSettingsChange,
  iconSettings, onIconSettingsChange, uiLang, onSyncVoiceoverComplete,
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
  const getApiKey = () => localStorage.getItem('user_gemini_key') || '';

  const handleAutoTranscribeVideo = async () => {
    const apiKey = getApiKey();
    if (!apiKey) return alert('ကျေးဇူးပြု၍ "API Key ထည့်ရန်" ကိုနှိပ်ပြီး API Key အရင်ထည့်ပါ။');
    if (!video.url) return alert('ဗီဒီယို ဖိုင်ရှာမတွေ့ပါ။ ဗီဒီယိုအရင်တင်ပါ။');
    setIsTranscribing(true); setNoticeMessage('ဗီဒီယိုထဲမှ အသံကို ခွဲထုတ်နေပါသည်...');
    try {
      const extractedAudioBase64 = await extractAudioBase64(video.url);
      if (!extractedAudioBase64) throw new Error('Audio extraction failed');
      setNoticeMessage('AI ဆီသို့ပို့ဆောင်၍ ဘာသာပြန်နေပါသည်...');
      const response = await fetch('/api/video/transcribe-and-translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': apiKey },
        body: JSON.stringify({ audioBase64: extractedAudioBase64, videoTitle: video.name, duration: video.duration || 30, targetLang }),
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.segments)) {
        onSegmentsChange(data.segments); setNoticeMessage(`✓ စကားပြောစာသား (${data.segments.length} ကြောင်း) ကို ဘာသာပြန်ဆိုပြီးပါပြီ!`);
      } else { alert('ဘာသာပြန်ရာတွင် အခက်အခဲရှိနေပါသည်။ API Key ပြန်စစ်ပါ။'); setNoticeMessage(null); }
    } catch (err: any) { alert('ချိတ်ဆက်မှု ပြဿနာရှိနေပါသည်။'); setNoticeMessage(null); } finally { setIsTranscribing(false); }
  };

  const handleSyncNeuralVoiceover = async () => {
    if (segments.length === 0) return setNoticeMessage('စကားပြောစာသားကို အရင်ထုတ်ယူပါ');
    const apiKey = getApiKey(); if (!apiKey) return alert('API Key အရင်ထည့်ပါ။');
    setIsSyncingVoices(true); setNoticeMessage(null);
    try {
      const response = await fetch('/api/video/sync-voiceover-segments', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': apiKey },
        body: JSON.stringify({ segments, voice: selectedVoiceId, emotion: selectedEmotionId, gender: currentVoice.gender, language: targetLang }),
      });
      const data = await response.json();
      if (data.success) {
        onSegmentsChange(data.segments);
        const firstAudio = data.segments.find((s: any) => s.audioUrl)?.audioUrl;
        if (firstAudio) onSyncVoiceoverComplete(firstAudio);
        setNoticeMessage(`✓ လူသံစစ်စစ်ဖြင့် အသံသွင်းပြီးပါပြီ!`);
      } else alert('အသံသွင်းရာတွင် အခက်အခဲရှိနေပါသည်။ API Key ကို ပြန်စစ်ပါ။');
    } catch (err) { alert('ချိတ်ဆက်မှု ပြဿနာရှိနေပါသည်။'); } finally { setIsSyncingVoices(false); }
  };

  const handlePlaySegmentPreview = (seg: VideoSpeechSegment) => {
    if (!seg.audioUrl) return;
    const a = new Audio(seg.audioUrl); setPlayingSegmentId(seg.id);
    a.onended = () => setPlayingSegmentId(null); a.play().catch(() => setPlayingSegmentId(null));
  };

  // NEW: Handle Custom Logo Image Upload
  const handleIconFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onIconSettingsChange({
        ...iconSettings,
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
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Languages className="w-5 h-5 text-rose-500" />
            <span>Video Editor & AI Dubbing</span>
          </h3>
        </div>
        <div className="flex items-center space-x-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button onClick={() => setActiveTab('transcribe')} className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${activeTab === 'transcribe' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}><Languages className="w-3.5 h-3.5"/><span>၁။ ဘာသာပြန်</span></button>
          <button onClick={() => setActiveTab('voiceover')} className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${activeTab === 'voiceover' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}><Mic className="w-3.5 h-3.5"/><span>၂။ အသံသွင်း</span></button>
          <button onClick={() => setActiveTab('visuals')} className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${activeTab === 'visuals' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}><Sliders className="w-3.5 h-3.5"/><span>၃။ စာတန်း/Logo/Blur</span></button>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /><span>{noticeMessage}</span>
        </div>
      )}

      {/* TRANSCRIPTION TAB */}
      {activeTab === 'transcribe' && (
        <div className="space-y-4">
          <button onClick={handleAutoTranscribeVideo} disabled={isTranscribing} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold text-sm shadow-lg flex justify-center space-x-2">
            {isTranscribing ? <><RotateCcw className="w-4 h-4 animate-spin"/><span>ဆောင်ရွက်နေသည်...</span></> : <><Sparkles className="w-4 h-4"/><span>ဗီဒီယိုမှ စကားပြောထုတ်ယူပြီး ဘာသာပြန်မည်</span></>}
          </button>
          {segments.length > 0 && (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {segments.map((seg, idx) => (
                <div key={seg.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-400">{idx + 1}. {seg.startSec.toFixed(1)}s - {seg.endSec.toFixed(1)}s</span>
                    {seg.audioUrl && (
                      <button onClick={() => handlePlaySegmentPreview(seg)} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] flex items-center space-x-1"><Volume2 className="w-3 h-3 text-rose-400" /><span>Play Audio</span></button>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] uppercase block mb-0.5">Original:</span> <span className="font-mono">{seg.originalText}</span>
                  </div>
                  <div>
                    <input type="text" value={targetLang === 'my' ? seg.translationBurmese : seg.translationEnglish}
                      onChange={(e) => onSegmentsChange(segments.map(s => s.id === seg.id ? { ...s, [targetLang === 'my' ? 'translationBurmese' : 'translationEnglish']: e.target.value } : s))}
                      className="w-full bg-slate-900 border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VOICEOVER TAB */}
      {activeTab === 'voiceover' && (
        <div className="space-y-5">
           <button onClick={handleSyncNeuralVoiceover} disabled={isSyncingVoices || segments.length === 0} className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold text-sm flex justify-center space-x-2">
              <Sparkles className="w-4 h-4"/><span>အသံသွင်းမည်</span>
           </button>
        </div>
      )}

      {/* VISUALS (D-PAD) TAB */}
      {activeTab === 'visuals' && (
        <div className="space-y-6">
          
          {/* 1. BLUR SETTINGS */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" /><span>နောက်ခံဝါးရန် (Blur Setup)</span>
              </label>
              <input type="checkbox" checked={blurSettings.enabled} onChange={(e) => onBlurSettingsChange({ ...blurSettings, enabled: e.target.checked })} className="w-4 h-4 rounded" />
            </div>
            {blurSettings.enabled && (
              <div className="space-y-3 pt-2 text-xs">
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300"
                  value={blurSettings.position}
                  onChange={(e) => onBlurSettingsChange({ ...blurSettings, position: e.target.value as any })}
                >
                  <option value="full-background">နောက်ခံအပြည့် ဝါးမည်</option>
                  <option value="top-bar">အပေါ်ပိုင်း ဝါးမည်</option>
                  <option value="bottom-bar">အောက်ပိုင်း ဝါးမည် (မူရင်းစာဖျောက်ရန်)</option>
                  <option value="custom-box">စိတ်ကြိုက်နေရာ (Custom Box)</option>
                </select>

                {blurSettings.position === 'custom-box' && (
                  <div className="flex flex-wrap items-center justify-center gap-4 bg-slate-900/50 p-2 rounded-xl">
                    <DPadControl label="နေရာရွှေ့ရန်" onMove={(dx, dy) => onBlurSettingsChange({ ...blurSettings, boxX: Math.max(0, (blurSettings.boxX || 0) + dx), boxY: Math.max(0, (blurSettings.boxY || 0) + dy) })} />
                    <DPadControl label="အရွယ်အစား (Size)" onMove={(dx, dy) => onBlurSettingsChange({ ...blurSettings, boxWidth: Math.max(10, (blurSettings.boxWidth || 100) + dx), boxHeight: Math.max(10, (blurSettings.boxHeight || 25) + dy) })} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. LOGO / IMAGE UPLOAD SETTINGS */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-amber-400" /><span>Video Logo / ဓာတ်ပုံ ထည့်ရန်</span>
              </label>
              <input type="checkbox" checked={iconSettings.enabled} onChange={(e) => onIconSettingsChange({ ...iconSettings, enabled: e.target.checked })} className="w-4 h-4 rounded" />
            </div>
            {iconSettings.enabled && (
              <div className="space-y-4 pt-2 text-xs">
                <div className="flex gap-2">
                   <button onClick={()=>onIconSettingsChange({...iconSettings, type: 'preset'})} className={`flex-1 p-2 rounded border ${iconSettings.type==='preset' ? 'border-amber-500 bg-amber-500/20 text-amber-300':'border-slate-700'}`}>Preset Badge</button>
                   <button onClick={()=>onIconSettingsChange({...iconSettings, type: 'custom'})} className={`flex-1 p-2 rounded border ${iconSettings.type==='custom' ? 'border-amber-500 bg-amber-500/20 text-amber-300':'border-slate-700'}`}>ကိုယ်ပိုင် Logo (Upload)</button>
                </div>

                {/* IMAGE UPLOAD UI (NEW) */}
                {iconSettings.type === 'custom' && (
                   <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                     <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg flex items-center space-x-2 text-xs font-bold transition-colors">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <span>ပုံရွေးချယ်ရန် (Upload Image)</span>
                        <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleIconFileUpload} className="hidden" />
                     </label>
                     {iconSettings.customImageUrl && (
                        <span className="text-[10px] text-emerald-400 mt-2 font-bold">✓ ပုံထည့်သွင်းပြီးပါပြီ</span>
                     )}
                   </div>
                )}

                <div className="flex flex-col items-center justify-center pt-2">
                   <div className="w-full flex items-center justify-between text-slate-400 mb-2">
                      <span>Logo အရွယ်အစား: {iconSettings.size || 50}px</span>
                      <input type="range" min="30" max="150" value={iconSettings.size || 50} onChange={(e) => onIconSettingsChange({...iconSettings, size: parseInt(e.target.value)})} className="w-1/2 accent-amber-500" />
                   </div>
                   {/* Logo Position D-Pad */}
                   <DPadControl label="Logo နေရာရွှေ့ရန်" onMove={(dx, dy) => onIconSettingsChange({ ...iconSettings, position: 'custom', customX: Math.max(0, (iconSettings.customX || 85) + dx), customY: Math.max(0, (iconSettings.customY || 10) + dy) })} />
                </div>
              </div>
            )}
          </div>

          {/* 3. SUBTITLE SETTINGS */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <Type className="w-4 h-4 text-rose-400" /><span>စာတန်းထိုး (Subtitles)</span>
            </label>
            <div className="flex items-center justify-center pt-2">
               {/* Subtitle Vertical D-Pad */}
               <DPadControl verticalOnly={true} label="စာတန်းထိုး အပေါ်/အောက် ရွှေ့ရန်" onMove={(dx, dy) => onSubtitleSettingsChange({ ...subtitleSettings, position: 'custom', customYPercent: Math.max(10, Math.min(95, (subtitleSettings.customYPercent || 80) + dy)) })} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
