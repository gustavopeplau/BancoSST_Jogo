// ═══════════════════════════════════════════════════════════
// HUD3D.js — Glassmorphism floating HUD for 3D mode
// Player cards in corners, action feed, controls
// ═══════════════════════════════════════════════════════════

import { BOARD_DATA, GROUP_SIZE, LEVEL_NAMES } from '../data/boardData.js';

const MATURITY_LABELS = [
    'Sem Maturidade',
    'Nível 1 — Em Adequação',
    'Nível 2 — Empresa Reativa',
    'Nível 3 — Empresa com Segurança'
];
const MATURITY_COLORS = ['#555', '#40a2ff', '#f1dd38', '#8ae37f'];

const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

let _hudContainer = null;
let _feedContainer = null;
let _lastMoney = {};

function _hexToRgb(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `${r},${g},${b}`;
}

export const HUD3D = {

    init() {
        // Create HUD overlay container
        _hudContainer = document.createElement('div');
        _hudContainer.className = 'hud-3d-cards';
        _hudContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:100;';

        // Action feed
        _feedContainer = document.createElement('div');
        _feedContainer.className = 'action-feed-3d';

        const wrapper = document.getElementById('game-wrapper');
        if (wrapper) {
            wrapper.appendChild(_hudContainer);
            wrapper.appendChild(_feedContainer);
        }
    },

    updatePlayers(players, currentIndex) {
        if (!_hudContainer) return;
        _hudContainer.innerHTML = '';

        players.forEach((p, i) => {
            const corner = CORNERS[i] || CORNERS[i % CORNERS.length];
            const isActive = i === currentIndex;
            const matColor = MATURITY_COLORS[p.maturityLevel] || '#555';
            const matPct = Math.round((p.maturityLevel / 3) * 100);
            const moneyClass = p.money < 0 ? 'negative' : (p.money > 1000 ? 'positive' : '');

            // Property chips with level indicators
            const lvlIcons = { 2: '📋', 3: '⚙️', 4: '🏆' };
            const propsHtml = p.ownedPropertiesIds.map(id => {
                const space = BOARD_DATA[id];
                const color = space ? (space.color || '#555') : '#555';
                const resolvedColor = color.startsWith('var(')
                    ? this._resolveVarColor(color)
                    : color;
                const level = p.propertyLevels[id] || 0;
                const flagIcon = level >= 1 ? '🚩' : '';
                const extraIcon = lvlIcons[level] || '';
                const sipatStar = p.sipatSpaceId === id ? '⭐' : '';
                const title = space ? `${space.name} — ${LEVEL_NAMES[level] || ''}${sipatStar ? ' ⭐SIPAT' : ''}` : '';
                return `<div class="hud3d-prop-chip" style="background:${resolvedColor}" title="${title}"><span style="font-size:7px">${flagIcon}</span>${extraIcon ? `<span style="font-size:5px">${extraIcon}</span>` : ''}${sipatStar ? `<span style="font-size:7px">${sipatStar}</span>` : ''}</div>`;
            }).join('');

            // Status badges
            let badges = '';
            if (p.interdictionTurns > 0) badges += '<span class="hud3d-badge jailed">⛓️ Interditado</span>';
            if (p.isBot) badges += '<span class="hud3d-badge bot">🤖 Bot</span>';
            if (p.eliminated) badges += '<span class="hud3d-badge eliminated">💀 Eliminado</span>';

            const turnBadge = isActive
                ? `<span class="hud3d-turn-badge" style="color:${p.color};border:1px solid ${p.color}">▶ VEZ</span>`
                : '';

            const card = document.createElement('div');
            card.className = 'hud-card-3d glass-panel';
            card.setAttribute('data-corner', corner);
            card.id = `hud3d-card-${p.id}`;
            card.style.borderColor = isActive ? p.color : 'rgba(255,255,255,0.1)';
            if (isActive) {
                card.style.background = `linear-gradient(135deg, rgba(${_hexToRgb(p.color)},0.15) 0%, rgba(15,25,40,0.7) 100%)`;
            }

            card.innerHTML = `
                <div class="hud3d-card-header">
                    <div class="hud3d-avatar" style="background:rgba(${_hexToRgb(p.color)},0.25);color:${p.color}">${p.icon}</div>
                    <span class="hud3d-name" style="color:${p.color}">${p.name}</span>
                    ${turnBadge}
                </div>
                <div class="hud3d-balance">
                    <span class="hud3d-balance-label">Saldo</span>
                    <span class="hud3d-balance-value ${moneyClass}" id="bal3d-${p.id}">$${p.money.toLocaleString('pt-BR')}</span>
                </div>
                <div class="hud3d-maturity">
                    <span style="color:${matColor}">⬤ ${MATURITY_LABELS[p.maturityLevel].split('—')[0].trim()}</span>
                    <div class="hud3d-mat-track"><div class="hud3d-mat-fill" style="width:${matPct}%;background:${matColor}"></div></div>
                </div>
                <div class="hud3d-props">${propsHtml}</div>
                <div class="hud3d-status">${badges}</div>
            `;

            _hudContainer.appendChild(card);

            // Money change animation
            const prev = _lastMoney[p.id];
            if (prev !== undefined && prev !== p.money) {
                const diff = p.money - prev;
                const changeEl = document.createElement('div');
                changeEl.className = 'hud3d-money-change';
                changeEl.style.color = diff > 0 ? '#8ae37f' : '#ff4747';
                changeEl.textContent = `${diff > 0 ? '+' : ''}$${diff.toLocaleString('pt-BR')}`;
                card.appendChild(changeEl);
                setTimeout(() => changeEl.remove(), 1600);
            }
            _lastMoney[p.id] = p.money;
        });
    },

    _resolveVarColor(v) {
        const map = {
            'var(--color-cipa)': '#4caf50',
            'var(--color-aet)': '#8d6e63',
            'var(--color-pca)': '#42a5f5',
            'var(--color-pcmso)': '#ef5350',
            'var(--color-pgr)': '#ff7043',
            'var(--color-ltcat)': '#7e57c2',
            'var(--color-ppp)': '#26c6da',
            'var(--color-brigada)': '#ffa726',
            'var(--color-pce)': '#8f603c',
            'var(--color-gestao)': '#1c1c1c',
        };
        return map[v] || '#555';
    },

    showAction(text, color = '#40a2ff') {
        if (!_feedContainer) return;
        const item = document.createElement('div');
        item.className = 'action-feed-item';
        item.style.borderColor = color;
        item.textContent = text;
        _feedContainer.appendChild(item);
        // Auto-remove after animation
        setTimeout(() => item.remove(), 3200);
        // Limit visible items
        while (_feedContainer.children.length > 4) {
            _feedContainer.removeChild(_feedContainer.firstChild);
        }
    },

    dispose() {
        if (_hudContainer) _hudContainer.remove();
        if (_feedContainer) _feedContainer.remove();
        _hudContainer = null;
        _feedContainer = null;
        _lastMoney = {};
    }
};
