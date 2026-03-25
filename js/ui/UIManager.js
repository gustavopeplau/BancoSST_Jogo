import { BOARD_DATA, GROUP_SIZE } from '../data/boardData.js';
import { JuiceFX } from '../utils/JuiceFX.js';
import { SoundManager } from '../utils/SoundManager.js';

const MATURITY_LABELS = [
    'Sem Maturidade',
    'Nível 1 — Em Adequação',
    'Nível 2 — Empresa Reativa',
    'Nível 3 — Empresa com Segurança'
];
const MATURITY_COLORS   = ['#555', '#40a2ff', '#f1dd38', '#8ae37f'];
const MATURITY_BENEFITS = [
    '—',
    'Desconto de 15% em compras',
    'Desconto de 20% em compras + Aluguel +10%',
    'Desconto de 25% + Imunidade Fiscal (1×/rodada)'
];
const SESMT_INFO = {
    tecSeguranca:  { label: '👷 Téc. Segurança',  tip: '-50% nas Fiscalizações' },
    tecEnfermagem: { label: '🩺 Téc. Enfermagem', tip: '-50% nos Adoecimentos'  },
    engenheiro:    { label: '📐 Engenheiro SST',  tip: '-25% em PGR e LTCAT'    },
    medico:        { label: '🏥 Médico do Trab.', tip: '-25% em PCMSO e PCA'    },
    brigada:       { label: '🧯 Brigada Emerg.',  tip: '-50% nos Acidentes'     }
};

// Cache do último saldo conhecido de cada jogador (para animar mudanças)
const _lastMoney = {};

export class UIManager {

    static updatePlayerHUDsInfoInHTMLGlobalDisplayBaseDaGame(players, currentIndex) {
        const leftPanel  = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        if (!leftPanel || !rightPanel) return;

        // Distribui: metade esquerda, metade direita
        const half = Math.ceil(players.length / 2);
        const leftPlayers  = players.slice(0, half);
        const rightPlayers = players.slice(half);

        leftPanel.innerHTML = leftPlayers
            .map((p, i) => UIManager._buildCard(p, i === currentIndex))
            .join('');
        rightPanel.innerHTML = rightPlayers
            .map((p, i) => UIManager._buildCard(p, (i + half) === currentIndex))
            .join('');

        // Aplica animações de mudança de saldo após renderizar
        players.forEach(p => {
            const prev = _lastMoney[p.id];
            if (prev !== undefined && prev !== p.money) {
                const balEl = document.getElementById(`balance-${p.id}`);
                const cardEl = document.getElementById(`hud-card-${p.id}`);
                if (balEl && cardEl) {
                    const gained = p.money > prev;
                    JuiceFX._applyClass(cardEl, gained ? 'juice-money-gain' : 'juice-money-loss');
                    const diff = p.money - prev;
                    JuiceFX.floatNear(balEl,
                        `${diff > 0 ? '+' : ''}$${diff.toLocaleString('pt-BR')}`,
                        gained ? '#8ae37f' : '#ff4747'
                    );
                    SoundManager.play(gained ? 'gain' : 'loss');
                }
            }
            _lastMoney[p.id] = p.money;
        });
    }

