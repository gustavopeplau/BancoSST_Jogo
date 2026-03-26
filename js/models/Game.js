import { BOARD_DATA, GROUP_SIZE, SESMT_KEYS, SIDE_GROUPS } from '../data/boardData.js';
import { Player } from './Player.js';
import { DiceLogic } from '../utils/DiceLogic.js';
import { animateTokenHop, setSpaceOwnerTagDisplayHTMLBadgeVisual, setSipatBadgeOnSpace, setActiveSpace, enableBoardSpaceSelection, animateDiceOnBoard, setActiveToken } from '../ui/BoardManager.js';
import { ModalManager } from '../ui/ModalManager.js';
import { pullRandomCard } from '../data/cardsData.js';
import { UIManager } from '../ui/UIManager.js';
import { JuiceFX } from '../utils/JuiceFX.js';
import { SoundManager } from '../utils/SoundManager.js';
import { sleep } from '../utils/helpers.js';
import { globalBus } from '../utils/EventBus.js';
import { GameEvents } from './ActionTypes.js';

const PLAYER_COLORS = ['#1976d2', '#e91e63', '#ff9800', '#4caf50'];
const PLAYER_ICONS  = ['👔', '👩🏼‍💻', '🏗️', '📋'];

export class GameEngine {
    /**
     * @param {Array<{name:string, color?:string, icon?:string}>} playerConfigs
     */
    constructor(playerConfigs) {
        this.players = playerConfigs.map((cfg, i) => 
            new Player(i + 1, cfg.name, cfg.color || PLAYER_COLORS[i], cfg.icon || PLAYER_ICONS[i], cfg.pawnSvg || '', cfg.pawnType || 'capacete')
        );
        this.currentPlayerIndex = 0;
        this.isAnimating        = false;
        this.propertyOwnersDb   = {}; // spaceId → Player
        this.consecutiveDoubles = 0;
        this.gameOver           = false;
        this.autoEnableRollButton = true; // false em modo online (controle externo)

        // EventBus para comunicação desacoplada (multiplayer-ready)
        this.bus = globalBus;
        this.bus.emit(GameEvents.GAME_STARTED, { players: this.players.map(p => p.toJSON()) });
    }

    // ═══════════════════════════════════════════════════════════
    // SERIALIZAÇÃO — Snapshot completo do estado para sync via rede
    // ═══════════════════════════════════════════════════════════

    /** Retorna snapshot JSON-safe de todo o estado do jogo */
    getSnapshot() {
        return {
            players: this.players.map(p => p.toJSON()),
            currentPlayerIndex: this.currentPlayerIndex,
            propertyOwnersDb: Object.fromEntries(
                Object.entries(this.propertyOwnersDb).map(([k, v]) => [k, v.id])
            ),
            consecutiveDoubles: this.consecutiveDoubles,
            gameOver: this.gameOver,
            isAnimating: this.isAnimating,
        };
    }

    /** Restaura o estado do jogo a partir de um snapshot (recebido pela rede) */
    loadSnapshot(snapshot) {
        this.players = snapshot.players.map(data => Player.fromJSON(data));
        this.currentPlayerIndex = snapshot.currentPlayerIndex;
        this.consecutiveDoubles = snapshot.consecutiveDoubles;
        this.gameOver = snapshot.gameOver;
        this.isAnimating = snapshot.isAnimating || false;
        this.propertyOwnersDb = {};
        for (const [spaceId, playerId] of Object.entries(snapshot.propertyOwnersDb)) {
            this.propertyOwnersDb[spaceId] = this.players.find(p => p.id === playerId);
        }
        this.bus.emit(GameEvents.STATE_CHANGED, this.getSnapshot());
    }

