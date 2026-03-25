// ═══════════════════════════════════════════════════════════
// Banco SST — Servidor Multiplayer
// Express serve arquivos estáticos + Socket.io para tempo real
// ═══════════════════════════════════════════════════════════

const express = require('express');
const http    = require('http');
const path    = require('path');
const { Server } = require('socket.io');
const { RoomManager } = require('./RoomManager');

const PORT = process.env.PORT || 3000;
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
    cors: {
        origin: [
            'https://bancosst.web.app',
            'https://bancosst.firebaseapp.com',
            'http://localhost:3000',
            'http://localhost:3002',
        ],
        methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 20000,
});

// Serve arquivos estáticos (index.html, css/, js/)
app.use(express.static(path.join(__dirname, '..')));

const rooms = new RoomManager();

// ═══════════════════════════════════════════════════════════
// SOCKET.IO — Eventos de conexão
// ═══════════════════════════════════════════════════════════

io.on('connection', (socket) => {
    console.log(`[+] Conectado: ${socket.id}`);

    // ── CRIAR SALA ──────────────────────────────────────
    socket.on('room:create', ({ playerName, pawn }, ack) => {
        const room = rooms.createRoom(socket.id, playerName, pawn);
        socket.join(room.code);
        console.log(`[ROOM] ${playerName} criou sala ${room.code}`);
        ack({ ok: true, roomCode: room.code, playerId: 0, room: rooms.getRoomPublicState(room.code) });
    });

    // ── ENTRAR NA SALA ──────────────────────────────────
    socket.on('room:join', ({ roomCode, playerName, pawn }, ack) => {
        const code = (roomCode || '').toUpperCase().trim();
        const result = rooms.joinRoom(code, socket.id, playerName, pawn);

        if (!result.ok) {
            ack({ ok: false, error: result.error });
            return;
        }

        socket.join(code);
        console.log(`[ROOM] ${playerName} entrou na sala ${code}`);
        ack({ ok: true, roomCode: code, playerId: result.playerId, room: rooms.getRoomPublicState(code) });

        // Avisa todos na sala
        io.to(code).emit('room:updated', rooms.getRoomPublicState(code));
    });

    // ── HOST INICIA O JOGO ──────────────────────────────
    socket.on('room:start', (_, ack) => {
        const room = rooms.getRoomBySocket(socket.id);
        if (!room) { ack({ ok: false, error: 'Sala não encontrada.' }); return; }
        if (room.hostSocketId !== socket.id) { ack({ ok: false, error: 'Apenas o host pode iniciar.' }); return; }
        if (room.players.length < 2) { ack({ ok: false, error: 'Mínimo 2 jogadores.' }); return; }
        if (room.started) { ack({ ok: false, error: 'Jogo já iniciado.' }); return; }

        room.started = true;

        // Embaralha a ordem dos jogadores (Fisher-Yates)
        const shuffled = [...room.players];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        room.players = shuffled;

        // Recalcula quem é host (pode ter mudado de posição)
        room.currentPlayerIndex = 0;

        // Atualiza mapeamento socket→room para os jogadores reordenados
        room.players.forEach(p => {
            rooms._socketToRoom.set(p.socketId, room.code);
        });

        console.log(`[GAME] Sala ${room.code} iniciou com ${room.players.length} jogadores (ordem embaralhada)`);

        ack({ ok: true });

        // Informa cada jogador qual é seu novo índice após o embaralhamento
        io.to(room.code).emit('game:start', {
            players: room.players.map((p, i) => ({
                id: i + 1,
                name: p.name,
                pawn: p.pawn,
                color: p.color,
                socketId: p.socketId, // para cada cliente identificar seu novo playerId
            })),
            roomCode: room.code,
        });
    });

    // ── AÇÃO DO JOGADOR (durante o jogo) ────────────────
    socket.on('game:action', (action) => {
        const room = rooms.getRoomBySocket(socket.id);
        if (!room || !room.started) return;

        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex === -1) return;

        // Valida que é a vez deste jogador (exceto sell_property que pode ser forçado)
        if (action.type !== 'SELL_PROPERTY' && playerIndex !== room.currentPlayerIndex) {
            socket.emit('game:error', { message: 'Não é sua vez.' });
            return;
        }

        // Retransmite ação para TODOS na sala (inclusive quem enviou)
        io.to(room.code).emit('game:action', {
            ...action,
            playerIndex,
            _fromSocket: socket.id,
        });
    });

    // ── SYNC DE ESTADO (jogador ativo envia snapshot completo) ──
    socket.on('game:sync', (snapshot) => {
        const room = rooms.getRoomBySocket(socket.id);
        if (!room || !room.started) return;

        room.lastSnapshot = snapshot;
        room.currentPlayerIndex = snapshot.currentPlayerIndex;

        // Envia para todos EXCETO o remetente
        socket.to(room.code).emit('game:sync', snapshot);
    });

    // ── TURNO AVANÇADO (jogador ativo notifica mudança de turno) ─
    socket.on('game:turnChanged', ({ currentPlayerIndex }) => {
        const room = rooms.getRoomBySocket(socket.id);
        if (!room || !room.started) return;

        room.currentPlayerIndex = currentPlayerIndex;
        socket.to(room.code).emit('game:turnChanged', { currentPlayerIndex });
    });

    // ── EVENTO DE JOGO (jogador ativo broadcast de eventos visuais) ─
    socket.on('game:event', (eventData) => {
        const room = rooms.getRoomBySocket(socket.id);
        if (!room || !room.started) return;

        // Broadcast para todos exceto o remetente (que já processou localmente)
        socket.to(room.code).emit('game:event', eventData);
    });

    // ── CHAT ────────────────────────────────────────────
    socket.on('chat:message', ({ text }) => {
        const room = rooms.getRoomBySocket(socket.id);
        if (!room) return;
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        const safeText = String(text || '').slice(0, 200).replace(/[<>]/g, '');
        io.to(room.code).emit('chat:message', {
            playerName: player.name,
            playerColor: player.color,
            text: safeText,
            timestamp: Date.now(),
        });
    });

    // ── DESCONEXÃO ──────────────────────────────────────
    socket.on('disconnect', () => {
        console.log(`[-] Desconectado: ${socket.id}`);
        const room = rooms.getRoomBySocket(socket.id);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
            player.connected = false;
            player.disconnectedAt = Date.now();
            console.log(`[ROOM] ${player.name} desconectou da sala ${room.code}`);

            io.to(room.code).emit('room:playerDisconnected', {
                playerName: player.name,
                playerId: room.players.indexOf(player),
                room: rooms.getRoomPublicState(room.code),
            });

            // Timeout de 60s para reconexão
            setTimeout(() => {
                if (!player.connected) {
                    rooms.removePlayer(room.code, socket.id);
                    io.to(room.code).emit('room:playerLeft', {
                        playerName: player.name,
                        room: rooms.getRoomPublicState(room.code),
                    });
                    // Se room ficou vazia, limpa
                    if (room.players.length === 0) {
                        rooms.deleteRoom(room.code);
                    }
                }
            }, 60000);
        }
    });

    // ── RECONEXÃO ───────────────────────────────────────
    socket.on('room:reconnect', ({ roomCode, playerName }, ack) => {
        const code = (roomCode || '').toUpperCase().trim();
        const room = rooms.getRoom(code);
        if (!room) { ack({ ok: false, error: 'Sala não encontrada.' }); return; }

        const player = room.players.find(p => p.name === playerName && !p.connected);
        if (!player) { ack({ ok: false, error: 'Jogador não encontrado ou já conectado.' }); return; }

        // Atualiza socket
        const oldSocketId = player.socketId;
        rooms.updateSocket(code, oldSocketId, socket.id);
        player.connected = true;
        player.disconnectedAt = null;

        socket.join(code);
        console.log(`[ROOM] ${playerName} reconectou na sala ${code}`);

        const playerId = room.players.indexOf(player);
        ack({
            ok: true,
            roomCode: code,
            playerId,
            room: rooms.getRoomPublicState(code),
            snapshot: room.lastSnapshot || null,
            gameStarted: room.started,
        });

        io.to(code).emit('room:playerReconnected', {
            playerName: player.name,
            playerId,
            room: rooms.getRoomPublicState(code),
        });
    });
});

// ═══════════════════════════════════════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════════

server.listen(PORT, () => {
    console.log(`\n🏦 Banco SST Server rodando em http://localhost:${PORT}\n`);
});
