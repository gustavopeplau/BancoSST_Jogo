// ═══════════════════════════════════════════════════════════
// BotManager — Lógica de jogo automático para bots
// Quando um jogador sai, o bot assume e joga automaticamente.
// Modais são exibidos por 15 segundos para que TODOS os jogadores
// possam acompanhar o que o bot fez. Quiz mantém timer original.
// SEGURANÇA: cada método patched verifica player.isBot antes de
// auto-responder. Se não for bot, delega ao método original.
// ═══════════════════════════════════════════════════════════

import { sleep, shuffleArray } from '../utils/helpers.js';

/** Tempo de exibição dos modais do bot (ms) — 9 segundos */
const BOT_DISPLAY_TIME = 9000;

/**
 * Flag global: quando true, o próximo enableBoardSpaceSelection auto-seleciona.
 * Isso é necessário porque SIPAT e Aporte pedem clique direto no tabuleiro.
 */
let _botAutoSelectActive = false;

export function isBotAutoSelectActive() { return _botAutoSelectActive; }

/** Helper: retorna true se o jogador atual é bot */
function _isCurrentPlayerBot() {
    const game = window.SST_GLOBAL_GAME;
    const player = game ? game.getCurrentPlayer() : null;
    return player && player.isBot;
}

export class BotManager {
    /**
     * Prepara o ModalManager para responder automaticamente durante o turno do bot.
     * CADA método patched verifica se jogador atual é bot — se não for, delega ao original.
     * Retorna uma função de cleanup para restaurar os métodos originais.
     * @param {object} ModalManager
     */
    static enableAutoRespond(ModalManager) {
        const origAskToBuy = ModalManager.askToBuy;
        const origShowOk = ModalManager.showOkPrompt;
        const origShowInterdiction = ModalManager.showInterdictionOptions;
        const origShowQuiz = ModalManager.showQuiz;
        const origShowSell = ModalManager.showSellProperty;
        const origShowImmunity = ModalManager.showImmunityChoice;

        // ── COMPRA: bot compra se tiver dinheiro suficiente (margem $300) ──
        ModalManager.askToBuy = async (spaceData, price) => {
            if (!_isCurrentPlayerBot()) return origAskToBuy(spaceData, price);

            const game = window.SST_GLOBAL_GAME;
            const player = game.getCurrentPlayer();
            const balance = player.money;
            const decision = balance - price >= 300;
            const decisionText = decision
                ? `<p style="color:#8ae37f;font-size:1.1rem;margin-top:8px">✅ Bot decidiu <b>COMPRAR</b>!</p>`
                : `<p style="color:#ff9800;font-size:1.1rem;margin-top:8px">❌ Bot decidiu <b>PASSAR</b>.</p>`;
            ModalManager._open('🤖 Bot Analisando Compra',
                `<p>Avaliando <b>${spaceData.name}</b> por <b style="color:#8ae37f">$${price}</b>...</p>` +
                `<p style="margin-top:6px;opacity:.7">Saldo: $${balance.toLocaleString('pt-BR')}</p>` +
                decisionText +
                _countdownHTML());
            _startCountdown(BOT_DISPLAY_TIME);
            await sleep(BOT_DISPLAY_TIME);
            ModalManager.closeModal();
            return decision;
        };

        // ── OK PROMPT: exibe modal informativo por 15s ──
        ModalManager.showOkPrompt = async (title, html) => {
            if (!_isCurrentPlayerBot()) return origShowOk(title, html);

            ModalManager._open(title, html + _countdownHTML());
            _startCountdown(BOT_DISPLAY_TIME);
            await sleep(BOT_DISPLAY_TIME);
            ModalManager.closeModal();
            return;
        };

        // ── INTERDIÇÃO: paga multa se >$1200, senão tenta dupla ──
        ModalManager.showInterdictionOptions = async (player, currentTurn, maxAttempts) => {
            if (!_isCurrentPlayerBot()) return origShowInterdiction(player, currentTurn, maxAttempts);

            const decision = player.money >= 1200 ? 'pay' : 'tryDoubles';
            const decisionText = decision === 'pay'
                ? '💸 Bot vai pagar a multa de $500.'
                : '🎲 Bot vai tentar dupla nos dados.';
            ModalManager._open('🤖 Bot na Interdição',
                `<p>${player.name} está interditado (tentativa ${currentTurn} de ${maxAttempts}).</p>` +
                `<p style="margin-top:8px;font-size:1.05rem">${decisionText}</p>` +
                _countdownHTML());
            _startCountdown(BOT_DISPLAY_TIME);
            await sleep(BOT_DISPLAY_TIME);
            ModalManager.closeModal();
            return decision;
        };

        // ── QUIZ: mostra quiz completo com timer, bot responde nos últimos 5s ──
        if (ModalManager.showQuiz) {
            ModalManager.showQuiz = async (card) => {
                if (!_isCurrentPlayerBot()) return origShowQuiz(card);

                return new Promise(resolve => {
                    let resolved = false;
                    const finish = (acertou) => {
                        if (resolved) return;
                        resolved = true;
                        ModalManager.closeModal();
                        resolve(acertou);
                    };
                    const total = card.tempo || 40;
                    let remaining = total;

                    // Embaralha opções mantendo rastreamento da correta
                    const indexedOptions = card.opcoes.map((txt, i) => ({ txt, originalIndex: i }));
                    shuffleArray(indexedOptions);
                    const correctShuffledIndex = indexedOptions.findIndex(o => o.originalIndex === card.resposta);

                    ModalManager._open(
                        '🤖 Quiz SST — Bot Respondendo',
                        `<p style="font-size:1.05rem;margin-bottom:10px">${card.pergunta}</p>
                         <div id="quiz-timer-bar-wrap">
                             <div id="quiz-timer-bar" style="width:100%"></div>
                             <span id="quiz-timer-text">${total}s</span>
                         </div>
                         <p style="margin-top:8px;opacity:.7;font-size:.85rem">🤖 Bot está analisando a pergunta...</p>`
                    );

                    // Mostra as opções (desabilitadas — para visualização)
                    indexedOptions.forEach((opcao, i) => {
                        const btn = document.createElement('button');
                        btn.className = 'btn-quiz-option';
                        btn.innerHTML = `<span class="quiz-letter">${String.fromCharCode(65 + i)}</span>${opcao.txt}`;
                        btn.disabled = true;
                        btn.style.opacity = '0.7';
                        btn.style.cursor = 'default';
                        ModalManager.actionsDiv.appendChild(btn);
                    });

                    // Timer countdown (idêntico ao original)
                    ModalManager._activeTimer = setInterval(() => {
                        remaining--;
                        const pct = (remaining / total) * 100;
                        const bar = document.getElementById('quiz-timer-bar');
                        const txt = document.getElementById('quiz-timer-text');
                        if (bar) {
                            bar.style.width = pct + '%';
                            bar.style.backgroundColor = pct > 40 ? '#40a2ff' : pct > 20 ? '#f1dd38' : '#ff4747';
                        }
                        if (txt) txt.textContent = remaining + 's';
                        if (remaining <= 0) finish(false);
                    }, 1000);

                    // Bot responde quando faltam ~5 segundos
                    const botDelay = Math.max((total - 5) * 1000, 5000);
                    setTimeout(() => {
                        if (resolved) return;
                        const acertou = Math.random() < 0.4; // 40% chance

                        // Destaca visualmente a opção escolhida
                        const buttons = ModalManager.actionsDiv.querySelectorAll('.btn-quiz-option');
                        const wrongIdx = (correctShuffledIndex + 1 + Math.floor(Math.random() * Math.max(indexedOptions.length - 1, 1))) % indexedOptions.length;
                        const chosenIdx = acertou ? correctShuffledIndex : wrongIdx;
                        if (buttons[chosenIdx]) {
                            buttons[chosenIdx].style.opacity = '1';
                            buttons[chosenIdx].style.background = acertou ? '#2e7d32' : '#c62828';
                            buttons[chosenIdx].style.color = '#fff';
                            buttons[chosenIdx].style.transform = 'scale(1.05)';
                        }
                        // Marca texto do bot
                        const hint = ModalManager.textEl?.querySelector('p:last-child');
                        if (hint) hint.innerHTML = acertou
                            ? '🤖 ✅ Bot respondeu corretamente!'
                            : '🤖 ❌ Bot errou a resposta!';

                        // Encerra 3 segundos após responder
                        setTimeout(() => finish(acertou), 3000);
                    }, botDelay);
                });
            };
        }

        // ── VENDA FORÇADA: vende a propriedade mais barata ──
        ModalManager.showSellProperty = async (player, properties, debt) => {
            if (!_isCurrentPlayerBot()) return origShowSell(player, properties, debt);

            if (!properties || properties.length === 0) return null;
            const sorted = [...properties].sort((a, b) => (a.price || 0) - (b.price || 0));
            const chosen = sorted[0];
            ModalManager._open('🤖 Bot Vendendo Propriedade',
                `<p>${player.name} precisa quitar dívida de <b style="color:#ff4747">$${debt}</b>.</p>` +
                `<p style="margin-top:8px">Vendendo: <b>${chosen.name}</b> por <b style="color:#8ae37f">$${Math.floor(chosen.price * 0.5)}</b></p>` +
                _countdownHTML());
            _startCountdown(BOT_DISPLAY_TIME);
            await sleep(BOT_DISPLAY_TIME);
            ModalManager.closeModal();
            return chosen.id;
        };

        // ── IMUNIDADE (Nível 3): bot sempre usa ──
        if (ModalManager.showImmunityChoice) {
            ModalManager.showImmunityChoice = async (card) => {
                if (!_isCurrentPlayerBot()) return origShowImmunity(card);

                ModalManager._open('🤖 Bot Usando Imunidade',
                    `<p>O bot usou sua <b>Imunidade de Maturidade Nível 3</b> para descartar a carta de fiscalização!</p>` +
                    `<p style="margin-top:8px;opacity:.7"><i>"${card.title}"</i> — descartada.</p>` +
                    _countdownHTML());
                _startCountdown(BOT_DISPLAY_TIME);
                await sleep(BOT_DISPLAY_TIME);
                ModalManager.closeModal();
                return true;
            };
        }

        // Cleanup: restaura todos os métodos originais
        return () => {
            _botAutoSelectActive = false;
            ModalManager.askToBuy = origAskToBuy;
            ModalManager.showOkPrompt = origShowOk;
            ModalManager.showInterdictionOptions = origShowInterdiction;
            if (origShowQuiz) ModalManager.showQuiz = origShowQuiz;
            ModalManager.showSellProperty = origShowSell;
            if (origShowImmunity) ModalManager.showImmunityChoice = origShowImmunity;
        };
    }

