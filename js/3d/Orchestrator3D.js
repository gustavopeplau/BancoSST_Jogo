// ═══════════════════════════════════════════════════════════
// Orchestrator3D.js — Bridge between existing game logic
// and 3D rendering. Replaces BoardManager's visual functions
// when 3D mode is active.
// ═══════════════════════════════════════════════════════════

import { Scene3D } from './Scene3D.js';
import { Board3D } from './Board3D.js';
import { PlayerToken3D } from './PlayerToken3D.js';
import { Dice3D } from './Dice3D.js';
import { SpeechBubble3D } from './SpeechBubble3D.js';
import { MoneyPile3D } from './MoneyPile3D.js';
import { HUD3D } from './HUD3D.js';
import { SoundManager } from '../utils/SoundManager.js';

let _is3D = false;
let _gameRef = null;

export const Orchestrator3D = {

    get is3D() { return _is3D; },

    /**
     * Initialize 3D mode. Call after DOM is ready and game-wrapper is visible.
     */
    init() {
        // Create the 3D canvas container if not present
        let container = document.getElementById('board-3d-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'board-3d-container';
            const wrapper = document.getElementById('game-wrapper');
            if (wrapper) {
                wrapper.insertBefore(container, wrapper.firstChild);
            }
        }

        // Mark game-wrapper as 3D mode
        const wrapper = document.getElementById('game-wrapper');
        if (wrapper) wrapper.classList.add('mode-3d');

        // Init 3D scene
        Scene3D.init('board-3d-container');
        Board3D.init();
        HUD3D.init();

        _is3D = true;
    },

    /**
     * Set game reference for state access
     */
    setGame(game) {
        _gameRef = game;
    },

    /**
     * 3D replacement for: createBoardElement()
     * Board is initialized in init(), this is for compatibility
     */
    createBoard() {
        // Already done in init()
    },

    /**
     * 3D replacement for: spawnTokensOnBoard(players)
     */
    spawnTokens(players) {
        PlayerToken3D.spawnAll(players);
        MoneyPile3D.updateAll(players);
    },

    /**
     * 3D replacement for: animateTokenHop(player, fromId, spacesToMove)
     */
    async animateTokenHop(player, fromId, spacesToMove) {
        // Show speech bubble
        SpeechBubble3D.show(player.id, 'Movendo...', player.color);

        // Highlight active space before move
        Board3D.setSpaceHighlight(fromId, false);

        await PlayerToken3D.animateHop(player.id, fromId, spacesToMove);

        // Highlight destination
        const dest = (fromId + spacesToMove) % 40;
        Board3D.setSpaceHighlight(dest, true);

        // Update money pile after move
        MoneyPile3D.update(player.id, player.money);

        SoundManager.play('land');
    },

    /**
     * 3D replacement for: animateDiceOnBoard(d1, d2, isDouble)
     * Called without args → physics determines result (local play).
     * Called with args → forces those values (network replay).
     * Returns { d1, d2, total, isDouble }.
     */
    async animateDice(d1 = null, d2 = null) {
        SpeechBubble3D.showAtCenter('🎲 Rolando dados...');
        HUD3D.showAction('🎲 Rolando dados...');

        const result = await Dice3D.roll(d1, d2);

        // Show result
        const text = `${result.d1} + ${result.d2} = ${result.total}${result.isDouble ? ' (DUPLA!)' : ''}`;
        HUD3D.showAction(text, result.isDouble ? '#f1dd38' : '#40a2ff');

        // Auto-dismiss dice after delay
        setTimeout(() => Dice3D.dismiss(), 1500);

        return result;
    },

    /**
     * 3D replacement for: setActiveSpace(spaceId)
     */
    setActiveSpace(spaceId) {
        // Clear all highlights
        for (let i = 0; i < 40; i++) {
            Board3D.setSpaceHighlight(i, false);
        }
        Board3D.setSpaceHighlight(spaceId, true);
    },

    /**
     * 3D replacement for: clearActiveSpace()
     */
    clearActiveSpace() {
        for (let i = 0; i < 40; i++) {
            Board3D.setSpaceHighlight(i, false);
        }
    },

    /**
     * 3D replacement for: setSpaceOwnerTagDisplayHTMLBadgeVisual()
     */
    setSpaceOwner(spaceId, playerColor, level) {
        Board3D.setSpaceOwner(spaceId, playerColor, level);
    },

    /**
     * 3D replacement for: setActiveToken()
     */
    setActiveToken(activePlayerId, allPlayers) {
        allPlayers.forEach(p => {
            PlayerToken3D.setActiveGlow(p.id, p.id === activePlayerId);
        });
    },

    /**
     * 3D replacement for: UIManager.updatePlayerHUDs()
     */
    updateHUD(players, currentIndex) {
        HUD3D.updatePlayers(players, currentIndex);
        MoneyPile3D.updateAll(players);
    },

    /**
     * Show an action speech bubble on a player
     */
    showSpeechBubble(playerId, text, color) {
        SpeechBubble3D.show(playerId, text, color);
    },

    /**
     * Show action in the feed
     */
    showAction(text, color) {
        HUD3D.showAction(text, color);
    },

    /**
     * Teleport tokens (for sync)
     */
    syncTokenPositions(players) {
        players.forEach(p => {
            PlayerToken3D.teleport(p.id, p.position);
            PlayerToken3D.setJailed(p.id, p.interdictionTurns > 0);
        });
    },

    /**
     * Sync property badges
     */
    syncPropertyBadges(game) {
        for (const [spaceId, owner] of Object.entries(game.propertyOwnersDb)) {
            if (owner) {
                const sid = parseInt(spaceId);
                const level = owner.propertyLevels ? (owner.propertyLevels[sid] || 1) : 1;
                Board3D.setSpaceOwner(sid, owner.color, level);
            }
        }
    },

    /**
     * 3D replacement for SIPAT badge
     */
    setSipatBadge(spaceId) {
        Board3D.setSipatBadge(spaceId);
    },

    /**
     * Remove SIPAT badge from space
     */
    removeSipatBadge(spaceId) {
        Board3D.removeSipatBadge(spaceId);
    },

    /**
     * Update rent display on a 3D space texture
     */
    updateSpaceInfo(spaceId, rentText) {
        Board3D.updateSpaceInfo(spaceId, rentText);
    },

    /**
     * Enable click-to-pick on the 3D board.
     * Highlights eligible spaces and returns the selected space id.
     * @param {number[]} eligibleIds
     * @returns {Promise<number>}
     */
    enableSpacePicking(eligibleIds) {
        return Board3D.enableSpacePicking(eligibleIds);
    },

    dispose() {
        Scene3D.dispose();
        HUD3D.dispose();
        MoneyPile3D.dispose();
        SpeechBubble3D.clearAll();
        _is3D = false;
        _gameRef = null;
    }
};
