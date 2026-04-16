import { BOARD_DATA, LEVEL_RENT_MULTIPLIERS } from '../data/boardData.js';
import { sleep } from '../utils/helpers.js';
import { JuiceFX } from '../utils/JuiceFX.js';
import { SoundManager } from '../utils/SoundManager.js';
import { isBotAutoSelectActive, BotManager } from '../models/BotManager.js';
import { DiceLogic } from '../utils/DiceLogic.js';

// ── 3D mode delegation ──────────────────────────────────
// When window._SST_3D is set, visual functions delegate to 3D orchestrator
function _get3D() { return window._SST_3D || null; }

// Rastreia a casa ativa de cada jogador para destaque visual
let _activeSpaceId = null;

export function createBoardElement() {
    if (_get3D()) { _get3D().createBoard(); return; }
    const boardContainer = document.getElementById('board');
    if(!boardContainer) return;
    boardContainer.innerHTML = '';

    BOARD_DATA.forEach((space, index) => {
        const div = document.createElement('div');
        div.className = 'board-space';
        div.id = `space-${index}`;
        
        let row, col, directionClass = '';
        
        // --- AS REGRAS E CAMINHOS EM MATRIZ MONOPOLY CLÁSSICO 11X11 
        if (index === 0) { col = 11; row = 11; } // INICIO BR
        else if (index > 0 && index < 10) { col = 11 - index; row = 11; directionClass = 'space-bottom'; }
        else if (index === 10) { col = 1; row = 11; } // PRISAO BL
        else if (index > 10 && index < 20) { col = 1; row = 11 - (index - 10); directionClass = 'space-left'; }
        else if (index === 20) { col = 1; row = 1; } // SIPAT TL
        else if (index > 20 && index < 30) { col = 1 + (index - 20); row = 1; directionClass = 'space-top'; }
        else if (index === 30) { col = 11; row = 1; } // APORTE TR
        else { col = 11; row = 1 + (index - 30); directionClass = 'space-right'; }
        
        div.style.gridColumn = col;
        div.style.gridRow = row;

        if (directionClass) div.classList.add(directionClass);

        let content = '';

        // Adiciona classe CSS baseada no tipo da casa
        if (space.type === 'sesmt') div.classList.add('sesmt-space');
        if (space.type === 'tax') div.classList.add('tax-space');

        if (space.type === 'sesmt') {
            content = `<div class="inner-text sesmt-space-inner">
                         <span class="sesmt-icon">${space.icon || '🧑'}</span>
                         <span class="sesmt-name">${space.name}</span>
                         <div class="rent-display" id="rent-${index}"></div>
                       </div>`;
        }
        else if (space.type === 'property') {
            const colorHead = `<div class="space-color-header" style="background-color: ${space.color}"></div>`;
            
            // Nome formatado: programa em negrito, subtítulo abaixo
            let mainName = space.name;
            let subName = '';
            if (space.name.includes('—')) {
                const parts = space.name.split('—');
                mainName = parts[0].trim();
                subName = parts[1].trim();
            }
            const subHtml = subName ? `<div class="prop-subname">${subName}</div>` : '';
            
            const valOrName = `<div class="inner-text">
                                 <div class="prop-name">${space.icon ? space.icon : ''} ${mainName}</div>
                                 ${subHtml}
                                 <div class="rent-display" id="rent-${index}"></div>
                               </div>`;
            content = colorHead + valOrName;
        } 
        else if (space.type === 'corner') {
            div.classList.add('board-corner');
            content = `<div class="corner-text">${space.name}</div>`;
        } 
        else if (space.type === 'card') {
            // Casas de carta SST — interrogação estilo Banco Imobiliário
            div.classList.add('card-space');
            content = `<div class="inner-text card-space-inner">
                         <span class="card-question-mark">❓</span>
                         <span style="font-weight:900; font-size:8px">${space.name}</span>
                       </div>`;
        }
        else {
            // Auditoria e outros tipos especiais
            content = `<div class="inner-text"><h2>${space.icon}</h2><br><span style="font-weight:900;">${space.name}</span></div>`;
        }

        // Camadas Extras
        div.innerHTML = content + `<div class="owner-badge" id="badge-${index}"></div><div class="token-zone" id="zone-${index}"></div>`;
        boardContainer.appendChild(div);
    });

    // Fundo Marca D'água Oco! 
    const waterMark = document.createElement('div');
    waterMark.id = 'center-logo';
    waterMark.innerHTML = '<div class="banco-logo">🏦Banco SST</div>';
    boardContainer.appendChild(waterMark);

    // Container para animação de dados
    const diceOverlay = document.createElement('div');
    diceOverlay.id = 'dice-anim-overlay';
    diceOverlay.style.display = 'none';
    diceOverlay.innerHTML = `
        <div class="dice-3d" id="dice-3d-1"><div class="dice-pips"></div></div>
        <div class="dice-3d" id="dice-3d-2"><div class="dice-pips"></div></div>
    `;
    waterMark.appendChild(diceOverlay);

    // Auto-scale do tabuleiro para caber no viewport em mobile
    _scaleBoardToFit();
    window.addEventListener('resize', _scaleBoardToFit);
    window.addEventListener('orientationchange', () => {
        // Delay para o browser atualizar innerWidth/innerHeight após girar
        setTimeout(_scaleBoardToFit, 150);
    });
}

