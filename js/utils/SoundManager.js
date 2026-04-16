// ═══════════════════════════════════════════════════════════
// SoundManager v2 — Modern Procedural Game Audio Engine
// ─────────────────────────────────────────────────────────
// Convolution reverb · Dynamic compression · Layered synth
// Lo-fi chill BGM · Polished SFX · Zero external files
// ═══════════════════════════════════════════════════════════

class _SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.25;
        this.musicVolume = 0.12;
        this._bgmNodes = null;
        this._bgmPlaying = false;
        this._ready = false;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this._build();
    }

    _ensureCtx() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    }

    /* ── Audio routing graph ────────────────────────────────
       SFX  → _sfxDry ──────────────→ _master → _comp → dest
            → _sfxWet → _reverb → _revOut ↗
       Music → _musicBus ──────────────────↗                  */
    _build() {
        if (this._ready) return;
        const c = this.ctx;

        this._comp = c.createDynamicsCompressor();
        this._comp.threshold.value = -14;
        this._comp.ratio.value = 4;
        this._comp.attack.value = 0.003;
        this._comp.release.value = 0.1;
        this._comp.connect(c.destination);

        this._master = c.createGain();
        this._master.gain.value = 0.9;
        this._master.connect(this._comp);

        this._sfxDry = c.createGain();
        this._sfxDry.connect(this._master);

        this._reverb = this._ir(1.6, 2.0);
        this._revOut = c.createGain();
        this._revOut.gain.value = 0.18;
        this._reverb.connect(this._revOut);
        this._revOut.connect(this._master);

        this._sfxWet = c.createGain();
        this._sfxWet.gain.value = 0.35;
        this._sfxWet.connect(this._reverb);

        this._musicBus = c.createGain();
        this._musicBus.connect(this._master);

        // Shared noise buffer (1 second)
        const len = c.sampleRate;
        this._nBuf = c.createBuffer(1, len, c.sampleRate);
        const d = this._nBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

        this._ready = true;
    }

    /** Procedural impulse-response reverb */
    _ir(dur, decay) {
        const c = this.ctx, sr = c.sampleRate, n = Math.floor(sr * dur);
        const buf = c.createBuffer(2, n, sr);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            for (let i = 0; i < n; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
        }
        const conv = c.createConvolver();
        conv.buffer = buf;
        return conv;
    }

    _hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    /** Oscillator with ADSR envelope + optional filter */
    _t(dest, send, type, freq, t, dur, vol, atk = 0.005, rel = 0.06, opts = {}) {
        const c = this.ctx;
        if (!freq || freq < 20) return;
        const o = c.createOscillator(), g = c.createGain();
        o.type = type;
        o.frequency.value = freq;
        if (opts.detune) o.detune.value = opts.detune;

        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + Math.min(atk, dur * 0.4));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        let node = o;
        if (opts.lpf) {
            const f = c.createBiquadFilter();
            f.type = 'lowpass'; f.frequency.value = opts.lpf; f.Q.value = opts.Q || 0.7;
            node.connect(f); node = f;
        }
        node.connect(g);
        g.connect(dest);
        if (send) g.connect(send);
        o.start(t); o.stop(t + dur + 0.02);
    }

    /** Noise burst with optional bandpass */
    _n(dest, send, t, dur, vol, hp = 0, lp = 20000) {
        const c = this.ctx, src = c.createBufferSource();
        src.buffer = this._nBuf;
        if (dur > 0.9) src.loop = true;
        const g = c.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        let node = src;
        if (hp > 0) {
            const f = c.createBiquadFilter();
            f.type = 'highpass'; f.frequency.value = hp;
            node.connect(f); node = f;
        }
        if (lp < 18000) {
            const f = c.createBiquadFilter();
            f.type = 'lowpass'; f.frequency.value = lp;
            node.connect(f); node = f;
        }
        node.connect(g); g.connect(dest);
        if (send) g.connect(send);
        src.start(t); src.stop(t + dur + 0.02);
    }

    /** Synth kick drum */
    _kick(dest, t, vol = 0.12) {
        const c = this.ctx;
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(160, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.06);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.connect(g).connect(dest);
        o.start(t); o.stop(t + 0.27);
        // Click transient
        const o2 = c.createOscillator(), g2 = c.createGain();
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(300, t);
        o2.frequency.exponentialRampToValueAtTime(60, t + 0.015);
        g2.gain.setValueAtTime(vol * 0.4, t);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
        o2.connect(g2).connect(dest);
        o2.start(t); o2.stop(t + 0.05);
    }

    /** Snare / rimshot */
    _snare(dest, t, vol = 0.07) {
        const c = this.ctx;
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle'; o.frequency.value = 200;
        g.gain.setValueAtTime(vol * 0.5, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        o.connect(g).connect(dest);
        o.start(t); o.stop(t + 0.1);
        this._n(dest, null, t, 0.1, vol * 0.7, 2500, 12000);
    }

    /** Hi-hat (closed / open) */
    _hat(dest, t, vol = 0.025, open = false) {
        this._n(dest, null, t, open ? 0.14 : 0.035, vol, 8000);
    }

    // ═══════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════

    play(name, ...args) {
        if (!this.enabled) return;
        this._ensureCtx();
        const fn = this._sounds[name];
        if (fn) fn.call(this, ...args, ...args);
    }

    // ── BGM: Lo-fi Chill Groove in C minor ────────────────
    startMusic() {
        if (this._bgmPlaying) return;
        const ctx = this._ensureCtx();

        // Music sub-mixer
        const mg = ctx.createGain();
        mg.gain.value = this.musicVolume;
        mg.connect(this._musicBus);

        const mc = ctx.createDynamicsCompressor();
        mc.threshold.value = -12; mc.ratio.value = 3;
        mc.connect(mg);

        // Music reverb (longer, lusher than SFX)
        const mr = this._ir(2.4, 1.6);
        const mrg = ctx.createGain();
        mrg.gain.value = 0.14;
        mr.connect(mrg); mrg.connect(mc);

        const BPM = 88;
        const beat = 60 / BPM;
        const e8 = beat / 2;
        const e16 = beat / 4;
        const bar = beat * 4;
        const sw = 0.035; // swing offset
        const hz = m => this._hz(m);

        // ── Chord voicings (rootless, 16 bars) ───────────
        // Neo-soul / lo-fi in C minor
        const CH = [
            // Section A
            [55,58,62,67], [55,58,62,67],   // Cm9
            [60,63,67,72], [60,63,67,72],   // Fm9
            [48,55,60,63], [50,55,58,67],   // AbMaj7 → Gm7
            [60,63,67,72], [47,50,53,59],   // Fm7 → G7
            // Section B
            [55,58,62,67], [55,58,62,67],   // EbMaj9
            [48,55,60,63], [48,55,60,63],   // AbMaj7
            [60,63,67,72], [48,50,53,55],   // Fm7 → G7sus4
            [55,58,62,67], [55,58,62,67],   // Cm7
        ];

        // Bass: root movement + octave fills
        const BASS = [
            [36,36,43,36], [36,43,36,43],
            [41,41,48,41], [41,48,41,43],
            [44,44,48,44], [43,43,47,43],
            [41,41,48,41], [43,43,47,43],
            [39,39,46,39], [39,46,39,46],
            [44,44,48,44], [44,48,44,43],
            [41,41,48,41], [43,43,47,43],
            [36,36,43,36], [36,43,36,43],
        ];

        // Melody: sparse pentatonic Rhodes lead
        const MEL = [
            [72,0,70,0,67,0,0,0],   [0,0,0,0,0,63,65,67],
            [68,0,0,67,65,0,0,0],   [0,0,0,0,0,0,63,0],
            [60,0,63,0,67,0,0,0],   [0,0,70,0,67,0,0,0],
            [65,0,63,0,60,0,0,0],   [0,0,0,0,0,55,58,59],
            [67,0,0,70,0,0,72,0],   [0,0,70,72,0,0,0,0],
            [68,0,0,0,67,0,63,0],   [0,0,0,0,0,0,0,0],
            [65,0,63,60,0,0,0,0],   [0,0,0,0,55,0,59,0],
            [60,0,0,0,0,0,67,0],    [0,0,0,0,0,0,0,0],
        ];

        // Drum patterns (16th note grid, 16 chars each)
        // K=kick  S=snare  h=hihat  O=open hat  .=rest
        const DR = [
            'K.h.S.h.K.h.S.h.',   // A: standard boom-bap
            'K.h.S.h...K.S.h.',   // B: syncopated
            'K.....h.....S.h.',   // C: half-time / breathing
            'K.h.S.hK.Kh.SSSS',  // D: fill
        ];
        const DM = [0,0,0,1, 0,0,1,3, 0,0,0,1, 2,0,1,3];

        const BARS = 16;
        let stopped = false;

        // ── Schedule one bar of all layers ────────────────
        const sched = (bt, bi) => {
            const b = bi % BARS;

            // ── Rhodes keys (sine + bell overtone) ───────
            const ch = CH[b];
            for (let i = 0; i < 8; i++) {
                // Deterministic skip for lo-fi sparseness
                if (Math.sin(b * 7.3 + i * 11.7) > 0.15 && b > 0) continue;
                const note = ch[i % ch.length];
                const t = bt + i * e8 + (i % 2 ? sw : 0);
                const vel = (i === 0 || i === 4) ? 0.032 : 0.018;
                // Fundamental
                this._t(mc, mr, 'sine', hz(note), t, e8 * 1.8, vel, 0.003, 0.15);
                // Bell overtone (2nd harmonic)
                this._t(mc, null, 'sine', hz(note) * 2, t, e8 * 0.7, vel * 0.12, 0.001, 0.06);
            }

            // ── Melody (sparse Rhodes lead) ──────────────
            MEL[b].forEach((n, i) => {
                if (!n) return;
                const t = bt + i * e8 + (i % 2 ? sw * 0.5 : 0);
                this._t(mc, mr, 'sine', hz(n), t, e8 * 2.5, 0.042, 0.004, 0.25);
                // Shimmer overtone (3rd harmonic)
                this._t(mc, null, 'sine', hz(n) * 3, t + 0.002, e8 * 0.5, 0.004, 0.001, 0.05);
            });

            // ── Bass (warm sine + filtered triangle) ─────
            BASS[b].forEach((n, i) => {
                const t = bt + i * beat;
                this._t(mc, null, 'sine', hz(n), t, beat * 0.8, 0.085, 0.008, 0.1);
                this._t(mc, null, 'triangle', hz(n + 12), t, beat * 0.45, 0.018, 0.004, 0.06, { lpf: 700 });
            });

            // ── Drums (boom-bap with swing) ──────────────
            const pat = DR[DM[b]];
            for (let i = 0; i < 16; i++) {
                const t = bt + i * e16 + (i % 2 ? sw * 0.6 : 0);
                const ch2 = pat[i];
                if (ch2 === 'K') this._kick(mc, t, 0.1);
                if (ch2 === 'S') this._snare(mc, t, 0.055);
                if (ch2 === 'h') this._hat(mc, t, 0.018);
                if (ch2 === 'O') this._hat(mc, t, 0.022, true);
            }

            // ── Vinyl crackle (subtle texture) ───────────
            this._n(mc, null, bt, bar, 0.003, 600, 4000);
        };

        // ── Look-ahead scheduler ─────────────────────────
        const LOOK = 0.3, TICK = 60;
        let nextBar = ctx.currentTime + 0.1, cursor = 0;
        const tick = () => {
            if (stopped) return;
            while (nextBar < ctx.currentTime + LOOK) {
                sched(nextBar, cursor);
                nextBar += bar;
                cursor++;
            }
        };
        tick();
        const tid = setInterval(tick, TICK);

        this._bgmNodes = {
            masterGain: mg,
            stop: () => { stopped = true; clearInterval(tid); }
        };
        this._bgmPlaying = true;
    }

    stopMusic() {
        if (!this._bgmNodes) return;
        const { masterGain, stop } = this._bgmNodes;
        masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
        if (stop) stop();
        setTimeout(() => { try { masterGain.disconnect(); } catch (e) { /* ok */ } }, 1000);
        this._bgmNodes = null;
        this._bgmPlaying = false;
    }

    setMusicVolume(val) {
        this.musicVolume = val;
        if (this._bgmNodes) this._bgmNodes.masterGain.gain.value = val;
    }

    setSfxVolume(val) { this.volume = val; }

    // ═══════════════════════════════════════════════════════
    // SFX LIBRARY
    // ═══════════════════════════════════════════════════════

    _sounds = {
        /** 🎲 Dice rolling — cinematic shake, tumble & settle */
        dice() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;

            // Phase 1: Shaking rattle (0-0.25s)
            for (let i = 0; i < 8; i++) {
                const dt = i * 0.03;
                const p = 1200 + Math.random() * 2000;
                this._n(d, null, t + dt, 0.02, v * 0.06, p, p + 800);
            }

            // Phase 2: Tumbling bounces — decelerating, pitch drops
            const bounces = [0.28, 0.36, 0.42, 0.47, 0.51, 0.545, 0.575, 0.6];
            bounces.forEach((dt, i) => {
                const energy = 1 - i / bounces.length;
                const pitch = 350 + energy * 450 + Math.random() * 150;
                const vol = v * (0.08 + energy * 0.18);
                // Wooden clack
                this._t(d, null, 'triangle', pitch, t + dt, 0.025, vol, 0.001, 0.018);
                // Body thump
                this._t(d, null, 'sine', 80 + energy * 60, t + dt, 0.04, vol * 0.5, 0.001, 0.03);
                // Surface scratch
                this._n(d, null, t + dt, 0.015, vol * 0.15, 3000, 10000);
            });

            // Phase 3: Final settle — satisfying stop
            this._t(d, null, 'sine', 90, t + 0.64, 0.2, v * 0.35, 0.003, 0.16);
            this._t(d, w, 'triangle', 420, t + 0.64, 0.12, v * 0.25, 0.002, 0.08);
            this._t(d, null, 'sine', 210, t + 0.66, 0.1, v * 0.15, 0.002, 0.07);
            // Subtle ring
            this._t(d, w, 'sine', 1800, t + 0.65, 0.25, v * 0.03, 0.005, 0.18);
        },

        /** 👟 Pawn hop — progressive xylophone-like note per step
         *  @param {number} stepIdx  — current step (1-based)
         *  @param {number} total    — total steps to move           */
        step(stepIdx = 1, total = 6) {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;

            // Pentatonic scale: C D E G A — maps step progress to rising pitch
            const scale = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86];
            const progress = Math.min((stepIdx - 1) / Math.max(total - 1, 1), 1);
            const noteIdx = Math.round(progress * (scale.length - 1));
            const midi = scale[noteIdx];
            const freq = this._hz(midi);

            // Volume builds slightly toward destination
            const volScale = 0.7 + progress * 0.3;

            // Main tap (wood block feel)
            this._t(d, w, 'sine', freq, t, 0.08, v * 0.22 * volScale, 0.002, 0.05);
            // Harmonic shimmer (bell)
            this._t(d, null, 'sine', freq * 2.5, t + 0.003, 0.05, v * 0.05 * volScale, 0.001, 0.035);
            // Subtle thud of foot
            this._t(d, null, 'sine', 100, t + 0.005, 0.04, v * 0.08, 0.001, 0.03);
            // Tiny click transient
            this._n(d, null, t, 0.008, v * 0.04, 4000, 12000);
        },

        /** 🎯 Pawn lands — triumphant arrival with weight */
        land() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;
            // Deep thud
            this._t(d, null, 'sine', 70, t, 0.3, v * 0.5, 0.003, 0.22);
            this._t(d, null, 'sine', 140, t + 0.005, 0.15, v * 0.25, 0.003, 0.1);
            // Bright arrival chime
            this._t(d, w, 'sine', this._hz(72), t + 0.02, 0.25, v * 0.28, 0.003, 0.18);
            this._t(d, w, 'sine', this._hz(76), t + 0.05, 0.2, v * 0.18, 0.003, 0.14);
            // Shimmer
            this._t(d, null, 'sine', this._hz(84), t + 0.06, 0.12, v * 0.04, 0.002, 0.08);
            // Impact noise
            this._n(d, null, t, 0.06, v * 0.1, 200, 3000);
            // Surface vibration
            this._n(d, w, t + 0.03, 0.15, v * 0.02, 400, 15
            this._t(d, w, 'sine', 1800, t + 0.65, 0.25, v * 0.03, 0.005, 0.18);
        },

        /** 👟 Pawn hop — progressive xylophone-like note per step
         *  @param {number} stepIdx  — current step (1-based)
         *  @param {number} total    — total steps to move           */
        step(stepIdx = 1, total = 6) {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;

            // Pentatonic scale: C D E G A — maps step progress to rising pitch
            const scale = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86];
            const progress = Math.min((stepIdx - 1) / Math.max(total - 1, 1), 1);
            const noteIdx = Math.round(progress * (scale.length - 1));
            const midi = scale[noteIdx];
            const freq = this._hz(midi);

            // Volume builds slightly toward destination
            const volScale = 0.7 + progress * 0.3;

            // Main tap (wood block feel)
            this._t(d, w, 'sine', freq, t, 0.08, v * 0.22 * volScale, 0.002, 0.05);
            // Harmonic shimmer (bell)
            this._t(d, null, 'sine', freq * 2.5, t + 0.003, 0.05, v * 0.05 * volScale, 0.001, 0.035);
            // Subtle thud of foot
            this._t(d, null, 'sine', 100, t + 0.005, 0.04, v * 0.08, 0.001, 0.03);
            // Tiny click transient
            this._n(d, null, t, 0.008, v * 0.04, 4000, 12000);
        },

        /** 🎯 Pawn lands — triumphant arrival with weight */
        land() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;
            // Deep thud
            this._t(d, null, 'sine', 70, t, 0.3, v * 0.5, 0.003, 0.22);
            this._t(d, null, 'sine', 140, t + 0.005, 0.15, v * 0.25, 0.003, 0.1);
            // Bright arrival chime
            this._t(d, w, 'sine', this._hz(72), t + 0.02, 0.25, v * 0.28, 0.003, 0.18);
            this._t(d, w, 'sine', this._hz(76), t + 0.05, 0.2, v * 0.18, 0.003, 0.14);
            // Shimmer
            this._t(d, null, 'sine', this._hz(84), t + 0.06, 0.12, v * 0.04, 0.002, 0.08);
            // Impact noise
            this._n(d, null, t, 0.06, v * 0.1, 200, 3000);
            // Surface vibration
            this._n(d, w, t + 0.03, 0.15, v * 0.02, 400, 1500);
        },

        /** 💰 Money gained — sparkly ascending cascade */
        gain() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;
            const notes = [60, 64, 67, 72, 76]; // C E G C5 E5
            notes.forEach((n, i) => {
                const dt = i * 0.065;
                this._t(d, w, 'sine', this._hz(n), t + dt, 0.35 - i * 0.03, v * 0.3, 0.003, 0.15);
                this._t(d, null, 'sine', this._hz(n) * 3, t + dt + 0.01, 0.15, v * 0.04, 0.001, 0.08);
            });
            // Sparkle
            this._n(d, w, t + 0.05, 0.3, v * 0.04, 6000);
        },

        /** 📉 Money lost — tense descending chromatic */
        loss() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;
            const notes = [67, 63, 60, 56, 53]; // G Eb C Ab F
            notes.forEach((n, i) => {
                const dt = i * 0.085;
                this._t(d, w, 'sawtooth', this._hz(n), t + dt, 0.25, v * 0.07, 0.005, 0.15, { lpf: 1200 });
                this._t(d, null, 'sine', this._hz(n), t + dt, 0.2, v * 0.14, 0.003, 0.12);
            });
            this._t(d, null, 'sine', 60, t + 0.2, 0.4, v * 0.1, 0.05, 0.3);
        },

        /** 🃏 Card revealed — whoosh + chime shimmer */
        card() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;
            this._n(d, null, t, 0.2, v * 0.14, 1000, 8000);
            this._t(d, w, 'sine', 800, t + 0.08, 0.3, v * 0.25, 0.01, 0.2);
            this._t(d, w, 'sine', 1200, t + 0.12, 0.25, v * 0.18, 0.01, 0.15);
            this._t(d, null, 'sine', 2400, t + 0.15, 0.12, v * 0.06, 0.002, 0.08);
        },

        /** 🖱️ Button click — crisp pop */
        click() {
            const t = this.ctx.currentTime, d = this._sfxDry, v = this.volume;
            this._t(d, null, 'sine', 1000, t, 0.035, v * 0.2, 0.001, 0.025);
            this._t(d, null, 'triangle', 600, t + 0.005, 0.025, v * 0.1, 0.001, 0.02);
        },

        /** 🛒 Purchase — modern ka-ching bell */
        buy() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;
            [1568, 2093, 2637].forEach((f, i) => {
                this._t(d, w, 'sine', f, t + i * 0.055, 0.4 - i * 0.1, v * 0.2, 0.002, 0.2);
            });
            this._t(d, w, 'sine', 3200, t + 0.15, 0.15, v * 0.08, 0.001, 0.1);
            this._t(d, null, 'sine', 523, t + 0.08, 0.2, v * 0.2, 0.005, 0.15);
            this._n(d, null, t, 0.05, v * 0.08, 4000);
        },

        /** 🎰 Double dice — exciting power escalation */
        double() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;
            const notes = [60, 67, 72, 79, 84]; // C G C5 G5 C6
            notes.forEach((n, i) => {
                this._t(d, w, 'sine', this._hz(n), t + i * 0.05, 0.35, v * (0.2 + i * 0.04), 0.002, 0.2);
                this._t(d, null, 'triangle', this._hz(n + 12), t + i * 0.05, 0.2, v * 0.06, 0.001, 0.1);
            });
            this._n(d, w, t + 0.2, 0.15, v * 0.06, 3000);
        },

        /** 🚫 Interdiction — dark pulsing alarm */
        interdict() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;
            for (let i = 0; i < 3; i++) {
                const dt = i * 0.22;
                this._t(d, w, 'sawtooth', 110, t + dt, 0.18, v * 0.12, 0.01, 0.1, { lpf: 400 });
                this._t(d, null, 'square', 220, t + dt, 0.15, v * 0.06, 0.01, 0.08, { lpf: 600 });
            }
            this._t(d, null, 'sine', 45, t, 0.7, v * 0.2, 0.05, 0.4);
            this._n(d, null, t, 0.5, v * 0.04, 100, 500);
        },

        /** 🏆 Victory — epic triumphant fanfare */
        victory() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;
            const layers = [
                { notes: [60],             dt: 0.0,  dur: 0.4  },
                { notes: [60, 64],         dt: 0.15, dur: 0.5  },
                { notes: [60, 64, 67],     dt: 0.3,  dur: 0.6  },
                { notes: [60, 64, 67, 72], dt: 0.5,  dur: 0.8  },
                { notes: [60, 64, 67, 72, 76], dt: 0.8, dur: 1.2 },
            ];
            layers.forEach(({ notes, dt, dur }) => {
                notes.forEach(n => {
                    // Brass layer
                    this._t(d, w, 'sawtooth', this._hz(n), t + dt, dur, v * 0.08, 0.02, 0.3, { lpf: 2000 });
                    // Bright layer
                    this._t(d, w, 'sine', this._hz(n), t + dt, dur, v * 0.2, 0.01, 0.4);
                    // Octave shimmer
                    this._t(d, null, 'sine', this._hz(n + 12), t + dt + 0.02, dur * 0.6, v * 0.05, 0.005, 0.15);
                });
            });
            // Timpani roll
            for (let i = 0; i < 8; i++) {
                this._t(d, null, 'sine', 80 + Math.random() * 10, t + 0.6 + i * 0.04, 0.08,
                    v * (0.1 + i * 0.02), 0.002, 0.06);
            }
            // Crash cymbal
            this._n(d, w, t + 0.8, 1.5, v * 0.08, 2000);
        },

        /** ✅ Quiz correct — bright major-third confirmation */
        correct() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;
            this._t(d, w, 'sine', this._hz(72), t, 0.15, v * 0.35, 0.003, 0.1);
            this._t(d, w, 'sine', this._hz(76), t + 0.1, 0.25, v * 0.4, 0.003, 0.15);
            this._t(d, null, 'sine', this._hz(88), t + 0.12, 0.12, v * 0.05, 0.001, 0.08);
        },

        /** ❌ Quiz wrong — dissonant minor-second buzz */
        wrong() {
            const t = this.ctx.currentTime, d = this._sfxDry, v = this.volume;
            this._t(d, null, 'sawtooth', this._hz(60), t, 0.3, v * 0.08, 0.01, 0.2, { lpf: 800 });
            this._t(d, null, 'sawtooth', this._hz(61), t, 0.3, v * 0.08, 0.01, 0.2, { lpf: 800 });
            this._t(d, null, 'sine', 80, t, 0.2, v * 0.15, 0.005, 0.15);
        },

        /** 🔄 Turn change — soft whoosh + bell */
        turnChange() {
            const t = this.ctx.currentTime, d = this._sfxDry, w = this._sfxWet, v = this.volume;
            this._n(d, null, t, 0.15, v * 0.06, 2000, 8000);
            this._t(d, w, 'sine', this._hz(72), t + 0.05, 0.2, v * 0.2, 0.003, 0.15);
            this._t(d, null, 'sine', this._hz(79), t + 0.1, 0.12, v * 0.1, 0.002, 0.08);
        },
    };
}

export const SoundManager = new _SoundManager();