    static _buildCard(player, isActive) {
        const matColor = MATURITY_COLORS[player.maturityLevel] || '#555';
        const border   = isActive ? `2px solid ${player.color}` : '1px solid rgba(255,255,255,0.08)';
        const bg       = isActive ? `rgba(${UIManager._hexToRgb(player.color)},0.1)` : 'rgba(0,0,0,0.25)';
        const activeClass = isActive ? 'hud-active-glow' : '';

        const badges = [
            isActive                     ? `<span class="turn-badge" style="background:${player.color}">▶ VEZ</span>` : '',
            player.interdictionTurns > 0 ? `<span class="status-badge interdiction-badge">⛓️</span>` : '',
            player.canChooseSpace        ? `<span class="status-badge aporte-badge">🚖</span>` : '',
            player.eliminated            ? `<span class="status-badge interdiction-badge">💀</span>` : ''
        ].filter(Boolean).join('');

        const matPct = Math.round((player.maturityLevel / 3) * 100);

        // Monopólios completos (grupo dot indicators)
        const completedGroups = [];
        for (const [group, size] of Object.entries(GROUP_SIZE)) {
            const owned = player.ownedPropertiesIds.filter(id => BOARD_DATA[id].group === group).length;
            if (owned >= size) {
                const sample = BOARD_DATA.find(s => s.group === group);
                completedGroups.push({ group, color: sample ? sample.color : '#555' });
            }
        }
        const completedHtml = completedGroups.length > 0
            ? `<div class="phud-groups-inline">${completedGroups.map(g =>
                `<span class="group-dot" style="background:${g.color}" title="✅ ${g.group}"></span>`
            ).join('')}</div>` : '';

        // ── Deck de programas agrupados por projeto ─────
        const groupedCards = {};
        player.ownedPropertiesIds.forEach(id => {
            const space = BOARD_DATA[id];
            const groupKey = space.group || (space.type === 'sesmt' ? '_sesmt' : '_other');
            if (!groupedCards[groupKey]) groupedCards[groupKey] = [];
            groupedCards[groupKey].push(space);
        });

        // SESMT avulsos (que não estão em ownedPropertiesIds)
        const sesmtExtras = player.sesmtOwned.filter(k =>
            !player.ownedPropertiesIds.some(id => BOARD_DATA[id].sesmt_key === k)
        );
        if (sesmtExtras.length > 0) {
            if (!groupedCards['_sesmt']) groupedCards['_sesmt'] = [];
            sesmtExtras.forEach(k => {
                const info = SESMT_INFO[k] || { label: k, tip: '' };
                groupedCards['_sesmt'].push({ name: info.label, color: '#546e7a', type: 'sesmt', price: 0, _tip: info.tip });
            });
        }

        let deckHtml = '';
        const groupKeys = Object.keys(groupedCards);
        if (groupKeys.length > 0) {
            const groupsHtml = groupKeys.map(gk => {
                const cards = groupedCards[gk];
                const isSesmtGroup = gk === '_sesmt';
                const groupSize = GROUP_SIZE[gk] || 0;
                const isComplete = !isSesmtGroup && groupSize > 0 && cards.length >= groupSize;
                const groupColor = cards[0].color || '#555';
                const groupClass = isComplete ? 'project-group project-complete' : 'project-group';
                const groupLabel = isSesmtGroup ? 'SESMT' : gk;

                const cardsHtml = cards.map(space => {
                    const label = space.name.includes('—')
                        ? space.name.split('—')[1].trim()
                        : (space.name.length > 20 ? space.name.slice(0, 19) + '…' : space.name);
                    const cls = space.type === 'sesmt' ? 'deck-chip deck-chip-sesmt' : 'deck-chip';
                    const tip = space._tip || `${space.name} — $${space.price}`;
                    return `<span class="${cls}" style="background:${space.color}" title="${tip}">${label}</span>`;
                }).join('');

                const progressHtml = !isSesmtGroup && groupSize > 0
                    ? `<span class="project-progress">${cards.length}/${groupSize}</span>` : '';
                const completeIcon = isComplete ? '<span class="project-complete-icon">✅</span>' : '';

                return `<div class="${groupClass}">
                    <div class="project-header" style="border-left-color:${groupColor}">
                        <span class="project-label">${groupLabel}</span>${progressHtml}${completeIcon}
                    </div>
                    <div class="project-cards">${cardsHtml}</div>
                </div>`;
            }).join('');
            deckHtml = `<div class="phud-deck-grouped">${groupsHtml}</div>`;
        } else {
            deckHtml = `<div class="phud-deck-grouped"><span class="phud-deck-empty">Sem programas</span></div>`;
        }

        const propCount = player.ownedPropertiesIds.length;

        return `
        <div class="player-hud-card ${activeClass}" id="hud-card-${player.id}" style="border:${border};background:${bg}">
            <div class="phud-row-main">
                <div class="phud-avatar-sm" style="color:${player.color};border-color:${isActive ? player.color : 'rgba(255,255,255,0.15)'}">${player.icon}</div>
                <div class="phud-info">
                    <div class="phud-name-line">
                        <span style="color:${player.color};font-weight:900;font-size:.85rem">${player.name}</span>
                        ${badges}
                    </div>
                    <div class="phud-stats-line">
                        <span class="phud-balance-value" id="balance-${player.id}" style="${player.money < 0 ? 'color:#ff4747' : ''}">$${player.money.toLocaleString('pt-BR')}</span>
                        <span class="phud-prop-count" title="${propCount} propriedade(s)">🏢${propCount}</span>
                        <span class="phud-mat-label" style="color:${matColor}" title="${MATURITY_BENEFITS[player.maturityLevel]}">⬤ ${MATURITY_LABELS[player.maturityLevel].split('—')[0].trim()}</span>
                    </div>
                    <div class="phud-maturity-row">
                        <div class="maturity-bar-track-sm"><div class="maturity-bar-fill-sm" style="width:${matPct}%;background:${matColor}"></div></div>
                        ${completedGroups.length > 0 ? completedGroups.map(g =>
                            `<span class="group-badge" style="background:${g.color}" title="✅ ${g.group} completo">${g.group}</span>`
                        ).join('') : ''}
                    </div>
                </div>
            </div>
            ${deckHtml}
        </div>`;
    }

    /** Atualiza o botão de ação com glow quando é o turno do jogador */
    static updateActionButton(btnEl, player) {
        if (!btnEl) return;
        btnEl.classList.toggle('btn-turn-glow', !btnEl.disabled);
        if (player) {
            btnEl.innerHTML = `${player.icon} Rolar e Inspecionar 🎲🎲`;
        }
    }

    static _hexToRgb(hex) {
        if (!hex || hex.length < 7) return '0,0,0';
        return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
    }
}