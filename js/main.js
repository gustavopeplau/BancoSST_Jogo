import { createBoardElement, spawnTokensOnBoard, setSpaceOwnerTagDisplayHTMLBadgeVisual, animateTokenHop, setActiveSpace, animateDiceOnBoard, setSipatBadgeOnSpace, removeSipatBadgeFromSpace, updateSpaceRentDisplay } from './ui/BoardManager.js';
import { GameEngine } from './models/Game.js';
import { ModalManager } from './ui/ModalManager.js';
import { SoundManager } from './utils/SoundManager.js';
import { globalBus } from './utils/EventBus.js';
import { GameEvents } from './models/ActionTypes.js';
import { NetworkManager } from './net/NetworkManager.js';
import { JuiceFX } from './utils/JuiceFX.js';
import { BOARD_DATA } from './data/boardData.js';
import { BotManager } from './models/BotManager.js';

import { Orchestrator3D } from './3d/Orchestrator3D.js';

window.SST_GLOBAL_GAME = null;
window.SST_EVENT_BUS   = globalBus;
window.SST_NET         = NetworkManager;

const PLAYER_DEFAULTS = [
    { placeholder: 'Jogador 1', color: '#1976d2', pawn: 'capacete' },
    { placeholder: 'Jogador 2', color: '#e91e63', pawn: 'luva' },
    { placeholder: 'Jogador 3', color: '#ff9800', pawn: 'bota' },
    { placeholder: 'Jogador 4', color: '#4caf50', pawn: 'colete' },
];

// SVGs compactos para os peões EPI (usados no tabuleiro e HUD)
const PAWN_SVGS = {
    capacete: `<svg viewBox="0 0 32 32" width="16" height="16"><path d="M4 22h24v3H4z" fill="currentColor" opacity=".8"/><path d="M7 22c0-6 3.5-12 9-12s9 6 9 12" fill="currentColor" opacity=".5"/><path d="M7 22c0-6 3.5-12 9-12s9 6 9 12" fill="none" stroke="currentColor" stroke-width="2"/><line x1="16" y1="10" x2="16" y2="22" stroke="currentColor" stroke-width="1.5" opacity=".4"/></svg>`,
    luva: `<svg viewBox="0 0 32 32" width="16" height="16"><path d="M11 28V16l-3-5V8h1.5L13 13l2-6h2l2 6 2-6h2l1 5v12H11z" fill="currentColor" opacity=".4"/><path d="M11 28V16l-3-5V8h1.5L13 13l2-6h2l2 6 2-6h2l1 5v12H11z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="11" y1="20" x2="24" y2="20" stroke="currentColor" stroke-width="1" opacity=".5"/></svg>`,
    bota: `<svg viewBox="0 0 32 32" width="16" height="16"><path d="M12 4v14l-6 4v3h20v-3l-4-2V4H12z" fill="currentColor" opacity=".4"/><path d="M12 4v14l-6 4v3h20v-3l-4-2V4H12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="6" y1="25" x2="26" y2="25" stroke="currentColor" stroke-width="2.5"/><line x1="12" y1="4" x2="22" y2="4" stroke="currentColor" stroke-width="2"/></svg>`,
    colete: `<svg viewBox="0 0 32 32" width="16" height="16"><path d="M8 5L4 9v18h8V5zm16 0l4 4v18h-8V5zM12 5v22h8V5z" fill="currentColor" opacity=".35"/><path d="M8 5L4 9v18h8V5zm16 0l4 4v18h-8V5zM12 5v22h8V5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="16" y1="5" x2="16" y2="27" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/><text x="16" y="18" text-anchor="middle" fill="currentColor" font-size="7" font-weight="bold">X</text></svg>`,
};

// Emojis temáticos EPI para o avatar HUD
const PAWN_EMOJI = { capacete: '⛑️', luva: '🧤', bota: '🥾', colete: '🦺' };

function getSelectedPawn(rowEl) {
    const sel = rowEl.querySelector('.pawn-btn.selected');
    return sel ? sel.dataset.pawn : PLAYER_DEFAULTS[0].pawn;
}

