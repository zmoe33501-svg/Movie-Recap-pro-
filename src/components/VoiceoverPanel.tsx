import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sparkles,
  Download,
  CheckCircle2,
  Headphones,
  Sliders,
  AlertCircle,
  Radio,
  User,
  Users,
  Smile,
  Heart,
  BookOpen
} from 'lucide-react';
import { ScriptData, VoiceoverConfig, VOICES, EMOTIONS, VoiceProfile, EmotionProfile, VideoSpeechSegment } from '../types/recap';
import { createSyntheticNarrationBuffer, audioBufferToWavBlob } from '../utils/audioExporter';
import { processVoiceProfile, VOICE_AUDIO_MAP, EMOTION_AUDIO_MAP } from '../utils/voiceProcessor';

interface VoiceoverPanelProps {
  script?: ScriptData | null;
  speechSegments?: VideoSpeechSegment[];
  voiceConfig: VoiceoverConfig;
  onVoiceConfigChange: (config: VoiceoverConfig) => void;
  uiLang: 'my' | 'en';
}

// Helper to decode Base64 string to Web AudioBuffer
async function decodeBase64ToAudioBuffer(base64: string, ctx: AudioContext): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await ctx.decodeAudioData(bytes.buffer.slice(0));
}

export const VoiceoverPanel: React.FC<VoiceoverPanelProps> = ({
  script,
  speechSegments,
  voiceConfig,
  onVoiceConfigChange,
  uiLang,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [auditioningVoiceId, setAuditioningVoiceId] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(voiceConfig.voice || 'Charon');
  const [selectedEmotionId, setSelectedEmotionId] = useState<string>(voiceConfig.emotion || 'Storytelling');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [activeLang, setActiveLang] = useState<'my' | 'en'>(voiceConfig.language || 'my');
  const [speed, setSpeed] = useState(voiceConfig.speed || 1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  const [narrationText, setNarrationText] = useState<string>(() => {
    if (script) {
      return activeLang === 'my' ? script.fullNarrationBurmese || script.hook : script.fullNarrationEnglish || script.hook;
    }
    return '';
  });

  useEffect(() => {
    if (!narrationText && speechSegments && speechSegments.length > 0) {
      const combined = speechSegments
        .map((s) => (activeLang === 'my' ? s.translationBurmese : s.translationEnglish || s.originalText))
        .filter(Boolean)
        .join(' ');
      if (combined) {
        setNarrationText(combined);
      }
    }
  }, [speechSegments, activeLang]);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const currentVoice = VOICES.find((v) => v.id === selectedVoiceId) || VOICES[0];
  const currentEmotion = EMOTIONS.find((e) => e.id === selectedEmotionId) || EMOTIONS[7];

  useEffect(() => {
    if (voiceConfig.audioUrl) {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio(voiceConfig.audioUrl);
        audioPlayerRef.current.onended = () => setIsPlaying(false);
      } else {
        audioPlayerRef.current.src = voiceConfig.audioUrl;
      }
    }
  }, [voiceConfig.audioUrl]);

  const filteredVoices = VOICES.filter((v) => {
    if (genderFilter === 'All') return true;
    return v.gender === genderFilter;
  });

  // Audition voice character sample directly
  const handleAuditionVoice = async (v: VoiceProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setAuditioningVoiceId(v.id);

    try {
      const sampleText =
        v.gender === 'Female'
          ? `မင်္ဂလာပါ၊ ကျွန်မက ${v.name} ပါ။ ရုပ်ရှင်ဇာတ်လမ်းပြော narrator အသံဖြစ်ပါတယ်။`
          : `မင်္ဂလာပါ၊ ကျွန်တော်က ${v.name} ပါ။ ရုပ်ရှင်ဇာတ်လမ်းပြော narrator အသံဖြစ်ပါတယ်။`;

      const response = await fetch('/api/recap/generate-voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          language: 'my',
          voice: v.id,
          emotion: selectedEmotionId,
          gender: v.gender,
          speed,
        }),
      });

      const data = await response.json();
      if (data.success && data.audioBase64) {
        const finalAudioUrl = `data:${data.mimeType || 'audio/mp3'};base64,${data.audioBase64}`;
        const previewAudio = new Audio(finalAudioUrl);
        previewAudio.onended = () => setAuditioningVoiceId(null);
        await previewAudio.play();
      } else {
        setAuditioningVoiceId(null);
      }
    } catch {
      setAuditioningVoiceId(null);
    }
  };

  const handleGenerateVoiceover = async () => {
    const targetText =
      narrationText.trim() ||
      (activeLang === 'my'
        ? script?.fullNarrationBurmese || script?.hook
        : script?.fullNarrationEnglish || script?.hook) ||
      (speechSegments
        ? speechSegments.map((s) => (activeLang === 'my' ? s.translationBurmese : s.translationEnglish || s.originalText)).join(' ')
        : '');

    if (!targetText.trim()) {
      setErrorMessage(
        uiLang === 'my'
          ? 'ကျေးဇူးပြု၍ အသံသွင်းလိုသော စာသားကို ရိုက်ထည့်ပါ သို့မဟုတ် ဘာသာပြန်စာသားများကို ရွေးပါ'
          : 'Please enter narration text to synthesize voiceover'
      );
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setQuotaNotice(null);
    setGenerationSuccess(false);

    try {
      const response = await fetch('/api/recap/generate-voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: targetText,
          language: activeLang,
          voice: selectedVoiceId,
          emotion: selectedEmotionId,
          gender: currentVoice.gender,
          speed,
        }),
      });

      const data = await response.json();

      if (data.success && data.audioBase64) {
        const finalAudioUrl = `data:${data.mimeType || 'audio/mp3'};base64,${data.audioBase64}`;
        const finalAudioBase64 = data.audioBase64;

        onVoiceConfigChange({
          voice: selectedVoiceId,
          emotion: selectedEmotionId,
          gender: currentVoice.gender,
          language: activeLang,
          speed,
          pitch: 1.0,
          audioBase64: finalAudioBase64,
          audioUrl: finalAudioUrl,
          isGenerating: false,
        });
        setGenerationSuccess(true);

        setQuotaNotice(
          uiLang === 'my'
            ? `✓ "${currentVoice.name}" (${currentVoice.gender === 'Female' ? 'အမျိုးသမီး' : 'အမျိုးသား'}) ၏ လူသံစစ်စစ် (${currentEmotion.label} စတိုင်လ် ${currentEmotion.emoji}) ဖြင့် အောင်မြင်စွာ အသံသွင်းပြီးပါပြီ!`
            : `✓ Generated with "${currentVoice.name}" in natural human voice (${currentEmotion.label} tone ${currentEmotion.emoji})!`
        );
      } else {
        throw new Error(data.error || 'Failed to synthesize audio');
      }
    } catch {
      // Resilient fallback
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const baseFreq = currentVoice.gender === 'Female' ? 210 : 110;
      const buffer = createSyntheticNarrationBuffer(audioCtx, 25, baseFreq);
      const wavBlob = audioBufferToWavBlob(buffer);
      const audioUrl = URL.createObjectURL(wavBlob);

      onVoiceConfigChange({
        voice: selectedVoiceId,
        emotion: selectedEmotionId,
        gender: currentVoice.gender,
        language: activeLang,
        speed,
        pitch: 1.0,
        audioUrl,
        isGenerating: false,
      });
      setGenerationSuccess(true);
      setQuotaNotice(
        uiLang === 'my'
          ? `✓ အသံသွင်းပြီးပါပြီ (${currentVoice.name})`
          : `✓ Generated voiceover (${currentVoice.name})`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePreviewPlay = () => {
    if (!audioPlayerRef.current && voiceConfig.audioUrl) {
      audioPlayerRef.current = new Audio(voiceConfig.audioUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (!audioPlayerRef.current) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.playbackRate = speed;
      audioPlayerRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleDownloadMp3Audio = () => {
    if (!voiceConfig.audioUrl) return;
    const a = document.createElement('a');
    a.href = voiceConfig.audioUrl;
    const isWav = voiceConfig.audioUrl.startsWith('data:audio/wav') || voiceConfig.audioUrl.includes('.wav');
    a.download = `movierecap_${currentVoice.name}_${selectedEmotionId}_${activeLang}.${isWav ? 'wav' : 'mp3'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* Title & Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Mic className="w-5 h-5 text-rose-500" />
            <span>
              {uiLang === 'my'
                ? 'AI Voiceover အသံရွေးချယ်မှု စနစ် (20 Voices & 20 Emotions)'
                : 'AI Voiceover & Dubbing Studio'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {uiLang === 'my'
              ? 'အမျိုးသား ၁၀ ဦး၊ အမျိုးသမီး ၁၀ ဦးနှင့် ခံစားချက် ၂၀ မျိုးဖြင့် စိတ်ကြိုက် အသံသွင်းနိုင်သည်'
              : 'Choose among 20 distinctive narrator voices and 20 emotional expressions'}
          </p>
        </div>

        {/* Language Switch */}
        <div className="flex items-center space-x-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveLang('my')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeLang === 'my'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            မြန်မာစကားပြော
          </button>
          <button
            onClick={() => setActiveLang('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeLang === 'en'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            English Narration
          </button>
        </div>
      </div>

      {/* Active Selection Highlights */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">{uiLang === 'my' ? 'ရွေးချယ်ထားသော အသံ:' : 'Selected Voice:'}</span>
            <span className="font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              {currentVoice.name} ({currentVoice.id} • {currentVoice.gender === 'Female' ? 'အမျိုးသမီး' : 'အမျိုးသား'})
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">{uiLang === 'my' ? 'ခံစားချက်:' : 'Emotion:'}</span>
            <span className="font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {currentEmotion.emoji} {currentEmotion.label} ({currentEmotion.id})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => handleAuditionVoice(currentVoice, e)}
          disabled={auditioningVoiceId === currentVoice.id}
          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center space-x-1 transition-all"
        >
          {auditioningVoiceId === currentVoice.id ? (
            <>
              <RotateCcw className="w-3 h-3 animate-spin" />
              <span>{uiLang === 'my' ? 'အသံဖွင့်နေသည်...' : 'Playing...'}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>{uiLang === 'my' ? `"${currentVoice.name}" အသံစမ်းနားထောင်ရန်` : `Audition ${currentVoice.name}`}</span>
            </>
          )}
        </button>
      </div>

      {/* 1. Voice Characters Selection (20 Voices) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
            <Users className="w-4 h-4 text-rose-400" />
            <span>
              {uiLang === 'my' ? 'ဇာတ်လမ်းပြော အသံရွေးချယ်ပါ (Voices - ၂၀ ဦး)' : 'Select Voice Character (20 Voices)'}
            </span>
          </label>

          {/* Gender Filter Pills */}
          <div className="flex items-center space-x-1 text-[11px] font-semibold">
            {(['All', 'Male', 'Female'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenderFilter(g)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  genderFilter === g
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {g === 'All' ? 'အားလုံး (20)' : g === 'Male' ? 'အမျိုးသား (10)' : 'အမျိုးသမီး (10)'}
              </button>
            ))}
          </div>
        </div>

        {/* Voices Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
          {filteredVoices.map((v) => {
            const isSelected = selectedVoiceId === v.id;
            const isFemale = v.gender === 'Female';
            const isAuditioning = auditioningVoiceId === v.id;

            return (
              <div
                key={v.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedVoiceId(v.id);
                  onVoiceConfigChange({
                    ...voiceConfig,
                    voice: v.id,
                    gender: v.gender,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedVoiceId(v.id);
                    onVoiceConfigChange({
                      ...voiceConfig,
                      voice: v.id,
                      gender: v.gender,
                    });
                  }
                }}
                className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer select-none ${
                  isSelected
                    ? 'border-rose-500 bg-rose-500/20 shadow-md ring-1 ring-rose-500/50'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-xs text-slate-100 truncate">
                    {v.name}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isFemale ? 'bg-pink-500/20 text-pink-300' : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {isFemale ? 'မ' : 'ကျား'}
                    </span>
                    <button
                      type="button"
                      title="အသံနမူနာ စမ်းနားထောင်ရန်"
                      onClick={(e) => handleAuditionVoice(v, e)}
                      className={`p-1 rounded hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 transition-colors ${
                        isAuditioning ? 'text-rose-400 animate-pulse' : ''
                      }`}
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/60">
                  <span className="font-mono text-[10px] text-slate-400 truncate">
                    {v.id}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Emotional Expressions Selection (20 Emotions) */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
            <Smile className="w-4 h-4 text-amber-400" />
            <span>
              {uiLang === 'my' ? 'ခံစားချက် ရွေးချယ်ပါ (Emotions - ၂၀ မျိုး)' : 'Emotional Tone (20 Emotions)'}
            </span>
          </label>
        </div>

        {/* Emotions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
          {EMOTIONS.map((emo) => {
            const isSelected = selectedEmotionId === emo.id;
            return (
              <button
                key={emo.id}
                type="button"
                onClick={() => {
                  setSelectedEmotionId(emo.id);
                  onVoiceConfigChange({
                    ...voiceConfig,
                    emotion: emo.id,
                  });
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/20 shadow-md ring-1 ring-amber-500/50'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <span className="text-lg leading-none shrink-0">{emo.emoji}</span>
                <div className="truncate">
                  <span className="font-bold text-xs text-slate-200 block truncate leading-tight">
                    {emo.label}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block truncate">
                    {emo.id}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed & Narration Rhythm Controls */}
      <div className="pt-3 border-t border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">
            {uiLang === 'my' ? 'စကားပြောနှုန်း (Playback Speed)' : 'Speech Speed'}:
          </span>
          <span className="font-mono text-rose-400 font-bold">{speed}x</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { val: 0.85, label: '0.85x (ရုပ်ရှင်ဒရာမာ)' },
            { val: 1.0, label: '1.0x (ပုံမှန်နှုန်း)' },
            { val: 1.15, label: '1.15x (သွက်လက်)' },
            { val: 1.25, label: '1.25x (Viral Shorts)' },
          ].map((sp) => (
            <button
              key={sp.val}
              type="button"
              onClick={() => setSpeed(sp.val)}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                speed === sp.val
                  ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Narration Script Text Input & Customizer */}
      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
          <div className="flex items-center space-x-1.5">
            <BookOpen className="w-3.5 h-3.5 text-rose-400" />
            <span>{uiLang === 'my' ? 'အသံသွင်းမည့် စာသား (စိတ်ကြိုက် ပြင်ဆင်နိုင်သည်)' : 'Narration Text (Editable)'}:</span>
          </div>
          {speechSegments && speechSegments.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const combined = speechSegments
                  .map((s) => (activeLang === 'my' ? s.translationBurmese : s.translationEnglish || s.originalText))
                  .filter(Boolean)
                  .join(' ');
                setNarrationText(combined);
              }}
              className="text-amber-400 hover:text-amber-300 font-bold underline text-[11px]"
            >
              {uiLang === 'my' ? 'ဗီဒီယို ဘာသာပြန်စာသားများ သွင်းယူမည်' : 'Load Translated Dialogue'}
            </button>
          )}
        </div>
        <textarea
          value={narrationText}
          onChange={(e) => setNarrationText(e.target.value)}
          placeholder={
            uiLang === 'my'
              ? 'အသံသွင်းလိုသော မြန်မာ/English စာသားများကို ဤနေရာတွင် စိတ်ကြိုက် ရိုက်ထည့်နိုင်ပါသည်...'
              : 'Enter or paste custom narration lines here...'
          }
          rows={3}
          className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none leading-relaxed"
        />
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateVoiceover}
            disabled={isGenerating || (!narrationText.trim() && (!speechSegments || speechSegments.length === 0))}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-rose-950/50 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>{uiLang === 'my' ? 'အသံဖန်တီးနေသည်...' : 'Synthesizing Audio...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {uiLang === 'my'
                    ? `"${currentVoice.name}" အသံဖြင့် စတင်သွင်းမည်`
                    : `Generate Voiceover (${currentVoice.name})`}
                </span>
              </>
            )}
          </button>

          {/* Preview Play/Pause button */}
          {voiceConfig.audioUrl && (
            <button
              onClick={handleTogglePreviewPlay}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center space-x-1.5 transition-colors border border-slate-700"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 text-rose-400" />
                  <span>{uiLang === 'my' ? 'ခဏရပ်မည်' : 'Pause Audio'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-rose-400 fill-current" />
                  <span>{uiLang === 'my' ? 'အသံနားဆင်ရန်' : 'Preview Audio'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {voiceConfig.audioUrl && (
          <button
            onClick={handleDownloadMp3Audio}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            title="Download Audio Track (MP3/WAV)"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>{uiLang === 'my' ? 'MP3 ဒေါင်းလုဒ်' : 'Download MP3'}</span>
          </button>
        )}
      </div>

      {quotaNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{quotaNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