/** Calcula e aplica transform:scale no board para caber na tela (portrait e landscape) */
function _scaleBoardToFit() {
    const board = document.getElementById('board');
    if (!board) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const isMobile = vw <= 900 || vh <= 900;

    if (!isMobile) {
        board.style.transform = '';
        board.style.marginBottom = '';
        board.style.marginRight = '';
        return;
    }

    // Medir tamanho natural do board (CSS pode mudar via media queries)
    const prevT = board.style.transform;
    const prevMB = board.style.marginBottom;
    const prevMR = board.style.marginRight;
    board.style.transform = 'none';
    board.style.marginBottom = '0';
    board.style.marginRight = '0';
    const NATIVE_W = board.scrollWidth;
    const NATIVE_H = board.scrollHeight;
    board.style.transform = prevT;
    board.style.marginBottom = prevMB;
    board.style.marginRight = prevMR;

    const NATIVE_SIZE = Math.max(NATIVE_W, NATIVE_H);

    let scale;
    if (isLandscape) {
        scale = Math.min(1, (vh - 8) / NATIVE_SIZE);
    } else {
        scale = Math.min(1, (vw - 4) / NATIVE_SIZE);
    }

    const shrinkH = -NATIVE_H * (1 - scale);
    const shrinkW = -NATIVE_W * (1 - scale);
    board.style.transform = `scale(${scale})`;
    board.style.marginBottom = `${shrinkH}px`;

    if (isLandscape) {
        board.style.transformOrigin = 'top left';
        board.style.marginRight = `${shrinkW}px`;
    } else {
        board.style.transformOrigin = 'top center';
        board.style.marginRight = '';
    }
}

export function spawnTokensOnBoard(players) {
    if (_get3D()) { _get3D().spawnTokens(players); return; }
    const space0Zone = document.getElementById('zone-0');
    if(!space0Zone) return;
    space0Zone.innerHTML = '';
    
    players.forEach(p => {
        const t = document.createElement('div');
        t.className = 'player-token epi-token token-idle';
        t.id = `tkn-${p.id}`;
        t.style.backgroundColor = p.color;
        t.style.color = '#fff';
        t.style.setProperty('--token-color', p.color);
        t.innerHTML = p.pawnSvg || p.icon;
        space0Zone.appendChild(t);
    });
}

