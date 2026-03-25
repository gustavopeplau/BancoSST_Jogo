// JuiceFX — Efeitos visuais + Focus System + Trail + Progressão

let _focusOverlay = null;
let _focusedEl    = null;

export class JuiceFX {

    // ═══════════ FOCUS SYSTEM ═══════════════════════════
    static enableFocus(element) {
        if (!element) return;
        if (!_focusOverlay) {
            _focusOverlay = document.createElement('div');
            _focusOverlay.className = 'focus-overlay';
            document.body.appendChild(_focusOverlay);
        }
        // Remove destaque anterior
        if (_focusedEl) _focusedEl.classList.remove('focus-highlight');

        _focusOverlay.classList.add('active');
        element.classList.add('focus-highlight');
        _focusedEl = element;
    }

    static disableFocus() {
        if (_focusOverlay) _focusOverlay.classList.remove('active');
        if (_focusedEl) { _focusedEl.classList.remove('focus-highlight'); _focusedEl = null; }
    }

    // ═══════════ SCREEN SHAKE ══════════════════════════
    static screenShake(intensity = 4, duration = 300) {
        const board = document.getElementById('board');
        if (!board) return;
        // Preservar o scale atual (mobile) para não perder ao resetar
        const currentTransform = board.style.transform || '';
        const scaleMatch = currentTransform.match(/scale\([^)]+\)/);
        const scaleStr = scaleMatch ? scaleMatch[0] + ' ' : '';
        board.style.transition = 'none';
        const start = performance.now();
        const tick = (now) => {
            const elapsed = now - start;
            if (elapsed > duration) { board.style.transform = scaleStr.trim(); return; }
            const decay = 1 - elapsed / duration;
            const x = (Math.random() - 0.5) * 2 * intensity * decay;
            const y = (Math.random() - 0.5) * 2 * intensity * decay;
            board.style.transform = `${scaleStr}translate(${x}px, ${y}px)`;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    // ═══════════ TRAIL DE MOVIMENTO ════════════════════
    static trailSpace(spaceId) {
        const el = document.getElementById(`space-${spaceId}`);
        if (!el) return;
        el.classList.add('trail-tile');
        setTimeout(() => el.classList.remove('trail-tile'), 600);
    }

    // ═══════════ TEXTO VOADOR ══════════════════════════
    static floatText(text, color = '#fff', fontSize = '1.6rem') {
        const el = document.createElement('div');
        el.className   = 'juice-float-text';
        el.textContent = text;
        el.style.color    = color;
        el.style.fontSize = fontSize;
        el.style.left = '50%';
        el.style.top  = '50%';
        el.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }

    static floatNear(targetEl, text, color = '#fff', fontSize = '1.3rem') {
        if (!targetEl) return;
        const rect = targetEl.getBoundingClientRect();
        const el   = document.createElement('div');
        el.className   = 'juice-float-text';
        el.textContent = text;
        el.style.color    = color;
        el.style.fontSize = fontSize;
        el.style.left     = rect.left + rect.width / 2 + 'px';
        el.style.top      = rect.top + 'px';
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }

    // ═══════════ ANIMAÇÕES DE CLASSE ═══════════════════
    static _applyClass(el, className) {
        if (!el) return;
        el.classList.remove(className);
        void el.offsetWidth;
        el.classList.add(className);
        el.addEventListener('animationend', () => el.classList.remove(className), { once: true });
    }

    static shake(el)  { JuiceFX._applyClass(el, 'juice-shake'); }
    static pulse(el)  { JuiceFX._applyClass(el, 'juice-pulse'); }
    static bounce(el) { JuiceFX._applyClass(el, 'juice-bounce'); }
    static glow(el)   { JuiceFX._applyClass(el, 'juice-glow'); }
    static flash(el)  { JuiceFX._applyClass(el, 'juice-flash'); }

    // ═══════════ PROGRESSÃO (level up) ═════════════════
    static showLevelUp(text, color = '#f1dd38') {
        const el = document.createElement('div');
        el.className = 'juice-level-up';
        el.innerHTML = `<span class="level-up-icon">⭐</span><span>${text}</span>`;
        el.style.color = color;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }

    // ═══════════ TROCA DE TURNO ════════════════════════
    static showTurnBanner(playerName, playerColor, playerIcon) {
        const existing = document.querySelector('.turn-banner');
        if (existing) existing.remove();
        const el = document.createElement('div');
        el.className = 'turn-banner';
        el.innerHTML = `<span class="turn-banner-icon">${playerIcon}</span><span>Vez de ${playerName}</span>`;
        el.style.borderColor = playerColor;
        el.style.color = playerColor;
        document.body.appendChild(el);
        setTimeout(() => el.classList.add('turn-banner-exit'), 1200);
        el.addEventListener('animationend', (e) => { if (e.animationName === 'turnBannerOut') el.remove(); });
    }

    // ═══════════ ATALHOS ═══════════════════════════════
    static showMoney(amount, targetEl = null) {
        const isPositive = amount >= 0;
        const text  = `${isPositive ? '+' : '-'}$${Math.abs(amount)}`;
        const color = isPositive ? '#8ae37f' : '#ff4747';

        if (targetEl) {
            JuiceFX.floatNear(targetEl, text, color);
            isPositive ? JuiceFX.pulse(targetEl) : JuiceFX.shake(targetEl);
        } else {
            JuiceFX.floatText(text, color, '2rem');
        }
    }

    static showDice(d1, d2, isDouble) {
        const text  = `🎲 ${d1} + ${d2} = ${d1 + d2}`;
        const color = isDouble ? '#f1dd38' : '#40a2ff';
        JuiceFX.floatText(text, color, '2rem');
        if (isDouble) {
            JuiceFX.floatText('DUPLA! 🎲🎲', '#f1dd38', '1.2rem');
        }
    }
}