// ═══════════════════════════════════════════════════════════
// BotManager — Lógica de jogo automático para bots
// Quando um jogador sai, o bot assume e joga automaticamente.
// Modais são exibidos brevemente para broadcast aos demais jogadores.
// ═══════════════════════════════════════════════════════════

import { sleep } from '../utils/helpers.js';

/**
 * Flag global: quando true, o próximo enableBoardSpaceSelection auto-seleciona.
 * Isso é necessário porque SIPAT e Aporte pedem clique direto no tabuleiro.
 */
let _botAutoSelectActive = false;

export function isBotAutoSelectActive() { return _botAutoSelectActive; }

/**
 * Executa um turno automático para um jogador bot.
 * Chama handleTurnRoll do GameEngine com monkey-patches
 * temporários no ModalManager para auto-responder.
 */
export class BotManager {
    /**
     * Prepara o ModalManager para responder automaticamente durante o turno do bot.
     * Modais são abertos/fechados normalmente para que o broadcast online funcione
     * e os demais jogadores vejam cartas, casas e movimentações do bot.
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

        // Bot compra se tiver dinheiro suficiente (com margem de reserva)
        ModalManager.askToBuy = async (spaceData, price) => {
            const game = window.SST_GLOBAL_GAME;
            const player = game ? game.getCurrentPlayer() : null;
            const balance = player ? player.money : 0;
            const decision = balance - price >= 300;
            const decisionText = decision
                ? `<p style="color:#8ae37f;font-size:1.1rem;margin-top:8px">✅ Bot decidiu <b>COMPRAR</b>!</p>`
                : `<p style="color:#ff9800;font-size:1.1rem;margin-top:8px">❌ Bot decidiu <b>PASSAR</b>.</p>`;
            ModalManager._open('🤖 Bot Analisando Compra',
                `<p>Avaliando <b>${spaceData.name}</b> por <b style="color:#8ae37f">$${price}</b>...</p>${decisionText}`);
            await sleep(1500);
            ModalManager.closeModal();
            return decision;
        };

        // Auto-confirma modais informativos (exibe brevemente para broadcast)
        ModalManager.showOkPrompt = async (title, html) => {
            ModalManager._open(title, html);
            await sleep(1500);
            ModalManager.closeModal();
            return;
        };

        // Interdição: paga multa se tiver dinheiro > $1200, senão tenta dupla
        ModalManager.showInterdictionOptions = async (player, currentTurn, maxAttempts) => {
            const decision = player.money >= 1200 ? 'pay' : 'tryDoubles';
            const decisionText = decision === 'pay'
                ? '💸 Bot vai pagar a multa de $500.'
                : '🎲 Bot vai tentar dupla nos dados.';
            ModalManager._open('🤖 Bot na Interdição',
                `<p>${player.name} está interditado (tentativa ${currentTurn} de ${maxAttempts}).</p>` +
                `<p style="margin-top:8px;font-size:1.05rem">${decisionText}</p>`);
            await sleep(1500);
            ModalManager.closeModal();
            return decision;
        };

        // Quiz: bot tem 40% de chance de acertar (exibe pergunta brevemente)
        if (ModalManager.showQuiz) {
            ModalManager.showQuiz = async (card) => {
                ModalManager._open('🤖 Bot Respondendo Quiz',
                    `<p style="font-size:1.05rem">${card.pergunta}</p>` +
                    `<p style="margin-top:12px;opacity:.7">🤖 Bot pensando na resposta...</p>`);
                await sleep(2500);
                const acertou = Math.random() < 0.4; // 40% chance de acertar
                ModalManager.closeModal();
                return acertou;
            };
        }

        // Venda forçada: vende a propriedade mais barata
        ModalManager.showSellProperty = async (player, properties, debt) => {
            if (!properties || properties.length === 0) return null;
            const sorted = [...properties].sort((a, b) => (a.price || 0) - (b.price || 0));
            const chosen = sorted[0];
            ModalManager._open('🤖 Bot Vendendo Propriedade',
                `<p>${player.name} precisa quitar dívida de <b style="color:#ff4747">$${debt}</b>.</p>` +
                `<p style="margin-top:8px">Vendendo: <b>${chosen.name}</b></p>`);
            await sleep(1200);
            ModalManager.closeModal();
            return chosen.id;
        };

        // Imunidade a Fiscalização (Nível 3): bot sempre usa a imunidade
        if (ModalManager.showImmunityChoice) {
            ModalManager.showImmunityChoice = async (card) => {
                ModalManager._open('🤖 Bot Usando Imunidade',
                    `<p>O bot usou sua <b>Imunidade de Maturidade Nível 3</b> para descartar a carta de fiscalização!</p>` +
                    `<p style="margin-top:8px;opacity:.7"><i>"${card.title}"</i> — descartada.</p>`);
                await sleep(1500);
                ModalManager.closeModal();
                return true; // Bot sempre usa imunidade
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
