/* ========================================
   PROPERTY EMPIRE - Sound Effects
   Web Audio API — no external files needed
   ======================================== */

const GameAudio = {
  ctx: null,
  muted: true, // Default muted — user enables in settings
  volume: 0.3,

  init() {
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { this.ctx = null; }
  },

  ensureCtx() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return !!this.ctx;
  },

  // Simple tone generator
  playTone(freq, duration, type, vol) {
    if (this.muted || !this.ensureCtx()) return;
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime((vol || this.volume) * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  // Ka-ching — property purchase
  purchase() {
    if (this.muted) return;
    this.playTone(800, 0.08, 'square', 0.15);
    setTimeout(function() { GameAudio.playTone(1200, 0.12, 'square', 0.1); }, 80);
    setTimeout(function() { GameAudio.playTone(1600, 0.15, 'sine', 0.08); }, 160);
  },

  // Coin — rent collected
  coin() {
    if (this.muted) return;
    this.playTone(1400, 0.06, 'sine', 0.1);
    setTimeout(function() { GameAudio.playTone(1800, 0.08, 'sine', 0.08); }, 60);
  },

  // Sale — property sold
  sale() {
    if (this.muted) return;
    this.playTone(600, 0.1, 'triangle', 0.12);
    setTimeout(function() { GameAudio.playTone(800, 0.1, 'triangle', 0.1); }, 100);
    setTimeout(function() { GameAudio.playTone(1200, 0.15, 'sine', 0.08); }, 200);
  },

  // Alarm — disaster
  alarm() {
    if (this.muted) return;
    this.playTone(300, 0.2, 'sawtooth', 0.1);
    setTimeout(function() { GameAudio.playTone(250, 0.25, 'sawtooth', 0.08); }, 200);
  },

  // Fanfare — milestone
  fanfare() {
    if (this.muted) return;
    this.playTone(523, 0.12, 'triangle', 0.15); // C
    setTimeout(function() { GameAudio.playTone(659, 0.12, 'triangle', 0.12); }, 120); // E
    setTimeout(function() { GameAudio.playTone(784, 0.12, 'triangle', 0.1); }, 240); // G
    setTimeout(function() { GameAudio.playTone(1047, 0.25, 'sine', 0.12); }, 360); // C high
  },

  // Decision — soft chime
  decision() {
    if (this.muted) return;
    this.playTone(880, 0.1, 'sine', 0.08);
    setTimeout(function() { GameAudio.playTone(1100, 0.15, 'sine', 0.06); }, 100);
  },

  // Era change — dramatic
  eraChange() {
    if (this.muted) return;
    this.playTone(400, 0.15, 'triangle', 0.12);
    setTimeout(function() { GameAudio.playTone(500, 0.15, 'triangle', 0.1); }, 150);
    setTimeout(function() { GameAudio.playTone(600, 0.15, 'triangle', 0.1); }, 300);
    setTimeout(function() { GameAudio.playTone(800, 0.3, 'sine', 0.12); }, 450);
  },

  // Negative — loss/expense
  negative() {
    if (this.muted) return;
    this.playTone(300, 0.15, 'sine', 0.08);
    setTimeout(function() { GameAudio.playTone(200, 0.2, 'sine', 0.06); }, 150);
  },

  toggle() {
    this.muted = !this.muted;
    if (!this.muted) this.ensureCtx();
    return this.muted;
  }
};
