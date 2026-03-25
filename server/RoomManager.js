// ═══════════════════════════════════════════════════════════
// RoomManager — Gerencia salas de jogo no servidor
// ═══════════════════════════════════════════════════════════

const PLAYER_COLORS = ['#1976d2', '#e91e63', '#ff9800', '#4caf50'];

class RoomManager {
    constructor() {
        /** @type {Map<string, Room>} */
        this._rooms = new Map();
        /** @type {Map<string, string>} socketId → roomCode */
        this._socketToRoom = new Map();
    }

    /** Gera código de 6 caracteres alfanumérico (maiúsculo) */
    _generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I/O/0/1 para evitar confusão
        let code;
        do {
            code = '';
            for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        } while (this._rooms.has(code));
        return code;
    }

    /**
     * Cria uma nova sala e adiciona o host.
     */
    createRoom(socketId, playerName, pawn) {
        const code = this._generateCode();
        const room = {
            code,
            hostSocketId: socketId,
            players: [{
                socketId,
                name: playerName,
                pawn: pawn || 'capacete',
                color: PLAYER_COLORS[0],
                connected: true,
                disconnectedAt: null,
            }],
            started: false,
            currentPlayerIndex: 0,
            lastSnapshot: null,
            createdAt: Date.now(),
        };
        this._rooms.set(code, room);
        this._socketToRoom.set(socketId, code);
        return room;
    }

    /**
     * Adiciona um jogador a uma sala existente.
     */
    joinRoom(code, socketId, playerName, pawn) {
        const room = this._rooms.get(code);
        if (!room) return { ok: false, error: 'Sala não encontrada. Verifique o código.' };
        if (room.started) return { ok: false, error: 'Jogo já iniciado nesta sala.' };
        if (room.players.length >= 4) return { ok: false, error: 'Sala cheia (máximo 4 jogadores).' };
        if (room.players.some(p => p.socketId === socketId)) return { ok: false, error: 'Você já está nesta sala.' };

        const playerId = room.players.length;
        room.players.push({
            socketId,
            name: playerName,
            pawn: pawn || 'capacete',
            color: PLAYER_COLORS[playerId],
            connected: true,
            disconnectedAt: null,
        });
        this._socketToRoom.set(socketId, code);
        return { ok: true, playerId };
    }

    /**
     * Retorna estado público da sala (sem socketIds internos).
     */
    getRoomPublicState(code) {
        const room = this._rooms.get(code);
        if (!room) return null;
        return {
            code: room.code,
            started: room.started,
            players: room.players.map((p, i) => ({
                id: i,
                name: p.name,
                pawn: p.pawn,
                color: p.color,
                connected: p.connected,
                isHost: p.socketId === room.hostSocketId,
            })),
        };
    }

    getRoom(code) {
        return this._rooms.get(code) || null;
    }

    getRoomBySocket(socketId) {
        const code = this._socketToRoom.get(socketId);
        return code ? this._rooms.get(code) : null;
    }

    removePlayer(code, socketId) {
        const room = this._rooms.get(code);
        if (!room) return;
        room.players = room.players.filter(p => p.socketId !== socketId);
        this._socketToRoom.delete(socketId);
    }

    updateSocket(code, oldSocketId, newSocketId) {
        const room = this._rooms.get(code);
        if (!room) return;
        const player = room.players.find(p => p.socketId === oldSocketId);
        if (player) {
            player.socketId = newSocketId;
            this._socketToRoom.delete(oldSocketId);
            this._socketToRoom.set(newSocketId, code);
            // Se era host, atualiza
            if (room.hostSocketId === oldSocketId) {
                room.hostSocketId = newSocketId;
            }
        }
    }

    deleteRoom(code) {
        const room = this._rooms.get(code);
        if (!room) return;
        room.players.forEach(p => this._socketToRoom.delete(p.socketId));
        this._rooms.delete(code);
        console.log(`[ROOM] Sala ${code} removida.`);
    }
}

module.exports = { RoomManager };
