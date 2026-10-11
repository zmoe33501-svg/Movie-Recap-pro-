import { audioBufferToWavBlob } from './audioExporter';

export interface VoiceAudioParams {
  detune: number; // in cents
  formantFreq: number; // filter frequency
  filterType: BiquadFilterType;
  filterQ: number;
}

export const VOICE_AUDIO_MAP: Record<string, VoiceAudioParams> = {
  // 10 Male Voices (Deep / Baritone / Heavy Bass / Gritty)
  Charon: { detune: -420, formantFreq: 1400, filterType: 'lowshelf', filterQ: 1.2 }, // အောင်အောင် (Deep Hero)
  Fenrir: { detune: -560, formantFreq: 1000, filterType: 'lowshelf', filterQ: 1.5 }, // ရဲရင့် (Gritty Warrior)
  Orus: { detune: -260, formantFreq: 1800, filterType: 'peaking', filterQ: 1.0 }, // မင်းခန့် (Youthful Male)
  Enceladus: { detune: -460, formantFreq: 1200, filterType: 'lowshelf', filterQ: 1.3 }, // ဇေယျာ (Resonant)
  Iapetus: { detune: -520, formantFreq: 1100, filterType: 'lowshelf', filterQ: 1.4 }, // ထက်မြတ် (Heavy Bass)
  Algenib: { detune: -340, formantFreq: 1600, filterType: 'peaking', filterQ: 1.1 }, // မျိုးမင်း (Warm Baritone)
  Rasalgethi: { detune: -440, formantFreq: 1300, filterType: 'peaking', filterQ: 1.2 }, // စည်သူ (Dramatic Narrator)
  Schedar: { detune: -300, formantFreq: 1700, filterType: 'peaking', filterQ: 1.0 }, // ကောင်းကင် (Clear Male)
  Alnilam: { detune: -480, formantFreq: 1150, filterType: 'lowshelf', filterQ: 1.3 }, // သီဟ (Deep Cinematic)
  Sadachbia: { detune: -280, formantFreq: 1900, filterType: 'peaking', filterQ: 1.0 }, // ဝေယံ (Natural Male)

  // 10 Female Voices (Bright / Melodic / Warm / Expressive)
  Kore: { detune: 180, formantFreq: 2800, filterType: 'highshelf', filterQ: 1.0 }, // စုစု (Warm Storyteller)
  Aoede: { detune: 320, formantFreq: 3400, filterType: 'highshelf', filterQ: 1.2 }, // သန္တာ (Bright Melodic)
  Leda: { detune: 80, formantFreq: 2400, filterType: 'peaking', filterQ: 1.0 }, // လှိုင် (Gentle Emotional)
  Callirrhoe: { detune: 240, formantFreq: 3100, filterType: 'highshelf', filterQ: 1.1 }, // အေးအေး (Friendly Female)
  Autonoe: { detune: 120, formantFreq: 2600, filterType: 'peaking', filterQ: 1.0 }, // မြမြ (Grounded Female)
  Despina: { detune: 380, formantFreq: 3600, filterType: 'highshelf', filterQ: 1.3 }, // နန်းဆု (Young Lively)
  Erinome: { detune: 160, formantFreq: 2700, filterType: 'peaking', filterQ: 1.1 }, // ရွှေရည် (Sweet Calm)
  Laomedeia: { detune: 220, formantFreq: 3000, filterType: 'highshelf', filterQ: 1.0 }, // သီရိ (Professional Female)
  Achernar: { detune: 140, formantFreq: 2500, filterType: 'peaking', filterQ: 1.0 }, // မေမီ (Poetic Female)
  Gacrux: { detune: 350, formantFreq: 3500, filterType: 'highshelf', filterQ: 1.2 }, // နှင်းနှင်း (Sparkling Bright)
};

export interface EmotionAudioParams {
  rateMod: number;
  pitchMod: number; // in cents
  gainMod: number;
}

