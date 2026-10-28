import express from 'express';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { RoomManager } from './room-manager.js';
import { BotAI } from './bot-ai.js';
import { PropertyColor } from '@monopoly-deal/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();

// Mount card assets directory statically (portable relative path)
const defaultAssetsDir = path.resolve(__dirname, '../../../assets/cards');
const CARD_ASSETS_DIR = process.env.CARD_ASSETS_DIR || defaultAssetsDir;
if (fs.existsSync(CARD_ASSETS_DIR)) {
  app.use('/assets/cards', express.static(CARD_ASSETS_DIR));
  console.log(`[Server] Serving card assets from: ${CARD_ASSETS_DIR}`);
} else {
  console.warn(`[Server] Warning: Card assets dir not found at ${CARD_ASSETS_DIR}`);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Periodic Bot Runner: steps bots automatically with human-like cadence
setInterval(() => {
  for (const room of (roomManager as any).rooms.values()) {
    if (room.status === 'IN_PROGRESS' && room.fsm) {
      const state = room.fsm.getState();

      const activePlayer = state.players[state.currentTurnPlayerId];
      const isBotTurn = activePlayer?.isBot;

      const hasPendingBotTarget =
        state.pendingAction?.targetPlayerIds.some((tId: string) => state.players[tId]?.isBot);

      if (isBotTurn || hasPendingBotTarget) {
        try {
          const actionTaken = BotAI.handleBotAction(room.fsm);
          if (actionTaken) {
            roomManager.broadcastState(room.code, io);
          }
        } catch (err: any) {
          console.error(`[Bot Error in ${room.code}]:`, err.message);
        }
      }
    }
  }
}, 800);

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // 1. Lobby Events
  socket.on('room:create', ({ hostName }: { hostName: string }, callback) => {
    try {
      const { room, player } = roomManager.createRoom(hostName, socket.id);
      socket.join(room.code);
      socket.data.roomCode = room.code;
      socket.data.playerId = player.id;
      callback({ success: true, roomCode: room.code, player });
      roomManager.broadcastLobby(room.code, io);
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on(
    'room:join',
    ({ roomCode, playerName }: { roomCode: string; playerName: string }, callback) => {
      try {
        const { room, player } = roomManager.joinRoom(roomCode, playerName, socket.id);
        socket.join(room.code);
        socket.data.roomCode = room.code;
        socket.data.playerId = player.id;
        callback({ success: true, roomCode: room.code, player });
        roomManager.broadcastLobby(room.code, io);
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    }
  );

  socket.on(
    'room:reconnect',
    ({ roomCode, sessionToken }: { roomCode: string; sessionToken: string }, callback) => {
      try {
        const res = roomManager.reconnect(roomCode, sessionToken, socket.id);
        if (!res) {
          return callback({ success: false, error: 'Sesión no encontrada o expirada.' });
        }
        socket.join(res.room.code);
        socket.data.roomCode = res.room.code;
        socket.data.playerId = res.player.id;

        callback({ success: true, roomCode: res.room.code, player: res.player });

        if (res.room.status === 'IN_PROGRESS' && res.room.fsm) {
          const masked = res.room.fsm.getMaskedState(res.player.id);
          socket.emit('game:state', masked);
        } else {
          roomManager.broadcastLobby(res.room.code, io);
        }
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    }
  );

  socket.on('room:add-bot', ({ roomCode }: { roomCode: string }, callback) => {
    try {
      const bot = roomManager.addBot(roomCode);
      callback({ success: true, bot });
      roomManager.broadcastLobby(roomCode, io);
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('room:start', ({ roomCode }: { roomCode: string }, callback) => {
    try {
      const playerId = socket.data.playerId;
      roomManager.startGame(roomCode, playerId);
      callback({ success: true });
      roomManager.broadcastState(roomCode, io);
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  // 2. In-Game Actions
  const handleGameAction = (fn: (fsm: any) => void, callback?: any) => {
    const cb = typeof callback === 'function' ? callback : undefined;
    const roomCode = socket.data.roomCode;
    if (!roomCode) {
      if (cb) cb({ success: false, error: 'No estás unido a ninguna sala.' });
      return;
    }
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.fsm) {
      if (cb) cb({ success: false, error: 'Partida no activa.' });
      return;
    }

    try {
      fn(room.fsm);
      roomManager.broadcastState(roomCode, io);
      if (cb) cb({ success: true });
    } catch (err: any) {
      console.warn(`[Game Action Error in ${roomCode}]:`, err.message);
      if (cb) cb({ success: false, error: err.message });
    }
  };

  socket.on('game:bank-card', ({ cardId }: { cardId: string }, callback) => {
    handleGameAction((fsm) => fsm.bankCard(socket.data.playerId, cardId), callback);
  });

  socket.on(
    'game:play-property',
    ({ cardId, targetColor }: { cardId: string; targetColor?: PropertyColor }, callback) => {
      handleGameAction(
        (fsm) => fsm.playProperty(socket.data.playerId, cardId, targetColor),
        callback
      );
    }
  );

  socket.on(
    'game:reorganize-wildcard',
    ({ cardId, targetColor }: { cardId: string; targetColor: PropertyColor }, callback) => {
      handleGameAction(
        (fsm) => fsm.reorganizeWildcard(socket.data.playerId, cardId, targetColor),
        callback
      );
    }
  );

  socket.on('game:play-pass-go', ({ cardId }: { cardId: string }, callback) => {
    handleGameAction((fsm) => fsm.playPassGo(socket.data.playerId, cardId), callback);
  });

  socket.on(
    'game:play-debt-collector',
    ({ cardId, targetPlayerId }: { cardId: string; targetPlayerId: string }, callback) => {
      handleGameAction(
        (fsm) => fsm.playDebtCollector(socket.data.playerId, cardId, targetPlayerId),
        callback
      );
    }
  );

  socket.on('game:play-birthday', ({ cardId }: { cardId: string }, callback) => {
    handleGameAction((fsm) => fsm.playBirthday(socket.data.playerId, cardId), callback);
  });

  socket.on(
    'game:play-rent',
    (
      payload: {
        cardId: string;
        color: PropertyColor;
        targetPlayerId?: string;
        doubleRentCardId?: string;
      },
      callback
    ) => {
      handleGameAction(
        (fsm) =>
          fsm.playRent(
            socket.data.playerId,
            payload.cardId,
            payload.color,
            payload.targetPlayerId,
            payload.doubleRentCardId
          ),
        callback
      );
    }
  );

  socket.on(
    'game:play-sly-deal',
    (
      {
        cardId,
        targetPlayerId,
        targetPropertyId
      }: { cardId: string; targetPlayerId: string; targetPropertyId: string },
      callback
    ) => {
      handleGameAction(
        (fsm) =>
          fsm.playSlyDeal(socket.data.playerId, cardId, targetPlayerId, targetPropertyId),
        callback
      );
    }
  );

  socket.on(
    'game:play-forced-deal',
    (
      {
        cardId,
        targetPlayerId,
        myPropertyId,
        targetPropertyId
      }: {
        cardId: string;
        targetPlayerId: string;
        myPropertyId: string;
        targetPropertyId: string;
      },
      callback
    ) => {
      handleGameAction(
        (fsm) =>
          fsm.playForcedDeal(
            socket.data.playerId,
            cardId,
            targetPlayerId,
            myPropertyId,
            targetPropertyId
          ),
        callback
      );
    }
  );

  socket.on(
    'game:play-deal-breaker',
    (
      {
        cardId,
        targetPlayerId,
        targetSetColor
      }: { cardId: string; targetPlayerId: string; targetSetColor: PropertyColor },
      callback
    ) => {
      handleGameAction(
        (fsm) =>
          fsm.playDealBreaker(socket.data.playerId, cardId, targetPlayerId, targetSetColor),
        callback
      );
    }
  );

  socket.on(
    'game:play-house',
    ({ cardId, targetColor }: { cardId: string; targetColor: PropertyColor }, callback) => {
      handleGameAction(
        (fsm) => fsm.playHouse(socket.data.playerId, cardId, targetColor),
        callback
      );
    }
  );

  socket.on(
    'game:play-hotel',
    ({ cardId, targetColor }: { cardId: string; targetColor: PropertyColor }, callback) => {
      handleGameAction(
        (fsm) => fsm.playHotel(socket.data.playerId, cardId, targetColor),
        callback
      );
    }
  );

  socket.on('game:respond-jsn', ({ jsnCardId }: { jsnCardId: string }, callback) => {
    handleGameAction((fsm) => fsm.respondJustSayNo(socket.data.playerId, jsnCardId), callback);
  });

  socket.on('game:pass-jsn', (_payload: any, callback?: any) => {
    const cb = typeof callback === 'function' ? callback : typeof _payload === 'function' ? _payload : undefined;
    handleGameAction((fsm) => fsm.passJustSayNo(socket.data.playerId), cb);
  });

  socket.on(
    'game:submit-payment',
    ({ paymentCardIds }: { paymentCardIds: string[] }, callback) => {
      handleGameAction(
        (fsm) => fsm.submitPayment(socket.data.playerId, paymentCardIds),
        callback
      );
    }
  );

  socket.on('game:end-turn', (_payload: any, callback?: any) => {
    const cb = typeof callback === 'function' ? callback : typeof _payload === 'function' ? _payload : undefined;
    handleGameAction((fsm) => fsm.endTurn(socket.data.playerId), cb);
  });

  socket.on(
    'game:discard-excess',
    ({ cardIds }: { cardIds: string[] }, callback) => {
      handleGameAction(
        (fsm) => fsm.discardExcessCards(socket.data.playerId, cardIds),
        callback
      );
    }
  );

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    if (roomCode && playerId) {
      const room = roomManager.getRoom(roomCode);
      if (room) {
        const player = room.players.get(playerId);
        if (player) {
          player.isConnected = false;
          if (room.status === 'LOBBY') {
            room.players.delete(playerId);
            roomManager.broadcastLobby(roomCode, io);
          } else if (room.status === 'IN_PROGRESS' && room.fsm) {
            roomManager.broadcastState(roomCode, io);
          }
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 Monopoly Deal Server running at http://localhost:${PORT}`);
});