export async function animateTokenHop(player, fromId, spacesToMove) {
    if (_get3D()) { await _get3D().animateTokenHop(player, fromId, spacesToMove); return; }
    const token = document.getElementById(`tkn-${player.id}`);
    if (!token) return;

    // Remove idle + interditado durante movimento
    token.classList.remove('juice-jailed', 'token-idle');
    token.classList.add('token-moving');

    // Limpa destaque da casa anterior
    clearActiveSpace();

    // Transição suave entre casas
    token.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)';

    for (let step = 1; step <= spacesToMove; step++) {
        let tempId = fromId + step;
        if (tempId > 39) tempId -= 40;

        // Trail: destaca casa percorrida
        JuiceFX.trailSpace(tempId);

        const zone = document.getElementById(`zone-${tempId}`);
        if (zone) zone.appendChild(token);

        SoundManager.play('step', step, spacesToMove, step, spacesToMove);
        token.style.transform = 'scale(1.35) translateY(-18px)';
        await sleep(180);
        token.style.transform = 'scale(1) translateY(0)';
        await sleep(140);
    }

    // Remove transição inline e moving class
    token.style.transition = '';
    token.classList.remove('token-moving');
    token.classList.add('token-idle');

    // Som + efeito de chegada
    SoundManager.play('land');
    JuiceFX.bounce(token);
    setActiveSpace(player.position);

    if (player.interdictionTurns > 0) {
        token.classList.add('juice-jailed');
        token.classList.remove('token-idle');
    }
}

/** Marca visualmente a casa onde o jogador ativo está */
export function setActiveSpace(spaceId) {
    if (_get3D()) { _get3D().setActiveSpace(spaceId); return; }
    clearActiveSpace();
    _activeSpaceId = spaceId;
    const el = document.getElementById(`space-${spaceId}`);
    if (el) el.classList.add('space-active');
}

/** Remove o destaque de casa ativa */
export function clearActiveSpace() {
    if (_get3D()) { _get3D().clearActiveSpace(); return; }
    if (_activeSpaceId !== null) {
        const prev = document.getElementById(`space-${_activeSpaceId}`);
        if (prev) prev.classList.remove('space-active');
        _activeSpaceId = null;
    }
}

/** Destaca token do jogador ativo e remove de outros */
export function setActiveToken(activePlayerId, allPlayers) {
    if (_get3D()) { _get3D().setActiveToken(activePlayerId, allPlayers); return; }
    allPlayers.forEach(p => {
        const tkn = document.getElementById(`tkn-${p.id}`);
        if (!tkn) return;
        if (p.id === activePlayerId) {
            tkn.classList.add('token-active-glow');
        } else {
            tkn.classList.remove('token-active-glow');
        }
    });
}

export function setSpaceOwnerTagDisplayHTMLBadgeVisual(indexSpaceId, colorStrIdHexPlay, level) {
    if (_get3D()) { _get3D().setSpaceOwner(indexSpaceId, colorStrIdHexPlay, level); return; }
    const bg = document.getElementById(`badge-${indexSpaceId}`);
    if (!bg) return;
    bg.style.display         = 'flex';
    bg.style.backgroundColor = colorStrIdHexPlay;
    const lvl = level || 1;
    // Nível 1: só bandeira. Nível 2+: bandeira + ícone do nível ao lado (50% menor)
    const lvlIcons = { 2: '📋', 3: '⚙️', 4: '🏆' };
    let html = `<span title="Nível ${lvl}">🚩</span>`;
    if (lvl >= 2 && lvlIcons[lvl]) {
        html += `<span style="font-size:150%;margin-left:1px" title="Nível ${lvl}">${lvlIcons[lvl]}</span>`;
    }
    bg.innerHTML = html;
    JuiceFX.pulse(bg);
}

// Adiciona badge SIPAT visível na casa do tabuleiro
export function setSipatBadgeOnSpace(spaceId) {
    if (_get3D()) { _get3D().setSipatBadge(spaceId); return; }
    const spaceEl = document.getElementById(`space-${spaceId}`);
    if (!spaceEl) return;
    // Evita duplicar
    if (spaceEl.querySelector('.sipat-badge')) return;
    const badge = document.createElement('div');
    badge.className = 'sipat-badge';
    badge.innerHTML = '⭐';
    badge.title     = 'SIPAT — Multiplicador ativo!';
    spaceEl.appendChild(badge);
    JuiceFX.pulse(badge);
}

