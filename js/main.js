import { createBoardElement, spawnTokensOnBoard, setSpaceOwnerTagDisplayHTMLBadgeVisual, animateTokenHop, setActiveSpace, animateDiceOnBoard, setSipatBadgeOnSpace } from './ui/BoardManager.js';
import { GameEngine } from './models/Game.js';
import { ModalManager } from './ui/ModalManager.js';
import { SoundManager } from './utils/SoundManager.js';
import { globalBus } from './utils/EventBus.js';
import { GameEvents } from './models/ActionTypes.js';
import { NetworkManager } from './net/NetworkManager.js';
import { JuiceFX } from './utils/JuiceFX.js';
import { BOARD_DATA } from './data/boardData.js';
import { BotManager } from './models/BotManager.js';

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
    capacete: `<svg viewBox="0 0 32 32" width="16" height="16"><path d="M6 22h20v3H6z" fill="currentColor"/><path d="M8 22c0-7 3-12 8-12s8 5 8 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="16" cy="12" r="2" fill="currentColor"/></svg>`,
    luva: `<svg viewBox="0 0 32 32" width="16" height="16"><path d="M10 28V14l-4-6v-2h2l4 5h0l2-5h2l2 5h0l2-5h2l2 5V28z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    bota: `<svg viewBox="0 0 32 32" width="16" height="16"><path d="M11 4v16l-5 4v4h20v-4l-3-2V4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="6" y1="24" x2="26" y2="24" stroke="currentColor" stroke-width="2"/></svg>`,
    colete: `<svg viewBox="0 0 32 32" width="16" height="16"><path d="M8 6l-4 4v16h8V6zm16 0l4 4v16h-8V6zM12 6v20h8V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="16" y1="6" x2="16" y2="26" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/></svg>`,
};

// Emojis de fallback para o HUD avatar
const PAWN_EMOJI = { capacete: '🪖', luva: '🧤', bota: '👢', colete: '🦺' };

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

    const btnRoll      = document.getElementById('btn-roll');
    const diceResultEl = document.getElementById('dice-result');

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
    // Envia para o chat do lobby (se existir) E para o chat in-game (se existir)
    ['chat-messages', 'game-chat-messages'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'chat-msg';
        div.innerHTML = `<strong style="color:${color}">${name}:</strong> ${text}`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    });
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
            setSpaceOwnerTagDisplayHTMLBadgeVisual(parseInt(spaceId), owner.color);
        }
    }
}

