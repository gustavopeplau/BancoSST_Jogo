// ═══════════════════════════════════════════════════════════
// SoundManager — Sistema de áudio procedural via Web Audio API
// Sem arquivos externos: todos os sons gerados por osciladores.
// Uso: SoundManager.play('dice') | SoundManager.play('gain')
// ═══════════════════════════════════════════════════════════

class _SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.25;
        this.musicVolume = 0.12;
        this._bgmNodes = null;
        this._bgmPlaying = false;
    }

    /** Inicializa o AudioContext (deve ser chamado após interação do usuário) */
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    /** Garante que o contexto está ativo (resume após user gesture) */
    _ensureCtx() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    }

    /** Toca um som pelo nome */
    play(name) {
        if (!this.enabled) return;
        const ctx = this._ensureCtx();
        const fn = this._sounds[name];
        if (fn) fn.call(this, ctx);
    }

    // ── BGM — Chiptune estilo Alex Kidd (PSG / square wave) ──
    startMusic() {
        if (this._bgmPlaying) return;
        const ctx = this._ensureCtx();
        const master = ctx.createGain();
        master.gain.value = this.musicVolume;
        master.connect(ctx.destination);

        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 5;
        comp.connect(master);

        const BPM = 112;
        const beat = 60 / BPM;
        const eighth = beat / 2;
        const bar = beat * 4;            // 1.6s

        const hz = (m) => m === 0 ? 0 : 440 * Math.pow(2, (m - 69) / 12);

        // ═══ COMPOSIÇÃO — 16 compassos (~25.6s) ═══════════════

        // Melodia principal — square wave, 8 colcheias por compasso
        // 0 = silêncio (pausa)
        const melody = [
    // ── Seção A: O "Hook" (Mais rítmico e moderno) ──
    // Adicionei síncope e saltos de quarta/quinta para um ar profissional
    [72, 0, 76, 79, 0, 81, 79, 0],   // C5 . E5 G5 . A5 G5 . (Groove)
    [74, 0, 77, 81, 0, 83, 79, 77],  // D5 . F5 A5 . B5 G5 F5
    [72, 76, 79, 84, 0, 86, 84, 79], // C5 E5 G5 C6 . D6 C6 G5
    [77, 76, 74, 72, 74, 0, 77, 79], // F5 E5 D5 C5 D5 . F5 G5

    // ── Seção B: Sofisticação (Jazz/Lo-fi Vibes) ──
    // Aqui usamos notas que dão tensão e resolução
    [81, 81, 84, 88, 81, 0, 79, 77], // A5 A5 C6 E6 A5 . G5 F5 (E6 dá o brilho)
    [79, 79, 83, 86, 79, 0, 77, 74], // G5 G5 B5 D6 G5 . F5 D5
    [77, 81, 84, 88, 79, 76, 74, 72], // F5 A5 C6 E6 G5 E5 D5 C5
    [76, 79, 84, 83, 76, 0, 72, 71], // E5 G5 C6 B5 E5 . C5 B4

    // ── Seção C: A Ponte "High-Tech" ──
    // Menos notas, mais impacto. Foco no movimento ascendente
    [84, 0, 81, 0, 86, 0, 83, 0],    // C6 . A5 . D6 . B5 .
    [88, 0, 84, 0, 89, 88, 86, 84],  // E6 . C6 . F6 E6 D6 C6
    [84, 84, 79, 79, 81, 81, 76, 76], // Mantive o padrão, mas com o synth certo soa como um clock
    [77, 79, 81, 83, 84, 86, 88, 91], // Finaliza bem agudo (G6 no final)

    // ── Seção D: Turnaround (Dramático e Elegante) ──
    [79, 0, 84, 0, 86, 0, 88, 0],    // Espaçamento para o jogador respirar
    [79, 77, 76, 74, 76, 0, 79, 81], // Resolução clássica
    [83, 81, 79, 77, 76, 74, 72, 74], 
    [72, 0, 79, 0, 84, 84, 0, 0],    // C5 . G5 . C6 C6 . . (Final mais seco e moderno)
];

        // Baixo — triangle wave, 4 semínimas por compasso
        const bass = [
            [48,55,48,55],[48,52,48,55],[45,52,45,52],[43,50,43,55],
            [41,48,41,48],[43,50,43,55],[45,52,45,52],[43,50,43,55],
            [48,55,48,55],[41,48,41,48],[38,45,38,45],[43,50,43,55],
            [45,52,45,52],[41,48,41,48],[43,50,43,55],[48,55,48,55],
        ];

        // Acordes para arpejo — 3 notas por compasso, arpegiadas
        const chords = [
            [60,64,67],[60,64,67],[57,60,64],[55,59,62],
            [53,57,60],[55,59,62],[57,60,64],[55,59,62],
            [60,64,67],[53,57,60],[50,53,57],[55,59,62],
            [57,60,64],[53,57,60],[55,59,62],[60,64,67],
        ];

        const totalBars = melody.length; // 16
        let _stopped = false;

        // ─── Funções de agendamento de notas ──────────────────

        const schedNote = (freq, t, dur, type, vol) => {
            if (freq === 0 || dur < 0.04) return;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = type;
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.01);
            g.gain.setValueAtTime(vol, t + dur * 0.7);
            g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            o.connect(g).connect(comp);
            o.start(t);
            o.stop(t + dur + 0.01);
        };

        // Buffer de ruído branco reutilizado para percussão
        const noiseLen = Math.floor(ctx.sampleRate * 0.06);
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;

        const schedKick = (t) => {
            // Kick: sine sweep 150→50Hz em 0.1s
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(150, t);
            o.frequency.exponentialRampToValueAtTime(50, t + 0.08);
            g.gain.setValueAtTime(0.12, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            o.connect(g).connect(comp);
            o.start(t);
            o.stop(t + 0.12);
        };

        const schedHat = (t, vol) => {
            const src = ctx.createBufferSource();
            const g = ctx.createGain();
            const hp = ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 9000;
            src.buffer = noiseBuf;
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            src.connect(hp).connect(g).connect(comp);
            src.start(t);
            src.stop(t + 0.05);
        };

        // ─── Agenda todas as camadas de 1 compasso ────────────
        const scheduleBar = (barTime, barIdx) => {
            const b = barIdx % totalBars;

            // LEAD — square wave (chiptune!)
            const mel = melody[b];
            mel.forEach((n, i) => {
                if (n === 0) return;
                schedNote(hz(n), barTime + i * eighth, eighth * 0.85, 'square', 0.055);
            });

            // BASS — triangle wave
            const bs = bass[b];
            bs.forEach((n, i) => {
                schedNote(hz(n), barTime + i * beat, beat * 0.75, 'triangle', 0.09);
            });

            // ARPEJO — square wave suave, colcheias
            const ch = chords[b];
            for (let i = 0; i < 8; i++) {
                const note = ch[i % ch.length] + 12; // oitava acima
                schedNote(hz(note), barTime + i * eighth, eighth * 0.45, 'square', 0.02);
            }

            // DRUMS — kick nos tempos 1 e 3, hihat em todas as colcheias
            for (let i = 0; i < 8; i++) {
                const t = barTime + i * eighth;
                if (i === 0 || i === 4) schedKick(t);
                schedHat(t, i % 2 === 0 ? 0.03 : 0.018);
            }
        };

        // ─── Look-ahead scheduler (sem gaps, contínuo) ───────
        const LOOK_AHEAD = 0.25;   // agenda 250ms à frente
        const CHECK_MS   = 50;     // verifica a cada 50ms
        let nextBarTime = ctx.currentTime + 0.05;
        let barCursor   = 0;

        const tick = () => {
            if (_stopped) return;
            while (nextBarTime < ctx.currentTime + LOOK_AHEAD) {
                scheduleBar(nextBarTime, barCursor);
                nextBarTime += bar;
                barCursor++;
            }
        };

        // Agenda os primeiros compassos imediatamente
        tick();
        const timerID = setInterval(tick, CHECK_MS);

        this._bgmNodes = {
            masterGain: master,
            stop: () => { _stopped = true; clearInterval(timerID); }
        };
        this._bgmPlaying = true;
    }

    stopMusic() {
        if (!this._bgmNodes) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        this._bgmNodes.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        if (this._bgmNodes.stop) this._bgmNodes.stop();
        this._bgmNodes = null;
        this._bgmPlaying = false;
    }

    setMusicVolume(val) {
        this.musicVolume = val;
        if (this._bgmNodes) this._bgmNodes.masterGain.gain.value = val;
    }

    setSfxVolume(val) {
        this.volume = val;
    }

    /** Cria um oscilador auxiliar */
    _osc(ctx, type, freq, start, end, vol = this.volume) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol, ctx.currentTime + start);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + end);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + start);
        o.stop(ctx.currentTime + end);
    }

    /** Cria ruído branco (para cliques e percussão) */
    _noise(ctx, duration, vol = this.volume * 0.5) {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        const g = ctx.createGain();
        src.buffer = buffer;
        g.gain.setValueAtTime(vol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        src.connect(g).connect(ctx.destination);
        src.start();
    }

    _sounds = {
        /** Dado rolando — sequência rápida de cliques */
        dice(ctx) {
            for (let i = 0; i < 6; i++) {
                const t = i * 0.07;
                this._osc(ctx, 'square', 200 + Math.random() * 400, t, t + 0.04, this.volume * 0.3);
            }
            // Impacto final
            this._osc(ctx, 'triangle', 600, 0.42, 0.65, this.volume * 0.5);
        },

        /** Passo do peão — toc curto */
        step(ctx) {
            this._osc(ctx, 'sine', 440, 0, 0.08, this.volume * 0.2);
            this._osc(ctx, 'triangle', 880, 0.01, 0.06, this.volume * 0.1);
        },

        /** Peão pousa na casa — impacto */
        land(ctx) {
            this._osc(ctx, 'sine', 350, 0, 0.12, this.volume * 0.4);
            this._osc(ctx, 'triangle', 180, 0.02, 0.18, this.volume * 0.3);
        },

        /** Ganho de dinheiro — arpejo ascendente alegre */
        gain(ctx) {
            [523, 659, 784, 1047].forEach((f, i) => {
                this._osc(ctx, 'sine', f, i * 0.08, i * 0.08 + 0.2, this.volume * 0.35);
            });
        },

        /** Perda de dinheiro — descida dramática */
        loss(ctx) {
            [440, 370, 311, 261].forEach((f, i) => {
                this._osc(ctx, 'sawtooth', f, i * 0.1, i * 0.1 + 0.2, this.volume * 0.15);
            });
        },

        /** Carta revelada — whoosh + brilho */
        card(ctx) {
            this._noise(ctx, 0.15, this.volume * 0.3);
            this._osc(ctx, 'sine', 600, 0.05, 0.35, this.volume * 0.3);
            this._osc(ctx, 'sine', 900, 0.1, 0.3, this.volume * 0.2);
        },

        /** Clique de botão */
        click(ctx) {
            this._osc(ctx, 'square', 800, 0, 0.04, this.volume * 0.15);
        },

        /** Compra realizada — som de caixa registradora */
        buy(ctx) {
            this._osc(ctx, 'sine', 523, 0, 0.1, this.volume * 0.3);
            this._osc(ctx, 'sine', 659, 0.08, 0.18, this.volume * 0.3);
            this._osc(ctx, 'sine', 784, 0.16, 0.35, this.volume * 0.4);
            this._noise(ctx, 0.08, this.volume * 0.2);
        },

        /** Dupla nos dados */
        double(ctx) {
            [784, 988, 1175, 1319].forEach((f, i) => {
                this._osc(ctx, 'sine', f, i * 0.06, i * 0.06 + 0.25, this.volume * 0.3);
            });
        },

        /** Interdição — som ominoso */
        interdict(ctx) {
            this._osc(ctx, 'sawtooth', 150, 0, 0.5, this.volume * 0.2);
            this._osc(ctx, 'square', 100, 0.1, 0.6, this.volume * 0.15);
        },

        /** Vitória — fanfarra */
        victory(ctx) {
            [523, 659, 784, 1047, 1319].forEach((f, i) => {
                this._osc(ctx, 'sine', f, i * 0.12, i * 0.12 + 0.4, this.volume * 0.4);
                this._osc(ctx, 'triangle', f * 1.5, i * 0.12 + 0.05, i * 0.12 + 0.35, this.volume * 0.15);
            });
        },

        /** Quiz correto */
        correct(ctx) {
            this._osc(ctx, 'sine', 523, 0, 0.15, this.volume * 0.3);
            this._osc(ctx, 'sine', 784, 0.1, 0.3, this.volume * 0.4);
        },

        /** Quiz errado */
        wrong(ctx) {
            this._osc(ctx, 'sawtooth', 200, 0, 0.3, this.volume * 0.15);
            this._osc(ctx, 'sawtooth', 160, 0.1, 0.35, this.volume * 0.12);
        },

        /** Turno mudou */
        turnChange(ctx) {
            this._osc(ctx, 'sine', 660, 0, 0.1, this.volume * 0.2);
            this._osc(ctx, 'sine', 880, 0.08, 0.18, this.volume * 0.15);
        }
    };
}

export const SoundManager = new _SoundManager();