function hideLobbyAndBootRules(playerConfigs, onlineMode = false) {
    document.getElementById('lobby-screen').style.opacity = '0';
    setTimeout(() => { document.getElementById('lobby-screen').style.display = 'none'; }, 500);
    document.getElementById('game-wrapper').style.display = 'flex';

    // Inicializa áudio e modais
    SoundManager.init();
    ModalManager.init();

    // ── 3D Isometric Mode ──
    Orchestrator3D.init();
    window._SST_3D = Orchestrator3D;

    // Hide 2D panels in 3D mode
    const leftHud = document.getElementById('left-hud');
    const rightHud = document.getElementById('right-hud');
    if (leftHud) leftHud.style.display = 'none';
    if (rightHud) rightHud.style.display = 'none';

    createBoardElement();

    // Monta configs com cores, ícone SVG e emoji
    const configs = playerConfigs.map((pc, i) => ({
        name: pc.name,
        color: PLAYER_DEFAULTS[i].color,
        icon: PAWN_EMOJI[pc.pawn] || '🪖',
        pawnSvg: PAWN_SVGS[pc.pawn] || PAWN_SVGS.capacete,
        pawnType: pc.pawn,
    }));

    SST_GLOBAL_GAME = new GameEngine(configs);

    // Set game ref for 3D orchestrator
    if (Orchestrator3D.is3D) {
        Orchestrator3D.setGame(SST_GLOBAL_GAME);
    }

    // Em modo online, o GameEngine NÃO reabilita o botão automaticamente
    if (onlineMode) {
        SST_GLOBAL_GAME.autoEnableRollButton = false;
    }

    spawnTokensOnBoard(SST_GLOBAL_GAME.players);

    // ── Debug: loga todos os eventos do jogo no console ──
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.search.includes('debug')) {
        const allEvents = Object.values(GameEvents);
        allEvents.forEach(evt => {
            globalBus.on(evt, (data) => console.log(`%c[SST] ${evt}`, 'color:#40a2ff;font-weight:bold', data));
        });
    }

    // In 3D mode, use 3D UI controls; fallback to 2D
    const btnRoll      = Orchestrator3D.is3D 
        ? (document.getElementById('btn-roll-3d') || document.getElementById('btn-roll'))
        : document.getElementById('btn-roll');
    const diceResultEl = Orchestrator3D.is3D
        ? (document.getElementById('dice-result-3d') || document.getElementById('dice-result'))
        : document.getElementById('dice-result');

    // Glow inicial no botão
    btnRoll.classList.add('btn-turn-glow');

    if (onlineMode) {
        // ── MODO ONLINE: cada jogador executa sua vez localmente ──

        // Mostra o chat in-game
        const gameChat = document.getElementById('game-chat');
        if (gameChat) gameChat.style.display = '';

        // Chat in-game: enviar mensagens
        const gameChatInput = document.getElementById('game-chat-input');
        const btnGameChatSend = document.getElementById('btn-game-chat-send');
        function sendGameChat() {
            const text = gameChatInput.value.trim();
            if (!text) return;
            NetworkManager.sendChat(text);
            gameChatInput.value = '';
        }
        if (btnGameChatSend) btnGameChatSend.addEventListener('click', sendGameChat);
        if (gameChatInput) gameChatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendGameChat();
        });

        btnRoll.onclick = () => {
            if (!NetworkManager.isMyTurn(SST_GLOBAL_GAME.currentPlayerIndex)) return;
            if (SST_GLOBAL_GAME.isAnimating) return;
            // Jogador ativo executa localmente — vê animações, modais, etc.
            SST_GLOBAL_GAME.handleTurnRoll(btnRoll, diceResultEl);
        };

        // ── ALERTA ao sair/atualizar a página ──
        window._sstOnlineActive = true;
        window.addEventListener('beforeunload', (e) => {
            if (window._sstOnlineActive && NetworkManager.isOnline) {
                e.preventDefault();
                e.returnValue = 'Você está em uma partida online. Se sair, um bot assumirá seu lugar e você não poderá voltar. Deseja realmente sair?';
                return e.returnValue;
            }
        });

        // Quando o jogador confirma a saída, o beforeunload já disparou.
        // Usamos o evento 'unload' para enviar o leave ao servidor via beacon.
        window.addEventListener('unload', () => {
            if (window._sstOnlineActive && NetworkManager.isOnline && NetworkManager.socket) {
                // Usa sendBeacon como fallback para garantir que a mensagem chegue
                const url = (window.BANCOSST_SERVER_URL || window.location.origin) + '/api/player-leave';
                const data = JSON.stringify({
                    roomCode: NetworkManager.roomCode,
                    socketId: NetworkManager.socket.id,
                });
                navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
            }
        });

        setupOnlineGameSync(btnRoll, diceResultEl);
    } else {
        // ── MODO LOCAL: lógica direta (sem rede) ──
        btnRoll.onclick = () => SST_GLOBAL_GAME.handleTurnRoll(btnRoll, diceResultEl);

        // ── LOG LOCAL: registra eventos de jogo no chat/log ──
        const game = SST_GLOBAL_GAME;
        const _p = (data) => {
            const pl = data?.playerId != null ? game.players.find(p => p.id === data.playerId) : null;
            return { n: pl?.name || '', c: pl?.color || '#40a2ff', i: pl?.icon || '' };
        };
        globalBus.on(GameEvents.PROPERTY_BOUGHT, (d) => {
            const { n, c, i } = _p(d);
            addChatMessage('Jogo', c, `${i} ${n} comprou ${d.type === 'sesmt' ? 'profissional SESMT' : 'propriedade'} por $${d.price}`);
        });
        globalBus.on(GameEvents.RENT_PAID, (d) => {
            const payer = game.players.find(p => p.id === d.payerId);
            const owner = game.players.find(p => p.id === d.ownerId);
            if (payer && owner) {
                addChatMessage('Jogo', '#ff9800', `${payer.icon} ${payer.name} pagou $${d.amount} de aluguel para ${owner.icon} ${owner.name}`);
            }
        });
        globalBus.on(GameEvents.CARD_DRAWN, (d) => {
            const { n, c, i } = _p(d);
            addChatMessage('Jogo', c, `${i} ${n} tirou uma carta SST!`);
        });
        globalBus.on(GameEvents.INTERDICTION_START, (d) => {
            const { n } = _p(d);
            addChatMessage('Jogo', '#ff4747', `⛓️ ${n} foi interditado!`);
        });
        globalBus.on(GameEvents.INTERDICTION_FREE, (d) => {
            const { n } = _p(d);
            addChatMessage('Jogo', '#4caf50', `✅ ${n} saiu da interdição! (${d.reason})`);
        });
        globalBus.on(GameEvents.MATURITY_CHANGED, (d) => {
            const { n } = _p(d);
            addChatMessage('Jogo', '#f1dd38', `⭐ ${n} subiu para Maturidade Nível ${d.level}!`);
        });
        globalBus.on(GameEvents.PLAYER_ELIMINATED, (d) => {
            const { n } = _p(d);
            addChatMessage('Jogo', '#ff4747', `💀 ${n} foi eliminado!`);
        });
        globalBus.on(GameEvents.SIPAT_ACTIVATED, (d) => {
            const { n } = _p(d);
            const sp = BOARD_DATA[d.spaceId];
            addChatMessage('Jogo', '#f1dd38', `🎉 ${n} ativou SIPAT em ${sp?.name || '?'}! Aluguel dobrado!`);
        });
        globalBus.on(GameEvents.PROPERTY_SOLD, (d) => {
            const { n, c, i } = _p(d);
            addChatMessage('Jogo', c, `${i} ${n} vendeu propriedade por $${d.sellPrice}`);
        });
        globalBus.on(GameEvents.DICE_ROLLED, (d) => {
            const { n, c, i } = _p(d);
            addChatMessage('Jogo', c, `${i} ${n} tirou [${d.d1} + ${d.d2}] = ${d.total}${d.isDouble ? ' (DUPLA!)' : ''}`);
        });
        globalBus.on(GameEvents.PASSED_START, (d) => {
            const { n, i } = _p(d);
            addChatMessage('Jogo', '#8ae37f', `${i} ${n} passou pelo INÍCIO +$500`);
        });
        globalBus.on(GameEvents.TURN_ENDED, (d) => {
            const next = game.players[game.currentPlayerIndex];
            if (next) addChatMessage('Jogo', next.color, `Vez de ${next.icon} ${next.name}`);
        });
    }

    SST_GLOBAL_GAME.updateUI();

    // Inicia BGM
    SoundManager.startMusic();
}

// ═══════════════════════════════════════════════════════════
// NAVEGAÇÃO DO LOBBY (painéis Local / Online)
// ═══════════════════════════════════════════════════════════

function showPanel(panelId) {
    ['lobby-mode-select', 'lobby-local', 'lobby-online'].forEach(id => {
        document.getElementById(id).style.display = id === panelId ? '' : 'none';
    });
}