function setupOnlineGameSync(btnRoll, diceResultEl) {
    const game = SST_GLOBAL_GAME;
    let _isReceivingRemoteData = false;
    let _rollCheckInterval = null;

    // ── Monkey-patch ModalManager para broadcast automático de modais ──
    const _originalOpen  = ModalManager._open.bind(ModalManager);
    const _originalClose = ModalManager.closeModal.bind(ModalManager);

    ModalManager._open = function(title, html) {
        _originalOpen(title, html);
        if (!_isReceivingRemoteData && NetworkManager.isMyTurn(game.currentPlayerIndex)) {
            NetworkManager.sendGameEvent({ event: GameEvents.MODAL_SHOW, data: { title, html } });
        }
    };

    ModalManager.closeModal = function() {
        _originalClose();
        if (!_isReceivingRemoteData && NetworkManager.isMyTurn(game.currentPlayerIndex)) {
            NetworkManager.sendGameEvent({ event: GameEvents.MODAL_CLOSED, data: {} });
        }
    };

    // ── Controle de turno: habilita/desabilita botão conforme a vez ──
    function updateRollButton() {
        const myTurn = NetworkManager.isMyTurn(game.currentPlayerIndex);
        const canRoll = myTurn && !game.isAnimating;
        btnRoll.disabled = !canRoll;
        btnRoll.classList.toggle('btn-turn-glow', canRoll);
        btnRoll.title = myTurn ? 'Sua vez! Clique para rolar.' : 'Aguardando outro jogador...';

        // Se é minha vez mas isAnimating ainda está true, checa periodicamente
        if (myTurn && game.isAnimating && !_rollCheckInterval) {
            _rollCheckInterval = setInterval(() => {
                if (!game.isAnimating) {
                    clearInterval(_rollCheckInterval);
                    _rollCheckInterval = null;
                    btnRoll.disabled = false;
                    btnRoll.classList.add('btn-turn-glow');
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

        // Marca jogador como bot no estado local
        if (game.players[playerIndex]) {
            game.players[playerIndex].isBot = true;
            game.players[playerIndex].name = `🤖 ${game.players[playerIndex].name}`;
            game.updateUI();
        }

        // Se agora é a vez do bot, executa o turno do bot
        if (game.currentPlayerIndex === playerIndex && !game.isAnimating) {
            executeBotTurnIfNeeded(btnRoll, diceResultEl);
        }
    });

    // Quando o turno muda, verifica se o próximo jogador é um bot
    globalBus.on(GameEvents.TURN_ENDED, () => {
        setTimeout(() => executeBotTurnIfNeeded(btnRoll, diceResultEl), 500);
    });
}

/**
 * Se o jogador atual é um bot e este cliente é o próximo jogador humano conectado,
 * executa o turno do bot automaticamente.
 */
async function executeBotTurnIfNeeded(btnRoll, diceResultEl) {
    const game = SST_GLOBAL_GAME;
    if (!game || game.gameOver || game.isAnimating) return;

    const currentPlayer = game.getCurrentPlayer();
    if (!currentPlayer || !currentPlayer.isBot) return;

    // Determina quem deve executar o turno do bot:
    // O próximo jogador humano conectado (cyclic) executa.
    const myIndex = NetworkManager.playerId;
    const total = game.players.length;
    let executorIndex = -1;
    for (let i = 1; i <= total; i++) {
        const idx = (game.currentPlayerIndex + i) % total;
        const p = game.players[idx];
        if (!p.eliminated && !p.isBot) {
            executorIndex = idx;
            break;
        }
    }

    // Só executa se EU sou o executor designado
    if (executorIndex !== myIndex) return;

    console.log(`[BOT] Executando turno de ${currentPlayer.name} (bot) — executor: jogador ${myIndex}`);
    addChatMessage('Sistema', '#ff9800', `🤖 ${currentPlayer.name} está jogando automaticamente...`);

    // Ativa auto-resposta do ModalManager e auto-select de tiles
    const cleanup = BotManager.enableAutoRespond(ModalManager);
    BotManager.activateAutoSelect();

    // Executa o turno do bot (mesma lógica de handleTurnRoll)
    await game.handleTurnRoll(btnRoll, diceResultEl);

    // Limpa patches
    cleanup();

    // Verifica se o próximo jogador também é bot (encadeamento)
    setTimeout(() => executeBotTurnIfNeeded(btnRoll, diceResultEl), 1000);
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
            JuiceFX.showDice(data.d1, data.d2, data.isDouble);
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
                setSpaceOwnerTagDisplayHTMLBadgeVisual(data.spaceId, pColor);
            }
            break;

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
            // Sincroniza BOARD_DATA: marca aluguel dobrado
            if (data.spaceId != null) {
                BOARD_DATA[data.spaceId].doubledRent = true;
                setSipatBadgeOnSpace(data.spaceId);
                const spaceName = BOARD_DATA[data.spaceId]?.name || '';
                addChatMessage('Jogo', '#f1dd38', `🎉 ${pName} ativou SIPAT em ${spaceName}! Aluguel dobrado!`);
            }
            break;

        case GameEvents.PROPERTY_SOLD:
            if (data.spaceId != null) {
                // Sincroniza BOARD_DATA: remove aluguel dobrado
                if (BOARD_DATA[data.spaceId].doubledRent) {
                    BOARD_DATA[data.spaceId].doubledRent = false;
                }
                // Remove badge do tabuleiro
                const badge = document.getElementById(`badge-${data.spaceId}`);
                if (badge) { badge.style.display = 'none'; badge.innerHTML = ''; }
                // Remove SIPAT badge
                const spEl = document.getElementById(`space-${data.spaceId}`);
                if (spEl) {
                    const sipatBadge = spEl.querySelector('.sipat-badge');
                    if (sipatBadge) sipatBadge.remove();
                }
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
    }
}

// ═══════════════════════════════════════════════════════════
// CONTROLES DE ÁUDIO
// ═══════════════════════════════════════════════════════════

function setupAudioControls() {
    const btnBgm = document.getElementById('btn-bgm-toggle');
    const btnSfx = document.getElementById('btn-sfx-toggle');
    const sliderMusic = document.getElementById('slider-music');
    const sliderSfx = document.getElementById('slider-sfx');

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