export const EMOTION_AUDIO_MAP: Record<string, EmotionAudioParams> = {
  Neutral: { rateMod: 1.0, pitchMod: 0, gainMod: 1.0 },
  Happy: { rateMod: 1.08, pitchMod: 80, gainMod: 1.05 },
  Sad: { rateMod: 0.84, pitchMod: -120, gainMod: 0.9 },
  Angry: { rateMod: 1.16, pitchMod: 140, gainMod: 1.15 },
  Calm: { rateMod: 0.92, pitchMod: -40, gainMod: 0.95 },
  Energetic: { rateMod: 1.20, pitchMod: 120, gainMod: 1.1 },
  Whisper: { rateMod: 0.88, pitchMod: -60, gainMod: 0.75 },
  Storytelling: { rateMod: 0.96, pitchMod: 20, gainMod: 1.0 },
  Professional: { rateMod: 1.02, pitchMod: -20, gainMod: 1.0 },
  Casual: { rateMod: 1.0, pitchMod: 10, gainMod: 1.0 },
  Fearful: { rateMod: 1.14, pitchMod: 150, gainMod: 1.05 },
  Surprised: { rateMod: 1.12, pitchMod: 160, gainMod: 1.1 },
  Excited: { rateMod: 1.22, pitchMod: 180, gainMod: 1.12 },
  Romantic: { rateMod: 0.88, pitchMod: -30, gainMod: 0.95 },
  Sarcastic: { rateMod: 0.94, pitchMod: 70, gainMod: 1.0 },
  Serious: { rateMod: 0.90, pitchMod: -100, gainMod: 1.05 },
  Confident: { rateMod: 1.04, pitchMod: -40, gainMod: 1.08 },
  Shy: { rateMod: 0.90, pitchMod: 50, gainMod: 0.85 },
  Hopeful: { rateMod: 1.02, pitchMod: 60, gainMod: 1.02 },
  Tired: { rateMod: 0.80, pitchMod: -140, gainMod: 0.85 },
};

/**
 * Transforms an input raw AudioBuffer into a voice-crafted, emotion-inflected AudioBuffer
 * using an OfflineAudioContext. This executes in ~50ms client-side.
 */
export async function processVoiceProfile(
  rawBuffer: AudioBuffer,
  voiceId: string = 'Charon',
  emotionId: string = 'Storytelling',
  baseSpeed: number = 1.0
): Promise<{ processedBuffer: AudioBuffer; audioUrl: string; base64: string }> {
  const voiceParams = VOICE_AUDIO_MAP[voiceId] || VOICE_AUDIO_MAP.Charon;
  const emotionParams = EMOTION_AUDIO_MAP[emotionId] || EMOTION_AUDIO_MAP.Storytelling;

  const totalDetune = voiceParams.detune + emotionParams.pitchMod;
  const totalPlaybackRate = Math.max(0.5, Math.min(2.0, baseSpeed * emotionParams.rateMod));

  // The output length depends on playback rate
  const targetLength = Math.max(1, Math.floor(rawBuffer.length / totalPlaybackRate));
  const sampleRate = rawBuffer.sampleRate;

  const offlineCtx = new OfflineAudioContext(1, targetLength, sampleRate);

  // 1. Source buffer
  const source = offlineCtx.createBufferSource();
  source.buffer = rawBuffer;
  source.playbackRate.value = totalPlaybackRate;
  source.detune.value = totalDetune;

  // 2. Formant / Timbre shaping filter
  const filter = offlineCtx.createBiquadFilter();
  filter.type = voiceParams.filterType;
  filter.frequency.value = voiceParams.formantFreq;
  filter.Q.value = voiceParams.filterQ;

  // 3. Gain node for emotion dynamics
  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = emotionParams.gainMod;

  // Connect chain: Source -> Filter -> Gain -> Destination
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(offlineCtx.destination);

  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  // Convert Blob to base64
  const arrayBuffer = await wavBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    processedBuffer: renderedBuffer,
    audioUrl,
    base64,
  };
}