function setupOnlinePawnSelector() {
    const btns = document.querySelectorAll('#online-pawn-selector .pawn-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
}

function getOnlinePawn() {
    const sel = document.querySelector('#online-pawn-selector .pawn-btn.selected');
    return sel ? sel.dataset.pawn : 'capacete';
}

function showOnlineError(msg) {
    const el = document.getElementById('online-error');
    el.textContent = msg;
    el.style.display = msg ? '' : 'none';
}

function setOnlineConnecting(show) {
    document.getElementById('online-connecting').style.display = show ? '' : 'none';
}

function renderRoomPlayers(players) {
    const list = document.getElementById('room-players-list');
    list.innerHTML = players.map(p => `
        <div class="room-player-row" style="border-left:4px solid ${p.color}">
            <span class="room-player-pawn">${PAWN_EMOJI[p.pawn] || '🪖'}</span>
            <span class="room-player-name">${p.name}</span>
            ${p.isHost ? '<span class="room-player-host">👑 Host</span>' : ''}
            ${!p.connected ? '<span class="room-player-dc">⚠ Desconectado</span>' : ''}
        </div>
    `).join('');
}

function addChatMessage(name, color, text) {
    // Envia para o chat do lobby (se existir) E para o chat in-game (se existir) E para o log 3D
    ['chat-messages', 'game-chat-messages', 'game-log-3d-messages'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'chat-msg';
        div.innerHTML = `<strong style="color:${color}">${name}:</strong> ${text}`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    });
}

