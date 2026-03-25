// ═══════════════════════════════════════════════════════════
// BotManager — Lógica de jogo automático para bots
// Quando um jogador sai, o bot assume e joga automaticamente.
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
     * Retorna uma função de cleanup para restaurar os métodos originais.
     * @param {object} ModalManager
     */
    static enableAutoRespond(ModalManager) {
        const origAskToBuy = ModalManager.askToBuy;
        const origShowOk = ModalManager.showOkPrompt;
        const origShowInterdiction = ModalManager.showInterdictionOptions;
        const origShowQuiz = ModalManager.showQuiz;
        const origShowSell = ModalManager.showSellProperty;

        // Bot compra se tiver dinheiro suficiente (com margem de reserva)
        ModalManager.askToBuy = async (spaceData, price) => {
            await sleep(800);
            const game = window.SST_GLOBAL_GAME;
            const player = game ? game.getCurrentPlayer() : null;
            const balance = player ? player.money : 0;
            return balance - price >= 300;
        };

        // Auto-confirma modais informativos
        ModalManager.showOkPrompt = async (title, html) => {
            await sleep(600);
            return;
        };

        // Interdição: paga multa se tiver dinheiro > $1200, senão tenta dupla
        ModalManager.showInterdictionOptions = async (player, currentTurn, maxAttempts) => {
            await sleep(600);
            if (player.money >= 1200) return 'pay';
            return 'tryDoubles';
        };

        // Quiz: responde aleatoriamente
        if (ModalManager.showQuiz) {
            ModalManager.showQuiz = async (card) => {
                await sleep(1000);
                const randomIndex = Math.floor(Math.random() * (card.answers || card.options || []).length);
                return randomIndex;
            };
        }

        // Venda forçada: vende a propriedade mais barata
        ModalManager.showSellProperty = async (player, properties, debt) => {
            await sleep(500);
            if (!properties || properties.length === 0) return null;
            const sorted = [...properties].sort((a, b) => (a.price || 0) - (b.price || 0));
            return sorted[0].id;
        };

        // Cleanup: restaura todos os métodos originais
        return () => {
            _botAutoSelectActive = false;
            ModalManager.askToBuy = origAskToBuy;
            ModalManager.showOkPrompt = origShowOk;
            ModalManager.showInterdictionOptions = origShowInterdiction;
            if (origShowQuiz) ModalManager.showQuiz = origShowQuiz;
            ModalManager.showSellProperty = origShowSell;
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