// Remove badge SIPAT de uma casa do tabuleiro
export function removeSipatBadgeFromSpace(spaceId) {
    if (_get3D()) { _get3D().removeSipatBadge(spaceId); return; }
    const spaceEl = document.getElementById(`space-${spaceId}`);
    if (!spaceEl) return;
    const badge = spaceEl.querySelector('.sipat-badge');
    if (badge) badge.remove();
}

/**
 * Atualiza o display de aluguel de uma casa no tabuleiro.
 * Se level é 0 ou rent é 0, limpa o display (propriedade sem dono).
 */
export function updateSpaceRentDisplay(spaceId, baseRent, level) {
    const space = BOARD_DATA[spaceId];

    // Compute rent text
    let rentValue = '';
    if (space && space.type === 'sesmt' && baseRent > 0) {
        rentValue = '$100';
    } else if (level && level > 0 && baseRent) {
        const currentRent = baseRent * (LEVEL_RENT_MULTIPLIERS[level] || 1);
        rentValue = `$${currentRent}`;
    }

    // 3D mode: update texture
    if (_get3D()) {
        _get3D().updateSpaceInfo(spaceId, rentValue);
        return;
    }

    // 2D mode: update rent-display (inside inner-text, below card name)
    const el = document.getElementById(`rent-${spaceId}`);
    if (!el) return;
    if (!rentValue) {
        el.textContent = '';
        return;
    }
    el.innerHTML = `<span class="rent-line">Aluguel</span><span class="rent-val">${rentValue}</span>`;
}

/**
 * Ativa seleção direta no tabuleiro: destaca as casas elegíveis e
 * retorna uma Promise que resolve com o spaceId clicado.
 * @param {number[]} eligibleIds — IDs das casas que podem ser clicadas
 * @returns {Promise<number>}
 */
export function enableBoardSpaceSelection(eligibleIds) {
    // In 3D mode, use raycasting to pick spaces on the actual board
    if (_get3D()) {
        return new Promise(resolve => {
            // Show hint banner
            const banner = document.createElement('div');
            banner.className = 'board-select-3d-overlay';
            banner.innerHTML = `
                <div class="board-select-3d-hint" style="
                    position:fixed; top:18px; left:50%; transform:translateX(-50%);
                    background:rgba(0,0,0,0.85); border:2px solid #f1dd38;
                    border-radius:12px; padding:10px 24px; z-index:9999;
                    color:#f1dd38; font-weight:700; font-size:15px;
                    pointer-events:none; text-align:center;
                    box-shadow: 0 4px 24px rgba(241,221,56,0.25);
                    animation: pulse-hint 1.5s ease-in-out infinite;
                ">👆 Clique na casa desejada no tabuleiro</div>`;
            document.body.appendChild(banner);

            const orch = _get3D();
            orch.enableSpacePicking(eligibleIds).then(id => {
                banner.remove();
                SoundManager.play('click');
                resolve(id);
            });

            // Bot auto-select
            if (isBotAutoSelectActive() && eligibleIds.length > 0) {
                const bestId = BotManager.chooseBestSpace(eligibleIds);
                setTimeout(() => {
                    // Simulate picking for bot — remove banner and resolve
                    banner.remove();
                    resolve(bestId);
                }, 9000);
            }
        });
    }

    return new Promise(resolve => {
        const handlers = [];

        const cleanup = () => {
            handlers.forEach(({ el, handler }) => {
                el.classList.remove('space-selectable');
                el.removeEventListener('click', handler);
            });
        };

        eligibleIds.forEach(id => {
            const el = document.getElementById(`space-${id}`);
            if (!el) return;
            el.classList.add('space-selectable');
            const handler = (e) => {
                e.stopPropagation();
                SoundManager.play('click');
                cleanup();
                resolve(id);
            };
            el.addEventListener('click', handler);
            handlers.push({ el, handler });
        });

        // Bot auto-select: escolhe estrategicamente e espera 9s
        if (isBotAutoSelectActive() && eligibleIds.length > 0) {
            const bestId = BotManager.chooseBestSpace(eligibleIds);
            setTimeout(() => {
                const el = document.getElementById(`space-${bestId}`);
                if (el) el.click();
            }, 9000);
        }
    });
}

