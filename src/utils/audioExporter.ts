// Audio decoding, synthesis, background music generation, and export utilities

/**
 * Converts a base64 WAV string to an AudioBuffer
 */
export async function base64ToAudioBuffer(base64: string, audioCtx: AudioContext): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await audioCtx.decodeAudioData(bytes.buffer);
}

/**
 * Creates a synthetic speech/narration audio buffer as an instant fallback
 * (e.g. if network error or quota limits occur, so user workflow is never blocked)
 */
export function createSyntheticNarrationBuffer(
  audioCtx: AudioContext,
  durationSec: number = 30,
  pitchFreq: number = 140
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const numFrames = Math.floor(sampleRate * durationSec);
  const buffer = audioCtx.createBuffer(1, numFrames, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Generate a pleasant warm radio narration tone with cadence pulses
  for (let i = 0; i < numFrames; i++) {
    const t = i / sampleRate;
    // Cadence modulation simulates speech rhythm
    const speechEnvelope = Math.sin(t * 8) > 0 ? (0.5 + 0.5 * Math.sin(t * 24)) : 0.05;
    // Harmonic formant frequencies
    const fundamental = Math.sin(2 * Math.PI * pitchFreq * t);
    const harmonic1 = 0.5 * Math.sin(2 * Math.PI * (pitchFreq * 1.5) * t);
    const harmonic2 = 0.25 * Math.sin(2 * Math.PI * (pitchFreq * 2.2) * t);
    channelData[i] = (fundamental + harmonic1 + harmonic2) * 0.15 * speechEnvelope;
  }
  return buffer;
}

/**
 * Synthesizes cinematic royalty-free background ambient music (BGM)
 * dynamically based on movie recap genre (Suspense, Action, Emotional, Horror, Cyberpunk)
 */
export function createCinematicBgmBuffer(
  audioCtx: AudioContext,
  trackType: 'suspense' | 'action' | 'emotional' | 'horror' | 'cyberpunk',
  durationSec: number = 45
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const numFrames = Math.floor(sampleRate * durationSec);
  const buffer = audioCtx.createBuffer(2, numFrames, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < numFrames; i++) {
    const t = i / sampleRate;
    let lSample = 0;
    let rSample = 0;

    if (trackType === 'suspense') {
      // Deep ominous drone (55Hz / A1) with slow pulsating filtered sub-bass
      const sub = Math.sin(2 * Math.PI * 55 * t) * 0.35;
      const subHarmonic = Math.sin(2 * Math.PI * 82.5 * t) * (0.15 + 0.1 * Math.sin(t * 0.4));
      // Ticking cinematic tension clock (2 beats per sec)
      const tickEnv = Math.exp(-((t % 0.5) * 40));
      const tick = (Math.sin(2 * Math.PI * 1800 * t) + (Math.random() - 0.5) * 0.3) * tickEnv * 0.12;
      lSample = sub + subHarmonic + tick;
      rSample = sub + subHarmonic * 0.9 + tick * 0.8;
    } else if (trackType === 'action') {
      // Driving heist beat with rhythmic low-end kick pulse & bass synth
      const beatEnv = Math.exp(-((t % 0.4) * 22));
      const kick = Math.sin(2 * Math.PI * (90 - (t % 0.4) * 160) * t) * beatEnv * 0.4;
      const bassLine = Math.sin(2 * Math.PI * (65 + (Math.floor(t * 2.5) % 4) * 15) * t) * 0.18;
      const hihat = (Math.random() - 0.5) * Math.exp(-((t % 0.2) * 50)) * 0.08;
      lSample = kick + bassLine + hihat;
      rSample = kick + bassLine * 0.9 + hihat * 1.2;
    } else if (trackType === 'emotional') {
      // Warm melancholic piano chords & lush pad swell
      const chordRoot = 110; // A2
      const chord3rd = 130.8; // C3
      const chord5th = 164.8; // E3
      const swell = 0.5 + 0.5 * Math.sin(t * 0.6);
      const pad = (Math.sin(2 * Math.PI * chordRoot * t) +
                   0.8 * Math.sin(2 * Math.PI * chord3rd * t) +
                   0.6 * Math.sin(2 * Math.PI * chord5th * t)) * 0.12 * swell;
      lSample = pad;
      rSample = pad * 1.05;
    } else if (trackType === 'horror') {
      // Microtonal unsettling frequency beats (discordant 100Hz vs 103Hz)
      const drone1 = Math.sin(2 * Math.PI * 100 * t) * 0.25;
      const drone2 = Math.sin(2 * Math.PI * 103.5 * t) * 0.25;
      const screech = Math.sin(2 * Math.PI * (2400 + Math.sin(t * 8) * 400) * t) * 0.04 * (Math.sin(t * 0.2) > 0 ? 1 : 0);
      lSample = drone1 + screech;
      rSample = drone2 + screech * 0.7;
    } else if (trackType === 'cyberpunk') {
      // 16th note arpeggiator saw pulse
      const arpFreq = 80 + ((Math.floor(t * 6) % 8) * 25);
      const arpEnv = Math.exp(-((t % (1 / 6)) * 18));
      const arp = Math.sin(2 * Math.PI * arpFreq * t) * arpEnv * 0.22;
      const sub = Math.sin(2 * Math.PI * 45 * t) * 0.25;
      lSample = arp + sub;
      rSample = arp * 0.8 + sub;
    }

    left[i] = Math.max(-1, Math.min(1, lSample));
    right[i] = Math.max(-1, Math.min(1, rSample));
  }

  return buffer;
}

/**
 * Creates a WAV file Blob from an AudioBuffer
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const length = buffer.length * numChannels * 2;
  const headerLength = 44;
  const outBuffer = new ArrayBuffer(headerLength + length);
  const view = new DataView(outBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length minus RIFF header
  view.setUint32(4, 36 + length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, length, true);

  // write interleaved data
  let offset = 44;
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Triggers a browser download of a Blob file
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
