/* Procedural WebAudio: engine, wind, tyres, crash, siren, nitro, near-miss. */
export class Sound {
  constructor() { this.ctx = null; this.on = true; this.ready = false; }
  init() {
    if (this.ready) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC(); this.ready = true;
    this.master = c.createGain(); this.master.gain.value = this.on ? 0.55 : 0; this.master.connect(c.destination);
    // engine
    this.eo1 = c.createOscillator(); this.eo1.type = 'sawtooth';
    this.eo2 = c.createOscillator(); this.eo2.type = 'square';
    this.ef = c.createBiquadFilter(); this.ef.type = 'lowpass'; this.ef.frequency.value = 600;
    this.eg = c.createGain(); this.eg.gain.value = 0;
    this.eo1.connect(this.ef); this.eo2.connect(this.ef); this.ef.connect(this.eg); this.eg.connect(this.master);
    this.eo1.start(); this.eo2.start();
    // noise source
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    const mk = (type, f, q) => {
      const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
      const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1;
      const g = c.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(this.master); s.start();
      return { g, fl };
    };
    this.wind = mk('bandpass', 900, 0.6); this.skid = mk('bandpass', 1800, 4); this.nit = mk('highpass', 2500, 0.5); this.rainN = mk('highpass', 3500, 0.3);
    // siren
    this.so = c.createOscillator(); this.so.type = 'triangle'; this.sg = c.createGain(); this.sg.gain.value = 0;
    this.so.connect(this.sg); this.sg.connect(this.master); this.so.start();
  }
  setOn(v) { this.on = v; if (this.ready) this.master.gain.value = v ? 0.55 : 0; }
  update(o) { // {rpm 0..1, thr, speed, skid 0..1, nitro 0..1, siren 0..1, rain, running}
    if (!this.ready) return; const c = this.ctx, t = c.currentTime;
    const run = o.running ? 1 : 0;
    const f = 38 + o.rpm * 150;
    this.eo1.frequency.setTargetAtTime(f, t, 0.04); this.eo2.frequency.setTargetAtTime(f * 0.5, t, 0.04);
    this.ef.frequency.setTargetAtTime(350 + o.rpm * 1400 + o.thr * 500, t, 0.05);
    this.eg.gain.setTargetAtTime(run * (0.10 + o.thr * 0.12), t, 0.05);
    this.wind.g.gain.setTargetAtTime(run * Math.min(0.28, o.speed / 90 * 0.28), t, 0.1);
    this.wind.fl.frequency.setTargetAtTime(400 + o.speed * 10, t, 0.1);
    this.skid.g.gain.setTargetAtTime(run * o.skid * 0.22, t, 0.05);
    this.nit.g.gain.setTargetAtTime(run * o.nitro * 0.2, t, 0.05);
    this.rainN.g.gain.setTargetAtTime(run * (o.rain ? 0.08 : 0), t, 0.2);
    this.sg.gain.setTargetAtTime(run * o.siren * 0.12, t, 0.1);
    this.so.frequency.setTargetAtTime(700 + 350 * Math.sin(t * 5.5), t, 0.02);
  }
  burst(kind) {
    if (!this.ready || !this.on) return; const c = this.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; const fl = c.createBiquadFilter(); const g = c.createGain();
    s.connect(fl); fl.connect(g); g.connect(this.master);
    if (kind === 'crash') { fl.type = 'lowpass'; fl.frequency.setValueAtTime(1800, t); fl.frequency.exponentialRampToValueAtTime(120, t + 0.6); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7); s.start(t); s.stop(t + 0.75); }
    else if (kind === 'near') { fl.type = 'bandpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(400, t); fl.frequency.exponentialRampToValueAtTime(3000, t + 0.35); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.1); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4); s.start(t); s.stop(t + 0.45); }
    else if (kind === 'scrape') { fl.type = 'highpass'; fl.frequency.value = 2000; g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); s.start(t); s.stop(t + 0.32); }
    else if (kind === 'nitro') { fl.type = 'bandpass'; fl.Q.value = 1; fl.frequency.setValueAtTime(600, t); fl.frequency.exponentialRampToValueAtTime(4000, t + 0.5); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7); s.start(t); s.stop(t + 0.75); }
    else if (kind === 'ui') { const o = c.createOscillator(); o.frequency.value = 660; o.type = 'square'; o.connect(g); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12); o.start(t); o.stop(t + 0.14); }
    else if (kind === 'busted') { const o = c.createOscillator(); o.type = 'sawtooth'; o.connect(g); o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.9); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1); o.start(t); o.stop(t + 1.05); }
  }
}