// Layout de pips (pontos) para cada face do dado
// Grid 3x3: posições TL TC TR  ML MC MR  BL BC BR → 1=pip, 0=vazio
const PIP_LAYOUTS = {
    1: [0,0,0, 0,1,0, 0,0,0],
    2: [0,0,1, 0,0,0, 1,0,0],
    3: [0,0,1, 0,1,0, 1,0,0],
    4: [1,0,1, 0,0,0, 1,0,1],
    5: [1,0,1, 0,1,0, 1,0,1],
    6: [1,0,1, 1,0,1, 1,0,1],
};

function renderPips(container, value) {
    const layout = PIP_LAYOUTS[value] || PIP_LAYOUTS[1];
    container.innerHTML = layout.map(on =>
        `<span class="pip${on ? '' : ' pip-empty'}"></span>`
    ).join('');
}

/**
 * Anima dois dados 3D sobre o tabuleiro e resolve quando terminam.
 * @param {number} d1 - resultado dado 1 (1-6)
 * @param {number} d2 - resultado dado 2 (1-6)
 * @param {boolean} isDouble
 * @returns {Promise<void>}
 */
export async function animateDiceOnBoard(d1 = null, d2 = null, isDouble = null) {
    if (_get3D()) { return await _get3D().animateDice(d1, d2); }
    // 2D fallback — generate values if not provided
    if (d1 === null) {
        const roll = DiceLogic.roll();
        d1 = roll.d1;
        d2 = roll.d2;
        isDouble = roll.isDouble;
    }
    if (isDouble === null) isDouble = d1 === d2;

    const overlay = document.getElementById('dice-anim-overlay');
    const die1 = document.getElementById('dice-3d-1');
    const die2 = document.getElementById('dice-3d-2');
    if (!overlay || !die1 || !die2) return { d1, d2, total: d1 + d2, isDouble };

    overlay.style.display = 'flex';

    // Focus nos dados
    JuiceFX.enableFocus(overlay.parentElement);

    const pips1 = die1.querySelector('.dice-pips');
    const pips2 = die2.querySelector('.dice-pips');

    // Fase 1: tumble rápido com desaceleração
    die1.classList.add('dice-tumble');
    die2.classList.add('dice-tumble');
    die2.style.animationDelay = '0.1s';

    let interval = 60;
    const shuffles = [];
    const startShuffle = () => {
        const id = setInterval(() => {
            renderPips(pips1, Math.floor(Math.random() * 6) + 1);
            renderPips(pips2, Math.floor(Math.random() * 6) + 1);
        }, interval);
        shuffles.push(id);
        return id;
    };

    let shuffleId = shuffles.push(startShuffle());

    // Desaceleração progressiva
    await sleep(300);
    shuffles.forEach(clearInterval);
    interval = 120;
    shuffleId = startShuffle();
    await sleep(250);
    shuffles.forEach(clearInterval);
    interval = 200;
    shuffleId = startShuffle();
    await sleep(200);
    shuffles.forEach(clearInterval);

    // Fase 2: revelar resultado final com impacto
    die1.classList.remove('dice-tumble');
    die2.classList.remove('dice-tumble');
    die2.style.animationDelay = '';
    renderPips(pips1, d1);
    renderPips(pips2, d2);
    die1.classList.add('dice-land');
    die2.classList.add('dice-land');

    // Screen shake ao pousar os dados
    JuiceFX.screenShake(isDouble ? 6 : 3, 250);

    if (isDouble) {
        die1.classList.add('dice-double-glow');
        die2.classList.add('dice-double-glow');
    }

    await sleep(700);

    // Limpa
    die1.classList.remove('dice-land', 'dice-double-glow');
    die2.classList.remove('dice-land', 'dice-double-glow');
    overlay.style.display = 'none';
    JuiceFX.disableFocus();
    return { d1, d2, total: d1 + d2, isDouble };
}