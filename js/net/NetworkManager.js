// ═══════════════════════════════════════════════════════════
// NetworkManager — Cliente Socket.io para multiplayer.
// Encapsula toda comunicação com o servidor de salas.
// Usa o globalBus para integrar com o GameEngine existente.
// ═══════════════════════════════════════════════════════════

import { globalBus } from '../utils/EventBus.js';

// Socket.io client é carregado via CDN no index.html
const getSocket = () => window.io ? window.io() : null;

class _NetworkManager {
    constructor() {
        this.socket     = null;
        this.roomCode   = null;
        this.playerId   = null;  // Índice local deste jogador na sala (0-3)
        this.isHost     = false;
        this.isOnline   = false;
        this.connected  = false;
        this._listeners = [];
    }

    // ═══════════════════════════════════════════════════════════
    // CONEXÃO
    // ═══════════════════════════════════════════════════════════

    connect() {
        return new Promise((resolve, reject) => {
            if (this.socket && this.connected) { resolve(); return; }

            // Socket.io client carregado via script tag
            if (!window.io) {
                reject(new Error('Socket.io client não carregado.'));
                return;
            }

            // URL do servidor de multiplayer
            // Em produção (Firebase Hosting) aponta para o servidor externo
            // Em dev local, usa o mesmo origin
            const serverUrl = window.BANCOSST_SERVER_URL || window.location.origin;
            this.socket = window.io(serverUrl, {
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                timeout: 10000,
            });

            this.socket.on('connect', () => {
                this.connected = true;
                console.log('[NET] Conectado ao servidor:', this.socket.id);
                resolve();
            });

            this.socket.on('connect_error', (err) => {
                console.error('[NET] Erro de conexão:', err.message);
                reject(err);
            });

            this.socket.on('disconnect', (reason) => {
                this.connected = false;
                console.warn('[NET] Desconectado:', reason);
                globalBus.emit('net:disconnected', { reason });
            });

            this.socket.on('reconnect', () => {
                this.connected = true;
                console.log('[NET] Reconectado!');
                globalBus.emit('net:reconnected', {});
                // Tenta reconectar na sala
                if (this.roomCode) {
                    this._tryReconnectRoom();
                }
            });

            // ── Listeners de sala ──
            this.socket.on('room:updated', (roomState) => {
                globalBus.emit('net:roomUpdated', roomState);
            });

            this.socket.on('room:playerDisconnected', (data) => {
                globalBus.emit('net:playerDisconnected', data);
            });

            this.socket.on('room:playerReconnected', (data) => {
                globalBus.emit('net:playerReconnected', data);
            });

            this.socket.on('room:playerLeft', (data) => {
                globalBus.emit('net:playerLeft', data);
            });

            // ── Listeners de jogo ──
            this.socket.on('game:start', (data) => {
                globalBus.emit('net:gameStart', data);
            });

            this.socket.on('game:action', (action) => {
                globalBus.emit('net:gameAction', action);
            });

            this.socket.on('game:sync', (snapshot) => {
                globalBus.emit('net:gameSync', snapshot);
            });

            this.socket.on('game:turnChanged', (data) => {
                globalBus.emit('net:turnChanged', data);
            });

            this.socket.on('game:event', (eventData) => {
                globalBus.emit('net:gameEvent', eventData);
            });

            this.socket.on('game:error', (data) => {
                console.warn('[NET] Erro do servidor:', data.message);
                globalBus.emit('net:error', data);
            });

            // ── Chat ──
            this.socket.on('chat:message', (data) => {
                globalBus.emit('net:chatMessage', data);
            });
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected = false;
        this.isOnline  = false;
        this.roomCode  = null;
        this.playerId  = null;
        this.isHost    = false;
    }

    // ═══════════════════════════════════════════════════════════
    // SALAS
    // ═══════════════════════════════════════════════════════════

    /** Cria uma nova sala (este jogador é host) */
    createRoom(playerName, pawn) {
        return new Promise((resolve, reject) => {
            if (!this.socket) { reject(new Error('Não conectado.')); return; }
            this.socket.emit('room:create', { playerName, pawn }, (response) => {
                if (response.ok) {
                    this.roomCode = response.roomCode;
                    this.playerId = response.playerId;
                    this.isHost   = true;
                    this.isOnline = true;
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    /** Entra numa sala existente pelo código */
    joinRoom(roomCode, playerName, pawn) {
        return new Promise((resolve, reject) => {
            if (!this.socket) { reject(new Error('Não conectado.')); return; }
            this.socket.emit('room:join', { roomCode, playerName, pawn }, (response) => {
                if (response.ok) {
                    this.roomCode = response.roomCode;
                    this.playerId = response.playerId;
                    this.isHost   = false;
                    this.isOnline = true;
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    /** Host inicia o jogo */
    startGame() {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isHost) { reject(new Error('Apenas o host pode iniciar.')); return; }
            this.socket.emit('room:start', {}, (response) => {
                if (response.ok) {
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // AÇÕES DE JOGO
    // ═══════════════════════════════════════════════════════════

    /** Envia uma ação de jogo para o servidor */
    sendAction(action) {
        if (!this.socket || !this.isOnline) return;
        this.socket.emit('game:action', action);
    }

    /** Jogador ativo envia snapshot de estado completo */
    sendSync(snapshot) {
        if (!this.socket || !this.isOnline) return;
        this.socket.emit('game:sync', snapshot);
    }

    /** Jogador ativo notifica mudança de turno */
    sendTurnChanged(currentPlayerIndex) {
        if (!this.socket || !this.isOnline) return;
        this.socket.emit('game:turnChanged', { currentPlayerIndex });
    }

    /** Jogador ativo envia evento visual para outros jogadores */
    sendGameEvent(eventData) {
        if (!this.socket || !this.isOnline) return;
        this.socket.emit('game:event', eventData);
    }

    /** Envia mensagem de chat */
    sendChat(text) {
        if (!this.socket || !this.isOnline) return;
        this.socket.emit('chat:message', { text });
    }

    // ═══════════════════════════════════════════════════════════
    // RECONEXÃO
    // ═══════════════════════════════════════════════════════════

    _tryReconnectRoom() {
        const savedName = sessionStorage.getItem('sst_player_name');
        if (!this.roomCode || !savedName) return;

        this.socket.emit('room:reconnect', {
            roomCode: this.roomCode,
            playerName: savedName,
        }, (response) => {
            if (response.ok) {
                this.playerId = response.playerId;
                this.isOnline = true;
                console.log('[NET] Reconectado na sala:', this.roomCode);
                globalBus.emit('net:reconnectedToRoom', response);
            } else {
                console.warn('[NET] Falha na reconexão:', response.error);
                globalBus.emit('net:reconnectFailed', response);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    /** Verifica se é a vez deste jogador (pelo índice na sala) */
    isMyTurn(currentPlayerIndex) {
        return this.playerId === currentPlayerIndex;
    }

    /** Retorna info do modo de jogo */
    getMode() {
        return {
            isOnline: this.isOnline,
            isHost: this.isHost,
            roomCode: this.roomCode,
            playerId: this.playerId,
        };
    }
}

export const NetworkManager = new _NetworkManager();