function showBotTakeoverToast(playerName) {
    const existing = document.querySelector('.bot-toast');
    if (existing) existing.remove();
    const safeName = playerName.replace(/[<>"&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;','&':'&amp;'}[c]));
    const overlay = document.createElement('div');
    overlay.className = 'bot-toast';
    overlay.innerHTML = `
        <div class="bot-toast-box">
            <div class="bot-toast-icon">🤖</div>
            <div class="bot-toast-title">Bot Assumiu o Controle</div>
            <div class="bot-toast-msg"><strong>${safeName}</strong> deixou a partida.<br>Um <em>Bot especialista em SST</em> assumirá seu lugar e continuará jogando!</div>
            <button class="bot-toast-btn">Entendido</button>
        </div>`;
    document.body.appendChild(overlay);
    const btn = overlay.querySelector('.bot-toast-btn');
    const dismiss = () => {
        overlay.classList.add('bot-toast-fadeout');
        setTimeout(() => overlay.remove(), 300);
    };
    btn.onclick = dismiss;
    // Auto-dismiss após 3 segundos
    setTimeout(() => { if (document.body.contains(overlay)) dismiss(); }, 3000);
}

function showOnlineRoom(roomCode) {
    document.getElementById('online-choice').style.display = 'none';
    document.getElementById('online-room').style.display = '';
    document.getElementById('room-code-display').textContent = roomCode;
    if (NetworkManager.isHost) {
        document.getElementById('btn-start-online').style.display = '';
    }
}

// ═══════════════════════════════════════════════════════════
// SINCRONIZAÇÃO ONLINE (durante o jogo)
// ═══════════════════════════════════════════════════════════

/** Teleporta todos os tokens para as posições corretas (clientes após snapshot) */
function syncTokenPositions(players) {
    if (window._SST_3D) {
        window._SST_3D.syncTokenPositions(players);
        return;
    }
    players.forEach(p => {
        const token = document.getElementById(`tkn-${p.id}`);
        if (!token) return;
        // Não interrompe tokens que ainda estão animando
        if (token.classList.contains('token-moving')) return;
        const zone = document.getElementById(`zone-${p.position}`);
        if (zone && token.parentElement !== zone) {
            zone.appendChild(token);
        }
        token.classList.toggle('juice-jailed', p.interdictionTurns > 0);
    });
}

/** Sincroniza badges de propriedade no tabuleiro */
function syncPropertyBadges(game) {
    for (const [spaceId, owner] of Object.entries(game.propertyOwnersDb)) {
        if (owner) {
            const sid = parseInt(spaceId);
            const level = owner.propertyLevels ? (owner.propertyLevels[sid] || 0) : 0;
            setSpaceOwnerTagDisplayHTMLBadgeVisual(sid, owner.color, level);
            const sp = BOARD_DATA[sid];
            if (sp) updateSpaceRentDisplay(sid, sp.rent, level);
            // Restaura badge SIPAT
            if (owner.sipatSpaceId === sid) {
                setSipatBadgeOnSpace(sid);
            }
        }
    }
}

function setupOnlineGameSync(btnRoll, diceResultEl) {
    const game = SST_GLOBAL_GAME;
    let _isReceivingRemoteData = false;
    let _rollCheckInterval = null;
    let _lastSyncReceivedAt = 0;

    // ── Monkey-patch ModalManager para broadcast automático de modais ──
    const _originalOpen  = ModalManager._open.bind(ModalManager);
    const _originalClose = ModalManager.closeModal.bind(ModalManager);

    ModalManager._open = function(title, html) {
        _originalOpen(title, html);
        if (!_isReceivingRemoteData && (NetworkManager.isMyTurn(game.currentPlayerIndex) || _botRunning)) {
            NetworkManager.sendGameEvent({ event: GameEvents.MODAL_SHOW, data: { title, html } });
        }
    };

    ModalManager.closeModal = function() {
        _originalClose();
        if (!_isReceivingRemoteData && (NetworkManager.isMyTurn(game.currentPlayerIndex) || _botRunning)) {
            NetworkManager.sendGameEvent({ event: GameEvents.MODAL_CLOSED, data: {} });
        }
    };

    // ── Controle de turno: habilita/desabilita botão conforme a vez ──
    function updateRollButton() {
        const myTurn = NetworkManager.isMyTurn(game.currentPlayerIndex);
        const canRoll = myTurn && !game.isAnimating;
        btnRoll.disabled = !canRoll;
        btnRoll.classList.toggle('btn-turn-glow', canRoll);
        btnRoll.classList.toggle('roll-hidden', !canRoll);
        btnRoll.title = myTurn ? 'Sua vez! Clique para rolar.' : 'Aguardando outro jogador...';

        // Se é minha vez mas isAnimating ainda está true, checa periodicamente
        if (myTurn && game.isAnimating && !_rollCheckInterval) {
            _rollCheckInterval = setInterval(() => {
                if (!game.isAnimating) {
                    clearInterval(_rollCheckInterval);
                    _rollCheckInterval = null;
                    btnRoll.disabled = false;
                    btnRoll.classList.add('btn-turn-glow');
                    btnRoll.classList.remove('roll-hidden');
                    btnRoll.title = 'Sua vez! Clique para rolar.';
                }
            }, 200);
            // Safety: para de checar após 10s
            setTimeout(() => {
                if (_rollCheckInterval) {
                    clearInterval(_rollCheckInterval);
                    _rollCheckInterval = null;
                    // Força habilitação se for minha vez
                    if (NetworkManager.isMyTurn(game.currentPlayerIndex)) {
                        game.isAnimating = false;
                        btnRoll.disabled = false;
                        btnRoll.classList.add('btn-turn-glow');
                        btnRoll.classList.remove('roll-hidden');
                    }
                }
            }, 10000);
        }
    }
    updateRollButton();

    // ══════════════════════════════════════════════════════
    // TODOS OS JOGADORES: broadcast de eventos durante SUA vez
    // ══════════════════════════════════════════════════════

    const VISUAL_EVENTS = [
        GameEvents.DICE_ROLLED,
        GameEvents.DICE_DOUBLE,
        GameEvents.DICE_TRIPLE_DOUBLE,
        GameEvents.PLAYER_MOVING,
        GameEvents.PLAYER_LANDED,
        GameEvents.PASSED_START,
        GameEvents.PROPERTY_BOUGHT,
        GameEvents.PROPERTY_UPGRADED,
        GameEvents.RENT_PAID,
        GameEvents.CARD_DRAWN,
        GameEvents.CARD_RESOLVED,
        GameEvents.INTERDICTION_START,
        GameEvents.INTERDICTION_FREE,
        GameEvents.INTERDICTION_FAIL,
        GameEvents.MATURITY_CHANGED,
        GameEvents.PLAYER_ELIMINATED,
        GameEvents.SIPAT_ACTIVATED,
        GameEvents.PROPERTY_SOLD,
        GameEvents.TURN_ENDED,
        GameEvents.QUIZ_STARTED,
        GameEvents.QUIZ_ANSWERED,
    ];

    VISUAL_EVENTS.forEach(evt => {
        globalBus.on(evt, (data) => {
            if (_isReceivingRemoteData) return;
            NetworkManager.sendGameEvent({ event: evt, data });
        });
    });

    // Após qualquer mudança de estado local, envia snapshot para sincronizar
    globalBus.on(GameEvents.STATE_CHANGED, () => {
        if (!_isReceivingRemoteData) {
            NetworkManager.sendSync(game.getSnapshot());
        }
        setTimeout(() => updateRollButton(), 50);
    });

    // ══════════════════════════════════════════════════════
    // RECEBER: snapshot de outro jogador
    // ══════════════════════════════════════════════════════

    globalBus.on('net:gameSync', (snapshot) => {
        _isReceivingRemoteData = true;
        _lastSyncReceivedAt = Date.now();
        game.loadSnapshot(snapshot);
        game.updateUI();
        syncTokenPositions(game.players);
        syncPropertyBadges(game);
        _isReceivingRemoteData = false;
        updateRollButton();
        // Fecha modal espectador ao receber sync (novo turno)
        if (ModalManager.overlay.classList.contains('spectator-mode')) {
            _originalClose();
            ModalManager.overlay.classList.remove('spectator-mode');
        }
        // NÃO dispara bot aqui — deixa o executor primário agir via TURN_ENDED/playerBecameBot
    });

    // ══════════════════════════════════════════════════════
    // RECEBER: eventos visuais de outro jogador
    // ══════════════════════════════════════════════════════

    globalBus.on('net:gameEvent', (payload) => {
        _isReceivingRemoteData = true;
        const { event, data } = payload;

        if (event === GameEvents.MODAL_SHOW) {
            // Mostra modal em modo espectador (somente leitura)
            _originalOpen(data.title, data.html);
            const activePlayer = game.players[game.currentPlayerIndex];
            ModalManager.actionsDiv.innerHTML = '';
            const footer = document.createElement('div');
            footer.className = 'spectator-footer';
            footer.innerHTML = `<span class="spectator-eye">👁️</span> Aguardando ${activePlayer?.icon || ''} <b>${activePlayer?.name || 'jogador'}</b>...`;
            ModalManager.actionsDiv.appendChild(footer);
            ModalManager.overlay.classList.add('spectator-mode');
        } else if (event === GameEvents.MODAL_CLOSED) {
            _originalClose();
            ModalManager.overlay.classList.remove('spectator-mode');
        } else {
            handleRemoteVisualEvent(event, data, diceResultEl);
        }

        _isReceivingRemoteData = false;

        // Se o evento remoto indica troca de turno para um bot, dispara execução
        if (event === GameEvents.TURN_ENDED && data?.nextPlayerIndex != null) {
            const nextP = game.players[data.nextPlayerIndex];
            if (nextP && nextP.isBot && !_botRunning) {
                setTimeout(() => triggerBotExecution(btnRoll, diceResultEl), 600);
            }
        }
    });

    // ══════════════════════════════════════════════════════
    // FEEDBACK DE CONEXÃO
    // ══════════════════════════════════════════════════════

    globalBus.on('net:playerDisconnected', (data) => {
        addChatMessage('Sistema', '#ff5252', `${data.playerName} desconectou.`);
    });

    globalBus.on('net:playerReconnected', (data) => {
        addChatMessage('Sistema', '#4caf50', `${data.playerName} reconectou!`);
    });

    globalBus.on('net:disconnected', () => {
        btnRoll.disabled = true;
        btnRoll.classList.add('roll-hidden');
        btnRoll.title = 'Desconectado do servidor...';
    });

    globalBus.on('net:reconnected', () => {
        updateRollButton();
    });

    // ══════════════════════════════════════════════════════
    // BOT: jogador saiu e bot assumiu seu lugar
    // ══════════════════════════════════════════════════════

    globalBus.on('net:playerBecameBot', (data) => {
        const { playerIndex, playerName } = data;
        addChatMessage('Sistema', '#ff9800', `🤖 ${playerName} saiu do jogo. Um bot assumiu o controle.`);

        // ── Toast visual proeminente ──────────────────────────
        showBotTakeoverToast(playerName);

        // Marca jogador como bot no estado local
        if (game.players[playerIndex]) {
            game.players[playerIndex].isBot = true;
            game.players[playerIndex].name = `🤖 ${game.players[playerIndex].name}`;
            game.updateUI();
        }

        // Se o jogador que saiu estava no meio do turno, limpa estado completamente
        if (game.currentPlayerIndex === playerIndex) {
            game.isAnimating = false;
            // Fecha qualquer modal que possa estar travado (ex: askToBuy, quiz)
            try { ModalManager.closeModal(); } catch (_) {}
        }

        // Dispara bot imediatamente (aguarda modal fechar)
        setTimeout(() => triggerBotExecution(btnRoll, diceResultEl), 300);
    });

    // Quando o turno muda, verifica se o próximo jogador é um bot
    globalBus.on(GameEvents.TURN_ENDED, () => {
        setTimeout(() => triggerBotExecution(btnRoll, diceResultEl), 600);
    });

    // Quando rola dupla (não emite TURN_ENDED), o bot precisa rolar de novo
    globalBus.on(GameEvents.DICE_DOUBLE, () => {
        setTimeout(() => triggerBotExecution(btnRoll, diceResultEl), 1000);
    });

    // Fallback BACKUP: a cada 3s, verifica se o bot está parado.
    // Só dispara backup se NÃO recebemos sync de outro client recentemente
    // (indicando que outro client já está executando o bot).
    let _backupMissCount = 0;
    setInterval(() => {
        if (game.gameOver || _botRunning) { _backupMissCount = 0; return; }
        const cur = game.getCurrentPlayer();
        if (cur && cur.isBot) {
            // Se recebemos sync recente (<25s), outro client está executando
            const timeSinceSync = Date.now() - _lastSyncReceivedAt;
            if (timeSinceSync < 25000) {
                _backupMissCount = 0;
                return;
            }
            _backupMissCount++;
            // Primeiras tentativas: respeita executor primário
            // Após 10 misses (30s sem sync): qualquer humano pode executar
            if (_backupMissCount >= 2) {
                game.isAnimating = false;
                const useBackup = _backupMissCount >= 10;
                console.log(`[BOT] Fallback: bot parado (miss=${_backupMissCount}, syncAge=${Math.round(timeSinceSync/1000)}s, backup=${useBackup})`);
                executeBotTurnIfNeeded(btnRoll, diceResultEl, useBackup);
            }
        } else {
            _backupMissCount = 0;
        }
    }, 3000);
}

// Evita que dois bots rodem ao mesmo tempo
let _botRunning = false;
// Cleanup global dos patches do ModalManager (mantido entre turnos)
let _botCleanup = null;

/**
 * Dispara execução do bot como executor primário (com retry se isAnimating).
 */
function triggerBotExecution(btnRoll, diceResultEl) {
    const game = SST_GLOBAL_GAME;
    if (!game || game.gameOver) return;

    const cur = game.getCurrentPlayer();
    if (!cur || !cur.isBot) return;

    if (_botRunning) {
        // Já está executando, agenda retry rápido
        setTimeout(() => triggerBotExecution(btnRoll, diceResultEl), 500);
        return;
    }

    if (game.isAnimating) {
        // Espera isAnimating limpar (até 6 tentativas = 3s, depois força)
        let attempts = 0;
        const check = () => {
            attempts++;
            if (!game.isAnimating) {
                executeBotTurnIfNeeded(btnRoll, diceResultEl, false);
            } else if (attempts < 6) {
                setTimeout(check, 500);
            } else {
                // Força clear e executa
                console.warn('[BOT] isAnimating stuck, forçando reset.');
                game.isAnimating = false;
                executeBotTurnIfNeeded(btnRoll, diceResultEl, false);
            }
        };
        setTimeout(check, 500);
        return;
    }

    executeBotTurnIfNeeded(btnRoll, diceResultEl, false);
}

/**
 * Ativa os patches do ModalManager para o bot, se ainda não estão ativos.
 */
function ensureBotPatches() {
    if (!_botCleanup) {
        _botCleanup = BotManager.enableAutoRespond(ModalManager);
    }
    BotManager.activateAutoSelect();
}

/**
 * Remove os patches do ModalManager, restaurando o comportamento normal.
 */
function clearBotPatches() {
    if (_botCleanup) {
        _botCleanup();
        _botCleanup = null;
    }
}

/**
 * Determina o executor primário do bot: jogador humano de menor índice.
 * Todos os clients calculam o mesmo resultado — sem race conditions.
 */
function getPrimaryBotExecutor(game) {
    for (let i = 0; i < game.players.length; i++) {
        const p = game.players[i];
        if (!p.eliminated && !p.isBot) return i;
    }
    return -1; // Todos são bots ou eliminados
}

/**
 * Executa o turno do bot. 
 * isBackup=false: só o executor primário (menor índice humano) executa.
 * isBackup=true: qualquer humano pode executar (fallback de segurança).
 */
async function executeBotTurnIfNeeded(btnRoll, diceResultEl, isBackup) {
    const game = SST_GLOBAL_GAME;
    if (!game || game.gameOver || _botRunning) return;

    const currentPlayer = game.getCurrentPlayer();
    if (!currentPlayer || !currentPlayer.isBot) {
        clearBotPatches();
        return;
    }

    // Em modo online, verifica permissão para executar
    if (NetworkManager.isOnline) {
        const me = game.players[NetworkManager.playerId];
        if (!me || me.eliminated || me.isBot) return;

        if (!isBackup) {
            // Executor primário: menor índice humano
            const primaryIdx = getPrimaryBotExecutor(game);
            if (NetworkManager.playerId !== primaryIdx) return;
        }
    }

    // Limpa estado stuck
    game.isAnimating = false;
    _botRunning = true;

    // Fecha qualquer modal que possa estar aberto/travado de turno anterior
    try {
        if (ModalManager.overlay && ModalManager.overlay.classList.contains('active')) {
            ModalManager.closeModal();
            await new Promise(r => setTimeout(r, 150));
        }
    } catch (_) {}

    // Safety timeout: se _botRunning ficar stuck por 5min, força reset
    // (turnos de bot podem durar até 3min com 15s por ação)
    const safetyTimer = setTimeout(() => {
        if (_botRunning) {
            console.warn('[BOT] Safety timeout 5min — forçando reset.');
            _botRunning = false;
            game.isAnimating = false;
        }
    }, 300000);

    console.log(`[BOT] Executando turno de ${currentPlayer.name} | executor=${NetworkManager.playerId} backup=${isBackup}`);
    addChatMessage('Sistema', '#ff9800', `🤖 ${currentPlayer.name} está jogando automaticamente...`);

    // Ativa auto-resposta do ModalManager e auto-select de tiles
    ensureBotPatches();

    try {
        // Loop de duplas: enquanto for o mesmo jogador (dupla), rola de novo
        let safety = 0;
        do {
            const idBefore = game.currentPlayerIndex;
            BotManager.activateAutoSelect();
            await game.handleTurnRoll(btnRoll, diceResultEl);
            safety++;
            // Se o turno avançou (não é dupla) ou jogo acabou, sai do loop
            if (game.gameOver || game.currentPlayerIndex !== idBefore || safety >= 5) break;
            // Espera breve antes de rolar dupla
            console.log(`[BOT] Dupla detectada, rolando novamente...`);
            await new Promise(r => setTimeout(r, 800));
        } while (true);
    } catch (e) {
        console.error('[BOT] Erro durante turno bot:', e);
    }

    clearTimeout(safetyTimer);
    _botRunning = false;

    // Verifica se o próximo jogador também é bot (encadeamento)
    if (!game.gameOver) {
        const next = game.getCurrentPlayer();
        if (next && next.isBot) {
            setTimeout(() => triggerBotExecution(btnRoll, diceResultEl), 800);
        } else {
            clearBotPatches();
        }
    } else {
        clearBotPatches();
    }
}

// ═══════════════════════════════════════════════════════════
// FEEDBACK VISUAL REMOTO (clientes veem o que o host faz)
// ═══════════════════════════════════════════════════════════

function handleRemoteVisualEvent(event, data, diceResultEl) {
    const game = SST_GLOBAL_GAME;
    if (!game) return;
    const player = data?.playerId != null ? game.players.find(p => p.id === data.playerId) : null;
    const pName = player ? player.name : '';
    const pColor = player ? player.color : '#40a2ff';
    const pIcon = player ? player.icon : '';

    switch (event) {
        case GameEvents.DICE_ROLLED:
            diceResultEl.innerHTML =
                `<span class="juice-spin">🎲</span> ${pIcon} ${pName}: [${data.d1} + ${data.d2}] = <strong>${data.total}</strong>`;
            SoundManager.play('dice');
            animateDiceOnBoard(data.d1, data.d2, data.isDouble);
            break;

        case GameEvents.DICE_DOUBLE:
            diceResultEl.innerHTML +=
                `<br><span style="color:#f1dd38">🎲🎲 ${pName} tirou DUPLA! Joga novamente!</span>`;
            SoundManager.play('double');
            break;

        case GameEvents.DICE_TRIPLE_DOUBLE:
            diceResultEl.innerHTML +=
                `<br><span style="color:#ff4747">⛓️ ${pName}: 3 DUPLAS! Interdição!</span>`;
            SoundManager.play('interdict');
            JuiceFX.screenShake(6, 400);
            break;

        case GameEvents.PLAYER_MOVING: {
            // Anima o token do jogador remoto pulando pelas casas
            const movingPlayer = game.players.find(p => p.id === data.playerId);
            if (movingPlayer) {
                movingPlayer.position = data.to;
                animateTokenHop(movingPlayer, data.from, data.steps);
            }
            break;
        }

        case GameEvents.PLAYER_LANDED:
            setActiveSpace(data.position);
            break;

        case GameEvents.PASSED_START:
            diceResultEl.innerHTML +=
                `<br><span style="color:#8ae37f">${pIcon} ${pName} +$500 Salário!</span>`;
            break;

        case GameEvents.PROPERTY_BOUGHT:
            addChatMessage('Jogo', pColor,
                `${pIcon} ${pName} comprou ${data.type === 'sesmt' ? 'profissional SESMT' : 'propriedade'} por $${data.price}`);
            SoundManager.play('buy');
            // Atualiza badge visual no tabuleiro
            if (data.spaceId != null) {
                const boughtPlayer = game.players.find(p => p.id === data.playerId);
                const boughtLevel = boughtPlayer?.propertyLevels?.[data.spaceId] || 1;
                setSpaceOwnerTagDisplayHTMLBadgeVisual(data.spaceId, pColor, boughtLevel);
                const sp = BOARD_DATA[data.spaceId];
                if (sp) updateSpaceRentDisplay(data.spaceId, sp.rent, boughtLevel);
            }
            break;

        case GameEvents.PROPERTY_UPGRADED: {
            const spaceName = BOARD_DATA[data.spaceId]?.name || '';
            addChatMessage('Jogo', pColor,
                `${pIcon} ${pName} evoluiu ${spaceName} para Nível ${data.level} por $${data.cost}`);
            SoundManager.play('buy');
            const upgPlayer = game.players.find(p => p.id === data.playerId);
            if (data.spaceId != null) {
                setSpaceOwnerTagDisplayHTMLBadgeVisual(data.spaceId, pColor, data.level);
                const sp2 = BOARD_DATA[data.spaceId];
                if (sp2) updateSpaceRentDisplay(data.spaceId, sp2.rent, data.level);
            }
            break;
        }

        case GameEvents.RENT_PAID: {
            const payer = game.players.find(p => p.id === data.payerId);
            const owner = game.players.find(p => p.id === data.ownerId);
            addChatMessage('Jogo', '#ff9800',
                `${payer?.icon || ''} ${payer?.name || ''} pagou $${data.rent} a ${owner?.icon || ''} ${owner?.name || ''}`);
            break;
        }

        case GameEvents.CARD_DRAWN:
            addChatMessage('Jogo', pColor, `${pIcon} ${pName} tirou uma carta SST!`);
            SoundManager.play('card');
            break;

        case GameEvents.INTERDICTION_START:
            addChatMessage('Jogo', '#ff4747', `⛓️ ${pName} foi interditado!`);
            SoundManager.play('interdict');
            JuiceFX.screenShake(5, 300);
            break;

        case GameEvents.INTERDICTION_FREE:
            addChatMessage('Jogo', '#4caf50', `✅ ${pName} saiu da interdição! (${data.reason})`);
            break;

        case GameEvents.MATURITY_CHANGED:
            addChatMessage('Jogo', '#f1dd38', `⭐ ${pName} subiu para Maturidade Nível ${data.level}!`);
            JuiceFX.showLevelUp(`${pName}: Nível ${data.level}!`, '#f1dd38');
            break;

        case GameEvents.PLAYER_ELIMINATED:
            addChatMessage('Jogo', '#ff4747', `💀 ${pName} foi eliminado!`);
            SoundManager.play('interdict');
            break;

        case GameEvents.SIPAT_ACTIVATED:
            // Sincroniza BOARD_DATA: marca multiplicador SIPAT
            if (data.spaceId != null) {
                setSipatBadgeOnSpace(data.spaceId);
                const spaceName = BOARD_DATA[data.spaceId]?.name || '';
                addChatMessage('Jogo', '#f1dd38', `🎉 ${pName} ativou ⭐ SIPAT (${data.multiplier || ''}×) em ${spaceName}!`);
            }
            break;

        case GameEvents.PROPERTY_SOLD:
            if (data.spaceId != null) {
                // Sincroniza BOARD_DATA: remove SIPAT se presente
                BOARD_DATA[data.spaceId].sipatMultiplier = 1;
                // Remove badge do tabuleiro
                const badge = document.getElementById(`badge-${data.spaceId}`);
                if (badge) { badge.style.display = 'none'; badge.innerHTML = ''; }
                // Remove SIPAT badge
                removeSipatBadgeFromSpace(data.spaceId);
                // Limpa exibição de aluguel
                updateSpaceRentDisplay(data.spaceId, 0, 0);
                addChatMessage('Jogo', pColor, `${pIcon} ${pName} vendeu propriedade por $${data.sellPrice}`);
                SoundManager.play('loss');
            }
            break;

        case GameEvents.TURN_ENDED: {
            const nextPlayer = game.players[data?.nextPlayerIndex];
            if (nextPlayer) {
                JuiceFX.showTurnBanner(nextPlayer.name, nextPlayer.color, nextPlayer.icon);
                diceResultEl.innerHTML +=
                    `<br><span style="opacity:0.6; font-size:13px">Vez de: ${nextPlayer.icon} ${nextPlayer.name}</span>`;
                SoundManager.play('turnChange');
            }
            break;
        }

        case GameEvents.CARD_RESOLVED:
            if (data.card) {
                const amtColor = data.card.amount >= 0 ? '#8ae37f' : '#ff4747';
                const amtSign = data.card.amount >= 0 ? '+' : '';
                addChatMessage('Jogo', pColor,
                    `${pIcon} ${pName}: ${data.card.title} (${amtSign}$${Math.abs(data.card.amount)})`);
            }
            break;

        case GameEvents.QUIZ_STARTED:
            addChatMessage('Jogo', pColor, `${pIcon} ${pName} está respondendo um quiz SST! 🎓`);
            break;

        case GameEvents.QUIZ_ANSWERED:
            if (data.correct) {
                addChatMessage('Jogo', '#8ae37f', `${pIcon} ${pName} acertou o quiz! ✅`);
                SoundManager.play('correct');
            } else {
                addChatMessage('Jogo', '#ff4747', `${pIcon} ${pName} errou o quiz! ❌`);
                SoundManager.play('wrong');
            }
            break;

        case GameEvents.INTERDICTION_FAIL:
            addChatMessage('Jogo', '#ff4747', `⛓️ ${pName} tentou dupla e falhou... Ainda interditado.`);
            break;
    }
}

// ═══════════════════════════════════════════════════════════
// CONTROLES DE ÁUDIO
// ═══════════════════════════════════════════════════════════

function setupAudioControls() {
    // Support both 2D and 3D audio buttons
    const btnBgm = document.getElementById('btn-bgm-toggle') || document.getElementById('btn-bgm-toggle-3d');
    const btnSfx = document.getElementById('btn-sfx-toggle') || document.getElementById('btn-sfx-toggle-3d');
    const sliderMusic = document.getElementById('slider-music') || document.getElementById('slider-music-3d');
    const sliderSfx = document.getElementById('slider-sfx') || document.getElementById('slider-sfx-3d');

    // Also wire up 3D audio controls if they exist
    const btnBgm3d = document.getElementById('btn-bgm-toggle-3d');
    const btnSfx3d = document.getElementById('btn-sfx-toggle-3d');
    const sliderMusic3d = document.getElementById('slider-music-3d');
    const sliderSfx3d = document.getElementById('slider-sfx-3d');

    if (btnBgm) {
        btnBgm.onclick = () => {
            if (SoundManager._bgmPlaying) {
                SoundManager.stopMusic();
                btnBgm.classList.add('muted');
                btnBgm.textContent = '🎵';
            } else {
                SoundManager.startMusic();
                btnBgm.classList.remove('muted');
                btnBgm.textContent = '🎵';
            }
        };
    }
    if (btnSfx) {
        btnSfx.onclick = () => {
            SoundManager.enabled = !SoundManager.enabled;
            btnSfx.classList.toggle('muted', !SoundManager.enabled);
            btnSfx.textContent = SoundManager.enabled ? '🔊' : '🔇';
        };
    }
    if (sliderMusic) {
        sliderMusic.oninput = () => SoundManager.setMusicVolume(sliderMusic.value / 100);
    }
    if (sliderSfx) {
        sliderSfx.oninput = () => SoundManager.setSfxVolume(sliderSfx.value / 100);
    }

    // 3D controls (mirror the same logic)
    if (btnBgm3d && btnBgm3d !== btnBgm) {
        btnBgm3d.onclick = () => {
            if (SoundManager._bgmPlaying) { SoundManager.stopMusic(); btnBgm3d.classList.add('muted'); }
            else { SoundManager.startMusic(); btnBgm3d.classList.remove('muted'); }
        };
    }
    if (btnSfx3d && btnSfx3d !== btnSfx) {
        btnSfx3d.onclick = () => {
            SoundManager.enabled = !SoundManager.enabled;
            btnSfx3d.classList.toggle('muted', !SoundManager.enabled);
            btnSfx3d.textContent = SoundManager.enabled ? '🔊' : '🔇';
        };
    }
    if (sliderMusic3d && sliderMusic3d !== sliderMusic) {
        sliderMusic3d.oninput = () => SoundManager.setMusicVolume(sliderMusic3d.value / 100);
    }
    if (sliderSfx3d && sliderSfx3d !== sliderSfx) {
        sliderSfx3d.oninput = () => SoundManager.setSfxVolume(sliderSfx3d.value / 100);
    }
}

// ═══════════════════════════════════════════════════════════
// BOTÃO DE REGRAS — carrega e exibe REGRAS_DO_JOGO.md
// ═══════════════════════════════════════════════════════════

function setupRulesButton() {
    const btnRules = document.getElementById('btn-show-rules');
    const overlay = document.getElementById('rules-overlay');
    const content = document.getElementById('rules-content');
    const btnClose = document.getElementById('btn-close-rules');

    if (!btnRules || !overlay) return;

    btnRules.addEventListener('click', async () => {
        if (!content.dataset.loaded) {
            try {
                const resp = await fetch('REGRAS_DO_JOGO.md');
                const md = await resp.text();
                content.innerHTML = renderMarkdown(md);
                content.dataset.loaded = '1';
            } catch (e) {
                content.innerHTML = '<p style="color:#ff5252">Erro ao carregar as regras.</p>';
            }
        }
        overlay.style.display = 'flex';
    });

    btnClose.addEventListener('click', () => { overlay.style.display = 'none'; });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });

    // Links do sumário: scroll suave dentro do container de regras
    content.addEventListener('click', (e) => {
        const anchor = e.target.closest('.rules-anchor');
        if (!anchor) return;
        e.preventDefault();
        const targetId = anchor.dataset.target;
        const el = content.querySelector(`#${CSS.escape(targetId)}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

/** Converte Markdown básico para HTML (headings, tables, bold, italic, blockquotes, hr, links) */
function renderMarkdown(md) {
    let html = md
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, (_, title) => {
            // Gera ID compatível com GitHub-flavored markdown anchors
            const id = title.toLowerCase()
                .replace(/[^\p{L}\p{N} -]/gu, '') // remove emojis e símbolos
                .trim()
                .replace(/\s+/g, '-');
            return `<h2 id="${id}">${title}</h2>`;
        })
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^---$/gm, '<hr>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
            if (href.startsWith('#')) {
                const rawId = href.slice(1).replace(/^-+/, '');
                return `<a href="javascript:void(0)" class="rules-anchor" data-target="${rawId}">${text}</a>`;
            }
            return `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
        });

    // Tables
    const lines = html.split('\n');
    let out = '', inTable = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line.split('|').filter(c => c.trim() !== '');
            // Skip separator row (|---|---|)
            if (cells.every(c => /^[\s:-]+$/.test(c))) continue;
            if (!inTable) { out += '<table>'; inTable = true; }
            const isHeader = i + 1 < lines.length && /^\|[\s|:-]+\|$/.test(lines[i + 1].trim());
            const tag = isHeader ? 'th' : 'td';
            out += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
        } else {
            if (inTable) { out += '</table>'; inTable = false; }
            if (line === '') { out += '<br>'; }
            else if (!line.startsWith('<')) { out += `<p>${line}</p>`; }
            else { out += line; }
        }
    }
    if (inTable) out += '</table>';
    return out;
}

