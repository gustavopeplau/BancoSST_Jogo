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
            'https://bancosst-jogo.onrender.com',
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
app.use(express.json());

// API endpoint para sendBeacon (fallback quando jogador fecha aba)
app.post('/api/player-leave', (req, res) => {
    const { roomCode, socketId } = req.body || {};
    if (!roomCode || !socketId) { res.status(400).end(); return; }
    const room = rooms.getRoom(roomCode);
    if (!room || !room.started) { res.status(404).end(); return; }
    const player = room.players.find(p => p.socketId === socketId);
    if (player && !player.isBot) {
        player.isBot = true;
        player.connected = false;
        const playerIndex = room.players.indexOf(player);
        console.log(`[BOT] ${player.name} saiu via beacon, bot assumiu (sala ${roomCode})`);
        io.to(roomCode).emit('game:playerBecameBot', {
            playerIndex,
            playerName: player.name,
            room: rooms.getRoomPublicState(roomCode),
        });
    }
    res.status(200).end();
});

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

    // ── SAÍDA INTENCIONAL (jogador clicou "sair") → bot assume ──
    socket.on('game:playerLeave', (_, ack) => {
        const room = rooms.getRoomBySocket(socket.id);
        if (!room || !room.started) { if (ack) ack({ ok: false }); return; }
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex === -1) { if (ack) ack({ ok: false }); return; }

        const player = room.players[playerIndex];
        player.isBot = true;
        player.connected = false;
        console.log(`[BOT] ${player.name} saiu intencionalmente, bot assumiu (sala ${room.code})`);

        // Notifica todos na sala
        io.to(room.code).emit('game:playerBecameBot', {
            playerIndex,
            playerName: player.name,
            room: rooms.getRoomPublicState(room.code),
        });

        if (ack) ack({ ok: true });

        // Remove socket da sala
        socket.leave(room.code);
        rooms._socketToRoom.delete(socket.id);
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

            // Se o jogo já iniciou, após 5s sem reconexão, bot assume
            if (room.started && !player.isBot) {
                setTimeout(() => {
                    if (!player.connected && !player.isBot) {
                        player.isBot = true;
                        const playerIndex = room.players.indexOf(player);
                        console.log(`[BOT] ${player.name} não reconectou em 5s, bot assumiu (sala ${room.code})`);
                        io.to(room.code).emit('game:playerBecameBot', {
                            playerIndex,
                            playerName: player.name,
                            room: rooms.getRoomPublicState(room.code),
                        });
                    }
                }, 5000);
            }

            // Timeout de 60s para limpeza total
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