    /** Emite state changed e atualiza UI (helper interno) */
    _emitStateChanged() {
        this.bus.emit(GameEvents.STATE_CHANGED, this.getSnapshot());
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    /** Jogadores que ainda estão na partida (não eliminados) */
    getActivePlayers() {
        return this.players.filter(p => !p.eliminated);
    }

    updateUI() {
        UIManager.updatePlayerHUDsInfoInHTMLGlobalDisplayBaseDaGame(this.players, this.currentPlayerIndex);
        const btn = document.getElementById('btn-roll');
        UIManager.updateActionButton(btn, this.getCurrentPlayer());
        setActiveSpace(this.getCurrentPlayer().position);
        setActiveToken(this.getCurrentPlayer().id, this.players);
    }

    // ═══════════════════════════════════════════════════════════
    // PONTO DE ENTRADA DO TURNO
    // ═══════════════════════════════════════════════════════════
    async handleTurnRoll(btnDiceElement, uiTextResultElement) {
        if (this.isAnimating || this.gameOver) return;
        this.isAnimating = true;
        btnDiceElement.disabled = true;
        btnDiceElement.classList.remove('btn-turn-glow');

        // Inicializa o áudio no primeiro clique (requer user gesture)
        SoundManager.init();
        SoundManager.play('click');

        // Efeito de clique no botão (scale down + up)
        btnDiceElement.style.transform = 'scale(0.93)';
        await sleep(80);
        btnDiceElement.style.transform = '';

        const player = this.getCurrentPlayer();

        // Emite início de turno
        this.bus.emit(GameEvents.TURN_STARTED, { playerId: player.id, playerIndex: this.currentPlayerIndex });

        // Pula jogador eliminado (segurança extra)
        if (player.eliminated) {
            this.finishTurnSequenceRoutine(btnDiceElement, uiTextResultElement);
            return;
        }

        // Reset da imunidade fiscal por rodada (nível 3)
        player.fiscalizacaoImmunityUsed = false;

        // APORTE: jogador escolhe destino antes de rolar
        if (player.canChooseSpace) {
            player.canChooseSpace = false;
            await this.handleAporteChoice(player, uiTextResultElement);
            if (!this.gameOver) this.finishTurnSequenceRoutine(btnDiceElement, uiTextResultElement);
            return;
        }

        // INTERDIÇÃO: fluxo especial de saída
        if (player.interdictionTurns > 0) {
            await this.handleInterdictionTurn(player, btnDiceElement, uiTextResultElement);
            return;
        }

        // TURNO NORMAL
        await this.executeNormalRoll(player, btnDiceElement, uiTextResultElement);
    }

    // ═══════════════════════════════════════════════════════════
    // ROLAGEM NORMAL
    // ═══════════════════════════════════════════════════════════
    async executeNormalRoll(player, btnDiceElement, uiTextResultElement) {
        const diceInfo = DiceLogic.roll();

        // Som + animação visual dos dados no tabuleiro
        SoundManager.play('dice');
        uiTextResultElement.style.color = '#ffde59';
        uiTextResultElement.innerHTML = `<span class="dice-rolling">🎲</span> ROLANDO...`;

        // Anima dados 3D sobre o tabuleiro (aguarda ~1.3s)
        await animateDiceOnBoard(diceInfo.d1, diceInfo.d2, diceInfo.isDouble);

        // Emite resultado dos dados
        this.bus.emit(GameEvents.DICE_ROLLED, {
            playerId: player.id, d1: diceInfo.d1, d2: diceInfo.d2,
            total: diceInfo.total, isDouble: diceInfo.isDouble
        });

        // Exibe resultado com efeito visual
        JuiceFX.showDice(diceInfo.d1, diceInfo.d2, diceInfo.isDouble);
        uiTextResultElement.innerHTML =
            `<span class="juice-spin">🎲</span> [${diceInfo.d1} + ${diceInfo.d2}] = <strong>${diceInfo.total}</strong>`;
        uiTextResultElement.style.color = '#40a2ff';

        // Três duplas consecutivas → interdição imediata
        if (diceInfo.isDouble) {
            this.consecutiveDoubles++;
            if (this.consecutiveDoubles >= 3) {
                this.consecutiveDoubles = 0;
                this.bus.emit(GameEvents.DICE_TRIPLE_DOUBLE, { playerId: player.id });
                SoundManager.play('interdict');
                JuiceFX.screenShake(6, 400);
                uiTextResultElement.innerHTML +=
                    `<br><span style="color:#ff4747">⛓️ 3 DUPLAS! Interdição!</span>`;
                const originalPos = player.position;
                const steps = (10 - originalPos + 40) % 40 || 40;
                player.position = 10;
                player.interdictionTurns = 1;
                await animateTokenHop(player, originalPos, steps);
                await ModalManager.showOkPrompt(
                    '⛓️ Três Duplas Consecutivas!',
                    'Você tirou 3 duplas seguidas e foi <b>interditado</b> imediatamente!'
                );
                this.finishTurnSequenceRoutine(btnDiceElement, uiTextResultElement);
                return;
            }
        } else {
            this.consecutiveDoubles = 0;
        }

        const originalPos = player.position;
        const { passedStart } = player.move(diceInfo.total);
        if (passedStart) {
            this.bus.emit(GameEvents.PASSED_START, { playerId: player.id, bonus: 500 });
            uiTextResultElement.innerHTML +=
                `<br><span style="color:#8ae37f">+$500 Salário!</span>`;
        }

        this.bus.emit(GameEvents.PLAYER_MOVING, { playerId: player.id, from: originalPos, steps: diceInfo.total, to: player.position });
        await animateTokenHop(player, originalPos, diceInfo.total);
        this.bus.emit(GameEvents.PLAYER_LANDED, { playerId: player.id, position: player.position, space: BOARD_DATA[player.position] });
        await this.handleSpaceLogicEvent(player);

        if (this.gameOver) {
            this.isAnimating = false;
            return;
        }

        // Dupla: jogador joga de novo (sem avançar turno)
        if (diceInfo.isDouble && player.interdictionTurns === 0) {
            this.bus.emit(GameEvents.DICE_DOUBLE, { playerId: player.id });
            SoundManager.play('double');
            uiTextResultElement.innerHTML +=
                `<br><span style="color:#f1dd38">🎲🎲 DUPLA! Role de novo!</span>`;
            this.updateUI();
            if (this.autoEnableRollButton) {
                btnDiceElement.disabled = false;
                btnDiceElement.classList.add('btn-turn-glow');
            }
            this.isAnimating = false;
            this._emitStateChanged();
            return;
        }

        this.finishTurnSequenceRoutine(btnDiceElement, uiTextResultElement);
    }

    // ═══════════════════════════════════════════════════════════
    // APORTE DE CAPITAL (casa 30): escolha de destino no tabuleiro
    // ═══════════════════════════════════════════════════════════
    async handleAporteChoice(player, uiTextResultElement) {
        uiTextResultElement.innerHTML = `🚖 Aporte Ativo — clique na casa desejada no tabuleiro!`;
        
        // Todas as casas exceto a posição atual
        const eligibleIds = BOARD_DATA.map(s => s.id).filter(id => id !== player.position);
        
        await ModalManager.showOkPrompt(
            '🚖 Aporte de Capital',
            'Clique diretamente no tabuleiro na casa para onde deseja se mover!'
        );
        
        const chosenId = await enableBoardSpaceSelection(eligibleIds);
        const originalPos = player.position;

        if (chosenId !== null && chosenId !== undefined) {
            const steps = (chosenId - originalPos + 40) % 40 || 40;
            // Verifica se cruzou o INÍCIO (posição 0) para creditar salário
            const passedStart = chosenId <= originalPos && chosenId !== originalPos;
            if (passedStart) {
                player.money += 500;
                uiTextResultElement.innerHTML += `<br><span style="color:#8ae37f">+$500 Salário!</span>`;
            }
            player.position = chosenId;
            await animateTokenHop(player, originalPos, steps);
        }
        await this.handleSpaceLogicEvent(player);
    }

    // ═══════════════════════════════════════════════════════════
    // INTERDIÇÃO (casa 10): controle de saída
    // ═══════════════════════════════════════════════════════════
    async handleInterdictionTurn(player, btnDiceElement, uiTextResultElement) {
        // BRIGADA: sai grátis e ainda se move neste mesmo turno
        if (player.sesmtOwned.includes('brigada')) {
            await ModalManager.showOkPrompt(
                '🧯 Brigada de Emergência!',
                'Sua Brigada garantiu a liberação automática! Você sai sem custo e joga normalmente.'
            );
            player.interdictionTurns = 0;
            this.bus.emit(GameEvents.INTERDICTION_FREE, { playerId: player.id, reason: 'brigada' });
            this._emitStateChanged();
            await this.executeNormalRoll(player, btnDiceElement, uiTextResultElement);
            return;
        }

        // Com 2+ profissionais: liberação compulsória na 2ª tentativa
        const hasTwoPlusProfissionais = player.sesmtOwned.length >= 2;
        const maxAttempts = hasTwoPlusProfissionais ? 2 : 4;

        // Liberação compulsória (esgotou tentativas)
        if (player.interdictionTurns >= maxAttempts) {
            await ModalManager.showOkPrompt(
                '⛓️ Liberação Compulsória!',
                `Após ${maxAttempts} rodadas, você está automaticamente liberado! Role os dados.`
            );
            player.interdictionTurns = 0;
            this.bus.emit(GameEvents.INTERDICTION_FREE, { playerId: player.id, reason: 'compulsory' });
            this._emitStateChanged();
            await this.executeNormalRoll(player, btnDiceElement, uiTextResultElement);
            return;
        }

        // Apresenta opções ao jogador
        const action = await ModalManager.showInterdictionOptions(
            player, player.interdictionTurns, maxAttempts
        );

        if (action === 'pay') {
            if (player.money >= 500) {
                player.money -= 500;
                player.interdictionTurns = 0;
                this.bus.emit(GameEvents.INTERDICTION_FREE, { playerId: player.id, reason: 'pay' });
                this._emitStateChanged();
                uiTextResultElement.innerHTML = `💸 Multa de $500 paga. Livre!`;
                await ModalManager.showOkPrompt(
                    '✅ Multa Paga!',
                    'Você pagou $500 e está livre! Role os dados agora.'
                );
                await this.handleDebtCheck(player);
                if (!player.eliminated) {
                    await this.executeNormalRoll(player, btnDiceElement, uiTextResultElement);
                }
                return;
            } else {
                await ModalManager.showOkPrompt(
                    '❌ Sem Fundos',
                    'Saldo insuficiente para pagar a multa. Tentando dupla nos dados...'
                );
                // Prossegue para tentativa de dupla
            }
        }

        // Tenta dupla nos dados
        const diceInfo = DiceLogic.roll();
        SoundManager.play('dice');
        uiTextResultElement.innerHTML = `<span class="dice-rolling">🎲</span> ROLANDO...`;
        await animateDiceOnBoard(diceInfo.d1, diceInfo.d2, diceInfo.isDouble);
        uiTextResultElement.innerHTML =
            `🎲 Tentativa de dupla: [${diceInfo.d1} + ${diceInfo.d2}]`;

        if (diceInfo.isDouble) {
            player.interdictionTurns = 0;
            this.bus.emit(GameEvents.INTERDICTION_FREE, { playerId: player.id, reason: 'doubles' });
            this._emitStateChanged();
            uiTextResultElement.innerHTML +=
                ` — <span style="color:#8ae37f">DUPLA! LIVRE! ✅</span>`;
            const originalPos = player.position;
            const { passedStart } = player.move(diceInfo.total);
            if (passedStart)
                uiTextResultElement.innerHTML +=
                    `<br><span style="color:#8ae37f">+$500 Salário!</span>`;
            await animateTokenHop(player, originalPos, diceInfo.total);
            await this.handleSpaceLogicEvent(player);
        } else {
            player.interdictionTurns++;
            this.bus.emit(GameEvents.INTERDICTION_FAIL, { playerId: player.id, attempt: player.interdictionTurns });
            this._emitStateChanged();
            const remaining = maxAttempts - player.interdictionTurns;
            uiTextResultElement.innerHTML +=
                ` — <span style="color:#ff4747">Sem dupla...</span>`;
            const msg = remaining > 0
                ? `Faltam ${remaining} tentativa(s) antes da liberação compulsória.`
                : 'Você será liberado automaticamente na próxima rodada!';
            await ModalManager.showOkPrompt('⛓️ Sem Dupla...', msg);
        }

        this.finishTurnSequenceRoutine(btnDiceElement, uiTextResultElement);
    }

    // ═══════════════════════════════════════════════════════════
    // LÓGICA DA CASA (o que acontece ao pousar)
    // ═══════════════════════════════════════════════════════════
    async handleSpaceLogicEvent(player) {
        const spaceData = BOARD_DATA[player.position];
        const spaceEl = document.getElementById(`space-${spaceData.id}`);

        // ── PROPRIEDADE ou PROFISSIONAL SESMT ──────────────────
        if (spaceData.type === 'property' || spaceData.type === 'sesmt') {
            const ownerPlayer = this.propertyOwnersDb[spaceData.id];

            if (!ownerPlayer) {
                // Focus na casa à venda
                if (spaceEl) JuiceFX.enableFocus(spaceEl);
                const purchaseInfo = this.calculatePurchasePrice(spaceData, player);
                const finalPrice = purchaseInfo.price;
                if (purchaseInfo.sesmtDiscount) {
                    JuiceFX.floatNear(spaceEl || document.body, `🛡️ -25% ${purchaseInfo.sesmtDiscount}`, '#8ae37f');
                }
                if (player.money >= finalPrice) {
                    const buy = await ModalManager.askToBuy(spaceData, finalPrice);
                    JuiceFX.disableFocus();
                    if (buy) {
                        const prevLevel = player.maturityLevel;
                        player.money -= finalPrice;
                        SoundManager.play('buy');
                        JuiceFX.showMoney(-finalPrice, spaceEl);
                        this.propertyOwnersDb[spaceData.id] = player;
                        player.ownedPropertiesIds.push(spaceData.id);
                        if (spaceData.type === 'sesmt') {
                            player.sesmtOwned.push(spaceData.sesmt_key);
                        }
                        setSpaceOwnerTagDisplayHTMLBadgeVisual(spaceData.id, player.color);
                        // Flash de compra na casa
                        if (spaceEl) JuiceFX._applyClass(spaceEl, 'space-purchased');
                        this.updateMaturity(player);

                        this.bus.emit(GameEvents.PROPERTY_BOUGHT, {
                            playerId: player.id, spaceId: spaceData.id,
                            price: finalPrice, type: spaceData.type
                        });
                        this._emitStateChanged();

                        // Feedback de progressão
                        if (player.maturityLevel > prevLevel) {
                            this.bus.emit(GameEvents.MATURITY_CHANGED, { playerId: player.id, level: player.maturityLevel });
                            JuiceFX.showLevelUp(`Maturidade Nível ${player.maturityLevel}!`, '#f1dd38');
                        }
                    }
                } else {
                    JuiceFX.disableFocus();
                    await ModalManager.showOkPrompt(
                        '💸 Fundos Insuficientes',
                        `Saldo insuficiente para adquirir esta área.<br>` +
                        `Necessário: <b style="color:#ff4747">$${finalPrice}</b>`
                    );
                }
            } else if (ownerPlayer !== player) {
                // Paga aluguel ao dono
                const rentInfo = this.calculateRent(spaceData, player, ownerPlayer);
                const rent = rentInfo.rent;
                player.money -= rent;
                JuiceFX.showMoney(-rent, spaceEl);
                if (spaceEl) JuiceFX.shake(spaceEl);
                const ownerReceives = ownerPlayer.maturityLevel >= 2
                    ? Math.floor(rent * 1.10) : rent;
                ownerPlayer.money += ownerReceives;

                this.bus.emit(GameEvents.RENT_PAID, {
                    payerId: player.id, ownerId: ownerPlayer.id,
                    spaceId: spaceData.id, rent, ownerReceives
                });
                this._emitStateChanged();

                const discountNote = rentInfo.sesmtDiscount
                    ? `<br><span style="color:#8ae37f; font-size:.85rem">🛡️ ${rentInfo.sesmtDiscount} reduziu o aluguel em 25%!` +
                      `<br>Valor original: <s>$${rentInfo.rentBeforeDiscount}</s></span>`
                    : '';

                await ModalManager.showOkPrompt(
                    `🏢 Área Ocupada!`,
                    `Esta área pertence a <b style="color:${ownerPlayer.color}">${ownerPlayer.name}</b>.<br><br>` +
                    `<h2 style="color:#ff4747; background:#2a0a0a; padding:8px; border-radius:8px">-$${rent}</h2>` +
                    discountNote
                );
                await this.handleDebtCheck(player);
            }
        }

        // ── CARTA SST ───────────────────────────────────────────
        else if (spaceData.type === 'card') {
            await this.handleCardEvent(player);
        }

        // ── CASAS DE CANTO ──────────────────────────────────────
        else if (spaceData.type === 'corner') {
            if (spaceData.id === 0) {
                // $500 já creditado dentro de player.move()
            } else if (spaceData.id === 10) {
                SoundManager.play('interdict');
                JuiceFX.screenShake(5, 300);
                player.interdictionTurns = 1;
                this.bus.emit(GameEvents.INTERDICTION_START, { playerId: player.id });
                this._emitStateChanged();
                await ModalManager.showOkPrompt(
                    '🚫 Interdição!',
                    'Você foi interditado! Na sua próxima rodada: tente dupla nos dados, pague $500, ' +
                    'ou aguarde a liberação compulsória.'
                );
            } else if (spaceData.id === 20) {
                await this.handleSIPAT(player);
            } else if (spaceData.id === 30) {
                player.canChooseSpace = true;
                this.bus.emit(GameEvents.APORTE_ACTIVATED, { playerId: player.id });
                this._emitStateChanged();
                await ModalManager.showOkPrompt(
                    '🚖 Aporte de Capital!',
                    'Na sua próxima rodada, antes de rolar, você poderá se mover para <b>qualquer casa</b> do tabuleiro!'
                );
            }
        }

        // ── AUDITORIA INTERNA (casa 37) ─────────────────────────
        else if (spaceData.type === 'tax') {
            await this.handleAuditoria(player);
        }

        // Verifica vitória após cada ação
        const victory = this.checkVictory();
        if (victory) await this.declareWinner(victory);
    }

    // ═══════════════════════════════════════════════════════════
    // CARTA SST
    // ═══════════════════════════════════════════════════════════
    async handleCardEvent(player) {
        const card = pullRandomCard();
        SoundManager.play('card');

        this.bus.emit(GameEvents.CARD_DRAWN, { playerId: player.id, card: { type: card.type, title: card.title, amount: card.amount } });

        // QUIZ: fluxo com pergunta + timer
        if (card.type === 'quiz') {
            await this.handleQuiz(player, card);
            return;
        }

        // NÍVEL 3: imunidade a fiscalização (1 uso por rodada)
        if (card.type === 'fiscalizacao' && player.maturityLevel >= 3 &&
            !player.fiscalizacaoImmunityUsed) {
            const discard = await ModalManager.showImmunityChoice(card);
            if (discard) {
                player.fiscalizacaoImmunityUsed = true;
                this.bus.emit(GameEvents.IMMUNITY_USED, { playerId: player.id, cardType: card.type });
                this._emitStateChanged();
                await ModalManager.showOkPrompt(
                    '🛡️ Imunidade Usada!',
                    'Seu nível de maturidade empresarial descartou esta fiscalização!'
                );
                return;
            }
        }

        // Focus no modal ao exibir carta
        const modalOverlay = document.getElementById('modal-overlay');

        const isFine = card.amount < 0;
        const headerMap = {
            evento:       isFine ? '⚠️ EVENTO NEGATIVO'        : '💰 EVENTO POSITIVO',
            acidente:     '🚨 ACIDENTE DE TRABALHO',
            adoecimento:  '🏥 ADOECIMENTO OCUPACIONAL',
            fiscalizacao: '🕵️ FISCALIZAÇÃO MTE',
        };
        const typeClass = isFine ? 'deck-fine' : 'deck-bonus';
        const amtColor  = isFine ? '#ff4747'   : '#8ae37f';
        const amtText   = `${card.amount > 0 ? '+' : ''}$${Math.abs(card.amount)}`;

        const htmlCard = `
            <div class="carta-sst-animada">
                <div class="deck-cover-header ${typeClass}">${headerMap[card.type] || '📋 EVENTO SST'}</div>
                <div class="deck-content">
                    <h3>${card.title}</h3>
                    <p style="margin-top:14px">${card.desc}</p>
                    <div class="deck-impact" style="color:${amtColor}">${amtText}</div>
                </div>
            </div>`;

        if (isFine) JuiceFX.screenShake(3, 200);
        await ModalManager.showOkPrompt('Evento Ocupacional!', htmlCard);
        this.bus.emit(GameEvents.CARD_RESOLVED, { playerId: player.id, card: { type: card.type, title: card.title, amount: card.amount } });
        await this.resolveCardPayment(player, card);
    }

    // ═══════════════════════════════════════════════════════════
    // TAXA DE CONSULTORIA (cartas penais: acidente/adoecimento/fiscalizacao)
    // ═══════════════════════════════════════════════════════════
    async resolveCardPayment(player, card) {
        const profissionalMap = {
            acidente:     'brigada',
            adoecimento:  'tecEnfermagem',
            fiscalizacao: 'tecSeguranca',
        };

        const requiredKey = profissionalMap[card.type];
        const rawAmount   = Math.abs(card.amount);

        // Evento: aplica diretamente (pode ser positivo)
        if (!requiredKey) {
            player.money += card.amount;
            this.bus.emit(GameEvents.MONEY_CHANGED, { playerId: player.id, amount: card.amount, money: player.money });
            this._emitStateChanged();
            if (card.amount < 0) await this.handleDebtCheck(player);
            return;
        }

        const payerHasIt = player.sesmtOwned.includes(requiredKey);
        const otherOwner = this.players.find(
            p => p !== player && !p.eliminated && p.sesmtOwned.includes(requiredKey)
        );

        if (payerHasIt) {
            const discounted = Math.floor(rawAmount * 0.50);
            const saved = rawAmount - discounted;
            player.money -= discounted;

            const profNames = {
                brigada: '🧯 Brigada de Emergência',
                tecEnfermagem: '🩺 Téc. de Enfermagem',
                tecSeguranca: '👷 Téc. de Segurança',
            };
            await ModalManager.showOkPrompt(
                '🛡️ Benefício Profissional!',
                `Seu profissional <b>${profNames[requiredKey]}</b> reduziu a penalidade em 50%!<br><br>` +
                `Valor original: <s style="opacity:.5">$${rawAmount}</s><br>` +
                `<span style="color:#8ae37f; font-size:1.3rem; font-weight:900">Você pagou apenas $${discounted}</span><br>` +
                `<span style="color:#f1dd38">Economia: $${saved}</span>`
            );
        } else if (otherOwner) {
            const toOwner = Math.floor(rawAmount * 0.25);
            player.money      -= rawAmount;
            otherOwner.money  += toOwner;
            await ModalManager.showOkPrompt(
                '👔 Taxa de Consultoria',
                `<b style="color:${otherOwner.color}">${otherOwner.name}</b> possui o profissional ` +
                `correspondente e recebeu 25% do valor da carta.<br><br>` +
                `<span style="color:${otherOwner.color}; font-size:1.4rem">+$${toOwner}</span> creditado.`
            );
        } else {
            player.money -= rawAmount;
            this._emitStateChanged();
        }

        await this.handleDebtCheck(player);
    }

    // ═══════════════════════════════════════════════════════════
    // QUIZ (pergunta de múltipla escolha com timer de 40s)
    // ═══════════════════════════════════════════════════════════
    async handleQuiz(player, card) {
        this.bus.emit(GameEvents.QUIZ_STARTED, { playerId: player.id });
        const acertou = await ModalManager.showQuiz(card);
        this.bus.emit(GameEvents.QUIZ_ANSWERED, { playerId: player.id, correct: acertou });
        if (acertou) {
            SoundManager.play('correct');
            player.money += card.acerto;
            this._emitStateChanged();
            await ModalManager.showOkPrompt(
                '✅ Correto!',
                `Ótimo conhecimento em SST! <b style="color:#8ae37f">+$${card.acerto}</b>`
            );
        } else {
            SoundManager.play('wrong');
            player.money -= Math.abs(card.erro);
            this._emitStateChanged();
            await ModalManager.showOkPrompt(
                '❌ Errado ou Tempo Esgotado!',
                `Resposta incorreta ou tempo esgotado. <b style="color:#ff4747">-$${Math.abs(card.erro)}</b>`
            );
            await this.handleDebtCheck(player);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // SIPAT (casa 20): dobra aluguel de uma propriedade permanentemente
    // AGORA com seleção direta no tabuleiro!
    // ═══════════════════════════════════════════════════════════
    async handleSIPAT(player) {
        const available = player.ownedPropertiesIds
            .map(id => BOARD_DATA[id])
            .filter(s => s.type === 'property' && !s.doubledRent);

        if (available.length === 0) {
            const reason = player.ownedPropertiesIds.length === 0
                ? 'Você ainda não possui nenhuma propriedade.'
                : 'Todas as suas propriedades já tiveram o aluguel dobrado anteriormente.';
            await ModalManager.showOkPrompt(
                '🎉 SIPAT — Sem Elegíveis',
                `<p>Você caiu na <b>SIPAT</b>, mas não pode usar o benefício.</p>` +
                `<p style="margin-top:8px;opacity:.7">${reason}</p>`
            );
            return;
        }

        await ModalManager.showOkPrompt(
            '🎉 SIPAT — Semana de Prevenção!',
            `<p style="margin-bottom:12px">Parabéns, <b style="color:${player.color}">${player.name}</b>! Você caiu na <b>SIPAT</b> e pode escolher <b>uma propriedade</b> para ter o aluguel <b style="color:#f1dd38">permanentemente dobrado</b>!</p>` +
            `<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;margin-bottom:12px;text-align:left">` +
            `<p style="font-size:.8rem;opacity:.7;margin-bottom:6px">📋 Propriedades elegíveis:</p>` +
            available.map(s =>
                `<div style="display:flex;align-items:center;gap:6px;padding:3px 0">` +
                `<span style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0"></span>` +
                `<span style="font-size:.85rem"><b>${s.name}</b> — Aluguel atual: <span style="color:#f1dd38">$${s.rent}</span> → Novo: <span style="color:#8ae37f">$${s.rent * 2}</span></span>` +
                `</div>`
            ).join('') +
            `</div>` +
            `<p style="font-size:.9rem;color:#40a2ff">👆 Clique diretamente no tabuleiro na casa desejada!</p>`
        );

        const eligibleIds = available.map(s => s.id);
        const selectedId = await enableBoardSpaceSelection(eligibleIds);

        if (selectedId !== null && selectedId !== undefined) {
            const space = BOARD_DATA[selectedId];
            const oldRent = space.rent;
            BOARD_DATA[selectedId].doubledRent = true;
            setSpaceOwnerTagDisplayHTMLBadgeVisual(selectedId, player.color);
            setSipatBadgeOnSpace(selectedId);
            this.bus.emit(GameEvents.SIPAT_ACTIVATED, { playerId: player.id, spaceId: selectedId });
            this._emitStateChanged();
            await ModalManager.showOkPrompt(
                '✅ SIPAT Aplicada!',
                `<p>O aluguel de <b style="color:${space.color}">${space.name}</b> foi <b style="color:#f1dd38">permanentemente dobrado</b>!</p>` +
                `<p style="margin-top:10px;font-size:1.2rem">` +
                `<s style="opacity:.4">$${oldRent}</s> → <b style="color:#8ae37f;font-size:1.4rem">$${oldRent * 2}</b></p>`
            );
        }
    }

    // ═══════════════════════════════════════════════════════════
    // AUDITORIA INTERNA (casa 37): 10% das propriedades sem monopólio
    // ═══════════════════════════════════════════════════════════
    async handleAuditoria(player) {
        const incompleteIds = player.ownedPropertiesIds.filter(id => {
            const sp    = BOARD_DATA[id];
            if (sp.type !== 'property') return false;
            const total = GROUP_SIZE[sp.group] || 999;
            const owned = player.ownedPropertiesIds
                .filter(pid => BOARD_DATA[pid].group === sp.group).length;
            return owned < total;
        });

        if (incompleteIds.length === 0) {
            await ModalManager.showOkPrompt(
                '🕵️ Auditoria Interna',
                'Todos os seus programas possuem monopólio completo. Nenhuma penalidade!'
            );
            return;
        }

        const totalValue = incompleteIds.reduce((s, id) => s + BOARD_DATA[id].price, 0);
        const tax        = Math.floor(totalValue * 0.10);
        player.money    -= tax;

        this.bus.emit(GameEvents.AUDITORIA, { playerId: player.id, tax, totalValue });
        this._emitStateChanged();

        await ModalManager.showOkPrompt(
            '🕵️ Auditoria Interna',
            `Programas incompletos avaliados em $${totalValue}.<br>` +
            `Penalidade de 10%: <b style="color:#ff4747">-$${tax}</b>`
        );
        await this.handleDebtCheck(player);
    }

    // ═══════════════════════════════════════════════════════════
    // SISTEMA DE DÍVIDA — venda forçada de propriedades
    // ═══════════════════════════════════════════════════════════
    async handleDebtCheck(player) {
        while (player.money < 0 && !player.eliminated) {
            const sellableProps = player.ownedPropertiesIds.map(id => BOARD_DATA[id]);
            
            if (sellableProps.length === 0) {
                // Sem propriedades para vender → eliminação
                player.eliminated = true;
                SoundManager.play('interdict');
                
                // Libera todas as propriedades para o banco
                for (const id of [...player.ownedPropertiesIds]) {
                    delete this.propertyOwnersDb[id];
                }
                player.ownedPropertiesIds = [];
                player.sesmtOwned = [];

                this.bus.emit(GameEvents.PLAYER_ELIMINATED, { playerId: player.id });
                this._emitStateChanged();
                
                await ModalManager.showOkPrompt(
                    `💀 ${player.name} foi à Falência!`,
                    `Sem propriedades para vender e saldo negativo.<br>` +
                    `<b style="color:${player.color}">${player.name}</b> está eliminado(a) da partida!`
                );
                return;
            }
            
            this.updateUI();
            const soldId = await ModalManager.showSellProperty(player, sellableProps, Math.abs(player.money));
            
            if (soldId !== null && soldId !== undefined) {
                const soldSpace = BOARD_DATA[soldId];
                const sellPrice = Math.floor(soldSpace.price * 0.5);
                player.money += sellPrice;
                
                // Remove propriedade do jogador
                player.ownedPropertiesIds = player.ownedPropertiesIds.filter(id => id !== soldId);
                delete this.propertyOwnersDb[soldId];
                
                // Remove SESMT se aplicável
                if (soldSpace.type === 'sesmt' && soldSpace.sesmt_key) {
                    player.sesmtOwned = player.sesmtOwned.filter(k => k !== soldSpace.sesmt_key);
                }
                
                // Remove badge do tabuleiro
                const badge = document.getElementById(`badge-${soldId}`);
                if (badge) { badge.style.display = 'none'; badge.innerHTML = ''; }
                
                // Remove SIPAT se estava dobrado
                if (soldSpace.doubledRent) soldSpace.doubledRent = false;
                
                SoundManager.play('loss');
                JuiceFX.showMoney(sellPrice, document.getElementById(`space-${soldId}`));

                this.bus.emit(GameEvents.PROPERTY_SOLD, { playerId: player.id, spaceId: soldId, sellPrice });
                
                this.updateMaturity(player);
                this._emitStateChanged();
                this.updateUI();
                
                await ModalManager.showOkPrompt(
                    '🏪 Propriedade Vendida!',
                    `<b>${soldSpace.name}</b> vendida por <b style="color:#8ae37f">+$${sellPrice}</b>.<br>` +
                    `Saldo atual: <b style="color:${player.money >= 0 ? '#8ae37f' : '#ff4747'}">$${player.money.toLocaleString('pt-BR')}</b>`
                );
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // CÁLCULO DE PREÇO DE COMPRA (com descontos de SESMT e maturidade)
    // ═══════════════════════════════════════════════════════════
    calculatePurchasePrice(spaceData, player) {
        let price = spaceData.price;
        let sesmtDiscount = null;

        // Desconto do Engenheiro (PGR e LTCAT -25%)
        if (['PGR', 'LTCAT'].includes(spaceData.group) &&
            player.sesmtOwned.includes('engenheiro')) {
            price = Math.floor(price * 0.75);
            sesmtDiscount = '📐 Engenheiro SST';
        }

        // Desconto do Médico (PCMSO e PCA -25%)
        if (['PCMSO', 'PCA'].includes(spaceData.group) &&
            player.sesmtOwned.includes('medico')) {
            price = Math.floor(price * 0.75);
            sesmtDiscount = '🏥 Médico do Trabalho';
        }

        // Desconto por nível de maturidade
        const discounts = [0, 0.15, 0.20, 0.25];
        price = Math.floor(price * (1 - (discounts[player.maturityLevel] || 0)));

        return { price, sesmtDiscount, originalPrice: spaceData.price };
    }

    // ═══════════════════════════════════════════════════════════
    // CÁLCULO DE ALUGUEL (monopólio + SIPAT + descontos SESMT)
    // ═══════════════════════════════════════════════════════════
    calculateRent(spaceData, payingPlayer, ownerPlayer) {
        // SESMT: aluguel fixo de $100
        if (spaceData.type === 'sesmt') return { rent: 100, sesmtDiscount: null };

        let rent = spaceData.rent;

        // Monopólio: dobra o aluguel base
        const groupSize    = GROUP_SIZE[spaceData.group] || 999;
        const ownedInGroup = ownerPlayer.ownedPropertiesIds
            .filter(id => BOARD_DATA[id].group === spaceData.group).length;
        if (ownedInGroup >= groupSize) rent *= 2;

        // SIPAT: dobra nesta propriedade específica
        if (spaceData.doubledRent) rent *= 2;

        let sesmtDiscount = null;
        const rentBeforeDiscount = rent;

        // Desconto para o pagador (Engenheiro e Médico)
        if (['PGR', 'LTCAT'].includes(spaceData.group) &&
            payingPlayer.sesmtOwned.includes('engenheiro')) {
            rent = Math.floor(rent * 0.75);
            sesmtDiscount = '📐 Engenheiro SST';
        }
        if (['PCMSO', 'PCA'].includes(spaceData.group) &&
            payingPlayer.sesmtOwned.includes('medico')) {
            rent = Math.floor(rent * 0.75);
            sesmtDiscount = '🏥 Médico do Trabalho';
        }

        return { rent, sesmtDiscount, rentBeforeDiscount };
    }

    // ═══════════════════════════════════════════════════════════
    // MATURIDADE E CONTAGEM DE MONOPÓLIOS
    // ═══════════════════════════════════════════════════════════
    updateMaturity(player) {
        let monopolies = 0;
        for (const [group, size] of Object.entries(GROUP_SIZE)) {
            const owned = player.ownedPropertiesIds
                .filter(id => BOARD_DATA[id].group === group).length;
            if (owned >= size) monopolies++;
        }
        player.monopoliesCount = monopolies;
        player.maturityLevel   = Math.min(monopolies, 3);
    }

    // ═══════════════════════════════════════════════════════════
    // CONDIÇÕES DE VITÓRIA
    // ═══════════════════════════════════════════════════════════
    checkVictory() {
        const active = this.getActivePlayers();
        
        // Só restou 1 jogador vivo → vence automaticamente
        if (active.length === 1) {
            return { winner: active[0], reason: `🏆 Último jogador de pé! Todos os outros faliram.` };
        }
        
        for (const p of active) {
            // 1. SESMT Completo (todos os 5 profissionais)
            if (SESMT_KEYS.every(k => p.sesmtOwned.includes(k)))
                return { winner: p, reason: '🏆 SESMT Completo — Os 5 profissionais contratados!' };

            // 2. Programas em Linha (monopoliza um lado inteiro do tabuleiro)
            for (const [side, groups] of Object.entries(SIDE_GROUPS)) {
                if (groups.every(g => {
                    const sz = GROUP_SIZE[g] || 999;
                    return p.ownedPropertiesIds
                        .filter(id => BOARD_DATA[id].group === g).length >= sz;
                }))
                    return { winner: p, reason: `🏆 Programas em Linha — Lado ${side} completo!` };
            }

            // 3. Programas Quádruplo (4+ monopólios)
            if (p.monopoliesCount >= 4)
                return { winner: p, reason: '🏆 Programas Quádruplo — 4 monopólios conquistados!' };
        }

        return null;
    }

    async declareWinner(victory) {
        this.gameOver = true;
        this.bus.emit(GameEvents.VICTORY, { winnerId: victory.winner.id, reason: victory.reason });
        this.bus.emit(GameEvents.GAME_OVER, this.getSnapshot());
        SoundManager.play('victory');
        JuiceFX.screenShake(8, 500);
        JuiceFX.showLevelUp(`${victory.winner.name} VENCEU!`, victory.winner.color);
        await sleep(600);
        await ModalManager.showOkPrompt(
            `${victory.winner.icon} ${victory.winner.name} VENCEU!`,
            `<h2 style="color:${victory.winner.color}; margin-bottom:15px">${victory.reason}</h2>` +
            `Parabéns pelo excelente gerenciamento de SST!<br><br>` +
            `Recarregue a página para uma nova partida.`
        );
    }

    // ═══════════════════════════════════════════════════════════
    // FINALIZAR TURNO → avança ao próximo jogador
    // ═══════════════════════════════════════════════════════════
    finishTurnSequenceRoutine(btnDiceElement, uiTextResultElement) {
        this.consecutiveDoubles = 0;
        
        const totalPlayers = this.players.length;
        let next = (this.currentPlayerIndex + 1) % totalPlayers;
        let safety = 0;
        while (this.players[next].eliminated && safety < totalPlayers) {
            next = (next + 1) % totalPlayers;
            safety++;
        }
        this.currentPlayerIndex = next;
        
        SoundManager.play('turnChange');
        this.bus.emit(GameEvents.TURN_ENDED, {
            previousPlayerIndex: (next - 1 + this.players.length) % this.players.length,
            nextPlayerIndex: next,
            nextPlayerId: this.players[next].id
        });
        this.isAnimating = false;

        this._emitStateChanged();
        this.updateUI();

        if (!this.gameOver) {
            const nextPlayer = this.getCurrentPlayer();

            // Banner de troca de turno
            JuiceFX.showTurnBanner(nextPlayer.name, nextPlayer.color, nextPlayer.icon);

            // Animação no HUD card do jogador ativo
            const hudCard = document.getElementById(`hud-card-${nextPlayer.id}`);
            if (hudCard) JuiceFX._applyClass(hudCard, 'hud-turn-change');

            if (uiTextResultElement)
                uiTextResultElement.innerHTML +=
                    `<br><span style="opacity:0.6; font-size:13px">Vez de: ${nextPlayer.icon} ${nextPlayer.name}</span>`;
            if (btnDiceElement && this.autoEnableRollButton) {
                btnDiceElement.disabled = false;
                btnDiceElement.classList.add('btn-turn-glow');
            }
        }
        this.isAnimating = false;
    }
}