function setupLobby() {
    const countSelect = document.getElementById('player-count');
    const rows = document.querySelectorAll('.player-row');

    if (countSelect) {
        countSelect.addEventListener('change', () => {
            const n = parseInt(countSelect.value);
            rows.forEach((row, i) => {
                row.style.display = i < n ? '' : 'none';
            });
        });
    }

    // Pawn selection — toggle dentro de cada row
    rows.forEach(row => {
        const btns = row.querySelectorAll('.pawn-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupLobby();
    setupAudioControls();
    setupOnlinePawnSelector();
    setupRulesButton();

    // ═══════════════════════════════════════════════════════
    // NAVEGAÇÃO ENTRE PAINÉIS DO LOBBY
    // ═══════════════════════════════════════════════════════

    document.getElementById('btn-mode-local').addEventListener('click', () => showPanel('lobby-local'));
    document.getElementById('btn-mode-online').addEventListener('click', () => showPanel('lobby-online'));
    document.getElementById('btn-back-from-local').addEventListener('click', () => showPanel('lobby-mode-select'));
    document.getElementById('btn-back-from-online').addEventListener('click', () => {
        showPanel('lobby-mode-select');
        // Reseta estado online se tiver conectado mas não em jogo
        if (NetworkManager.connected && !NetworkManager.isOnline) {
            NetworkManager.disconnect();
        }
        showOnlineError('');
        document.getElementById('online-choice').style.display = '';
        document.getElementById('online-room').style.display = 'none';
        document.getElementById('join-code-area').style.display = 'none';
    });

    // ═══════════════════════════════════════════════════════
    // LOBBY LOCAL — Iniciar jogo local (existente)
    // ═══════════════════════════════════════════════════════

    document.getElementById('btn-start-game').addEventListener('click', () => {
        const count = parseInt(document.getElementById('player-count').value) || 2;
        const rows = document.querySelectorAll('#lobby-local .player-row');
        const configs = [];
        for (let i = 0; i < count; i++) {
            const row = rows[i];
            const nameInput = row.querySelector('.player-name-input');
            configs.push({
                name: nameInput.value.trim() || PLAYER_DEFAULTS[i].placeholder,
                pawn: getSelectedPawn(row),
            });
        }
        hideLobbyAndBootRules(configs, false);
    });

    // ═══════════════════════════════════════════════════════
    // LOBBY ONLINE — Criar sala
    // ═══════════════════════════════════════════════════════

    document.getElementById('btn-create-room').addEventListener('click', async () => {
        const playerName = document.getElementById('online-player-name').value.trim();
        if (!playerName) { showOnlineError('Digite seu nome.'); return; }

        showOnlineError('');
        setOnlineConnecting(true);
        try {
            await NetworkManager.connect();
            const response = await NetworkManager.createRoom(playerName, getOnlinePawn());
            sessionStorage.setItem('sst_player_name', playerName);
            setOnlineConnecting(false);
            showOnlineRoom(response.roomCode);
            if (response.room) renderRoomPlayers(response.room.players);
        } catch (err) {
            setOnlineConnecting(false);
            showOnlineError(err.message || 'Erro ao criar sala.');
        }
    });

    // ═══════════════════════════════════════════════════════
    // LOBBY ONLINE — Mostrar campo de código + Entrar na sala
    // ═══════════════════════════════════════════════════════

    document.getElementById('btn-join-room-show').addEventListener('click', () => {
        document.getElementById('join-code-area').style.display = '';
        document.getElementById('input-room-code').focus();
    });

    document.getElementById('btn-join-room').addEventListener('click', async () => {
        const playerName = document.getElementById('online-player-name').value.trim();
        const roomCode = document.getElementById('input-room-code').value.trim().toUpperCase();
        if (!playerName) { showOnlineError('Digite seu nome.'); return; }
        if (!roomCode || roomCode.length < 4) { showOnlineError('Digite o código da sala.'); return; }

        showOnlineError('');
        setOnlineConnecting(true);
        try {
            await NetworkManager.connect();
            const response = await NetworkManager.joinRoom(roomCode, playerName, getOnlinePawn());
            sessionStorage.setItem('sst_player_name', playerName);
            setOnlineConnecting(false);
            showOnlineRoom(response.roomCode);
            if (response.room) renderRoomPlayers(response.room.players);
        } catch (err) {
            setOnlineConnecting(false);
            showOnlineError(err.message || 'Erro ao entrar na sala.');
        }
    });

    // ═══════════════════════════════════════════════════════
    // LOBBY ONLINE — Copiar código da sala
    // ═══════════════════════════════════════════════════════

    document.getElementById('btn-copy-code').addEventListener('click', () => {
        const code = document.getElementById('room-code-display').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.getElementById('btn-copy-code');
            btn.textContent = '✅';
            setTimeout(() => { btn.textContent = '📋'; }, 1500);
        });
    });

    // ═══════════════════════════════════════════════════════
    // LOBBY ONLINE — Chat
    // ═══════════════════════════════════════════════════════

    function sendChatFromInput() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        NetworkManager.sendChat(text);
        input.value = '';
    }

    document.getElementById('btn-chat-send').addEventListener('click', sendChatFromInput);
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatFromInput();
    });

    globalBus.on('net:chatMessage', (data) => {
        addChatMessage(data.playerName, data.playerColor, data.text);
    });

    // ═══════════════════════════════════════════════════════
    // LOBBY ONLINE —Atualização de jogadores na sala
    // ═══════════════════════════════════════════════════════

    globalBus.on('net:roomUpdated', (roomState) => {
        renderRoomPlayers(roomState.players);
        const statusEl = document.getElementById('room-status');
        statusEl.textContent = `${roomState.players.length}/4 jogadores na sala`;

        // Host pode iniciar com 2+ jogadores
        const btnStart = document.getElementById('btn-start-online');
        if (NetworkManager.isHost && roomState.players.length >= 2) {
            btnStart.style.display = '';
        }
    });

    // ═══════════════════════════════════════════════════════
    // LOBBY ONLINE — Host inicia o jogo online
    // ═══════════════════════════════════════════════════════

    document.getElementById('btn-start-online').addEventListener('click', async () => {
        try {
            await NetworkManager.startGame();
        } catch (err) {
            showOnlineError(err.message || 'Erro ao iniciar partida.');
        }
    });

    // ═══════════════════════════════════════════════════════
    // RECEBEU game:start — Todos os clientes iniciam o jogo
    // ═══════════════════════════════════════════════════════

    globalBus.on('net:gameStart', (data) => {
        // Após embaralhamento, recalcula o playerId deste client
        // O server envia socketId para cada jogador na lista ordenada
        const mySocketId = NetworkManager.socket?.id;
        if (mySocketId) {
            const myNewIndex = data.players.findIndex(p => p.socketId === mySocketId);
            if (myNewIndex !== -1) {
                NetworkManager.playerId = myNewIndex;
                console.log(`[NET] Meu novo playerId após embaralhamento: ${myNewIndex}`);
            }
        }

        const playerConfigs = data.players.map(p => ({
            name: p.name,
            pawn: p.pawn,
        }));
        hideLobbyAndBootRules(playerConfigs, true);
    });
});