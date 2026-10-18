// Web Audio API engine for drum rhythm playback and chromatic tuner pitch detection

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.drumBuffers = new Map();
    this.isPlayingDrum = false;
    this.drumInterval = null;
    this.currentStep = 0;
    this.bpm = 120;
    this.drumVolume = 0.8;
    this.tunerStream = null;
    this.analyser = null;
    this.isTuning = false;
    this.onPitchDetected = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Synthesize realistic drum hits if audio files aren't pre-loaded
  playDrumHit(type, velocity = 0.8) {
    this.initContext();
    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.drumVolume * velocity, t);
    masterGain.connect(this.ctx.destination);

    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
      gain.gain.setValueAtTime(1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === 'snare') {
      // Noise component
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, t);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(t);

      // Body tone
      const osc = this.ctx.createOscillator();
      const toneGain = this.ctx.createGain();
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);
      toneGain.gain.setValueAtTime(0.6, t);
      toneGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(toneGain);
      toneGain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.15);
    } else if (type === 'hihat_closed') {
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(9000, t);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.05);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(t);
    } else if (type === 'hihat_open' || type === 'ride') {
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, t);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(t);
    } else if (type === 'cowbell') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(587, t);
      osc2.frequency.setValueAtTime(845, t);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.22);
      osc2.stop(t + 0.22);
    }
  }

  // Standard 16-step patterns for styles
  getStylePattern(styleName) {
    const s = styleName.toLowerCase();
    if (s.includes('rock') || s.includes('punk') || s.includes('metal')) {
      return [
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 0, snare: 1, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 1, snare: 0, hh: 1 },
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 1, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 0, snare: 1, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 0, snare: 1, hh: 1 },
        { kick: 0, snare: 0, hh: 1 }
      ];
    }
    if (s.includes('funk')) {
      return [
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 1, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 1, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 1, hh: 1 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 0, snare: 0, hh: 1 }
      ];
    }
    if (s.includes('blues') || s.includes('shuffle') || s.includes('swing')) {
      return [
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 0, hh: 0 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 0, snare: 1, hh: 1 },
        { kick: 0, snare: 0, hh: 0 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 0, hh: 0 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 0, snare: 1, hh: 1 },
        { kick: 0, snare: 0, hh: 0 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 1, snare: 0, hh: 1 },
        { kick: 0, snare: 0, hh: 0 },
        { kick: 0, snare: 0, hh: 1 },
        { kick: 0, snare: 1, hh: 1 }
      ];
    }
    // Default 4/4 Pop beat
    return [
      { kick: 1, snare: 0, hh: 1 },
      { kick: 0, snare: 0, hh: 1 },
      { kick: 0, snare: 1, hh: 1 },
      { kick: 0, snare: 0, hh: 1 },
      { kick: 1, snare: 0, hh: 1 },
      { kick: 0, snare: 0, hh: 1 },
      { kick: 0, snare: 1, hh: 1 },
      { kick: 0, snare: 0, hh: 1 },
      { kick: 1, snare: 0, hh: 1 },
      { kick: 0, snare: 0, hh: 1 },
      { kick: 0, snare: 1, hh: 1 },
      { kick: 0, snare: 0, hh: 1 },
      { kick: 1, snare: 0, hh: 1 },
      { kick: 0, snare: 0, hh: 1 },
      { kick: 0, snare: 1, hh: 1 },
      { kick: 0, snare: 0, hh: 1 }
    ];
  }

  startDrum(pattern, bpm = 120, onStep = null) {
    this.stopDrum();
    this.initContext();
    this.isPlayingDrum = true;
    this.bpm = bpm;
    this.currentStep = 0;

    const stepInterval = (60 / this.bpm) / 4 * 1000; // 16th notes
    this.drumInterval = setInterval(() => {
      const stepData = pattern[this.currentStep % pattern.length];
      if (stepData.kick) this.playDrumHit('kick');
      if (stepData.snare) this.playDrumHit('snare');
      if (stepData.hh) this.playDrumHit('hihat_closed');
      if (stepData.cowbell) this.playDrumHit('cowbell');
      
      if (onStep) onStep(this.currentStep % pattern.length);
      this.currentStep++;
    }, stepInterval);
  }

  stopDrum() {
    this.isPlayingDrum = false;
    if (this.drumInterval) {
      clearInterval(this.drumInterval);
      this.drumInterval = null;
    }
  }

  // Real-time Pitch Detection (Chromatic Tuner)
  async startTuner(callback) {
    this.initContext();
    this.onPitchDetected = callback;
    this.isTuning = true;

    try {
      this.tunerStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const source = this.ctx.createMediaStreamSource(this.tunerStream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);
      this.processTuner();
    } catch (err) {
      console.warn('Microphone not accessible for tuner, running simulated test pitch generator:', err);
      this.runSimulatedTuner();
    }
  }

  stopTuner() {
    this.isTuning = false;
    if (this.tunerStream) {
      this.tunerStream.getTracks().forEach(track => track.stop());
      this.tunerStream = null;
    }
  }

  processTuner() {
    if (!this.isTuning || !this.analyser) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);
    const pitch = this.autoCorrelate(buffer, this.ctx.sampleRate);

    if (pitch !== -1) {
      const noteInfo = this.pitchToNote(pitch);
      if (this.onPitchDetected) {
        this.onPitchDetected(noteInfo);
      }
    }

    requestAnimationFrame(() => this.processTuner());
  }

  runSimulatedTuner() {
    const notes = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
    let nIdx = 0;
    const interval = setInterval(() => {
      if (!this.isTuning) {
        clearInterval(interval);
        return;
      }
      const note = notes[nIdx % notes.length];
      const baseFreq = this.noteToFreq(note);
      const randomOffset = (Math.random() - 0.5) * 8; // cents variation
      const freq = baseFreq * Math.pow(2, randomOffset / 1200);
      const noteInfo = this.pitchToNote(freq);
      if (this.onPitchDetected) {
        this.onPitchDetected(noteInfo);
      }
      if (Math.random() < 0.2) nIdx++;
    }, 120);
  }

  autoCorrelate(buffer, sampleRate) {
    let size = buffer.length;
    let rms = 0;
    for (let i = 0; i < size; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / size);
    if (rms < 0.01) return -1; // signal too quiet

    let r1 = 0, r2 = size - 1, thres = 0.2;
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < size / 2; i++) {
      if (Math.abs(buffer[size - i]) < thres) { r2 = size - i; break; }
    }

    const buf2 = buffer.slice(r1, r2);
    const c = new Array(buf2.length).fill(0);
    for (let i = 0; i < buf2.length; i++) {
      for (let j = 0; j < buf2.length - i; j++) {
        c[i] = c[i] + buf2[j] * buf2[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < buf2.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;
    return sampleRate / T0;
  }

  pitchToNote(freq) {
    const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const a4 = 440;
    const c0 = a4 * Math.pow(2, -4.75);
    const halfSteps = 12 * Math.log2(freq / c0);
    const roundHalfSteps = Math.round(halfSteps);
    const noteName = noteStrings[roundHalfSteps % 12];
    const octave = Math.floor(roundHalfSteps / 12);
    const targetFreq = c0 * Math.pow(2, roundHalfSteps / 12);
    const cents = Math.floor(1200 * Math.log2(freq / targetFreq));

    return {
      freq: Math.round(freq * 10) / 10,
      note: noteName,
      octave,
      cents: Math.max(-50, Math.min(50, cents)),
      inTune: Math.abs(cents) <= 3
    };
  }

  noteToFreq(noteStr) {
    const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const note = noteStr.slice(0, -1);
    const oct = parseInt(noteStr.slice(-1), 10);
    const noteIdx = noteStrings.indexOf(note);
    return 440 * Math.pow(2, (noteIdx - 9 + (oct - 4) * 12) / 12);
  }
}

export const audioEngine = new AudioEngine();