    /**
     * Ativa o modo de auto-seleção de tiles para o bot.
     * Deve ser chamado ANTES de executar handleTurnRoll do bot.
     */
    static activateAutoSelect() {
        _botAutoSelectActive = true;
    }
}

// ═══════════════════════════════════════════════════════════
// HELPERS: countdown visual nos modais do bot
// ═══════════════════════════════════════════════════════════

/** Retorna HTML da barra de countdown para inserir no modal */
function _countdownHTML() {
    return `<div id="bot-countdown-wrap" style="margin-top:12px;background:rgba(255,255,255,0.06);border-radius:8px;overflow:hidden;height:6px">
        <div id="bot-countdown-bar" style="height:100%;width:100%;background:#40a2ff;transition:width 1s linear;border-radius:8px"></div>
    </div>
    <p id="bot-countdown-text" style="text-align:center;opacity:.5;font-size:.75rem;margin-top:4px"></p>`;
}

/** Inicia o countdown visual (barra que diminui + texto de segundos) */
function _startCountdown(durationMs) {
    const totalSec = Math.round(durationMs / 1000);
    let remaining = totalSec;
    const bar = document.getElementById('bot-countdown-bar');
    const txt = document.getElementById('bot-countdown-text');
    if (txt) txt.textContent = `Próxima ação em ${remaining}s`;
    const timer = setInterval(() => {
        remaining--;
        if (remaining <= 0) { clearInterval(timer); return; }
        const pct = (remaining / totalSec) * 100;
        if (bar) bar.style.width = pct + '%';
        if (txt) txt.textContent = `Próxima ação em ${remaining}s`;
        if (remaining <= 3 && bar) bar.style.background = '#f1dd38';
    }, 1000);
}
