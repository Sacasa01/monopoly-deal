import { GameFSM, MaskedGameState } from '@monopoly-deal/shared';
import type { Server } from 'socket.io';

export interface RoomPlayer {
  id: string;
  name: string;
  socketId: string;
  isBot: boolean;
  isConnected: boolean;
  sessionToken: string;
}

export interface Room {
  code: string;
  hostPlayerId: string;
  players: Map<string, RoomPlayer>;
  fsm: GameFSM | null;
  status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
  createdAt: number;
}

export class RoomManager {
  private rooms = new Map<string, Room>();

  public createRoom(hostName: string, socketId: string): { room: Room; player: RoomPlayer } {
    const code = this.generateRoomCode();
    const playerId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const sessionToken = `tok-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const player: RoomPlayer = {
      id: playerId,
      name: hostName.trim() || 'Jugador 1',
      socketId,
      isBot: false,
      isConnected: true,
      sessionToken
    };

    const room: Room = {
      code,
      hostPlayerId: playerId,
      players: new Map([[playerId, player]]),
      fsm: null,
      status: 'LOBBY',
      createdAt: Date.now()
    };

    this.rooms.set(code, room);
    return { room, player };
  }

  public joinRoom(
    roomCode?: string,
    playerName?: string,
    socketId?: string
  ): { room: Room; player: RoomPlayer } {
    if (!roomCode) throw new Error('Código de sala no proporcionado.');
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      throw new Error(`La sala ${roomCode} no existe.`);
    }

    if (room.status !== 'LOBBY') {
      throw new Error('La partida ya ha comenzado en esta sala.');
    }

    if (room.players.size >= 5) {
      throw new Error('La sala está completa (máximo 5 jugadores).');
    }

    const playerId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const sessionToken = `tok-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const player: RoomPlayer = {
      id: playerId,
      name: (playerName || '').trim() || `Jugador ${room.players.size + 1}`,
      socketId: socketId || '',
      isBot: false,
      isConnected: true,
      sessionToken
    };

    room.players.set(playerId, player);
    return { room, player };
  }

  public addBot(roomCode?: string, botName?: string): RoomPlayer {
    if (!roomCode) throw new Error('Código de sala no proporcionado.');
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) throw new Error('Sala no encontrada.');
    if (room.status !== 'LOBBY') throw new Error('No se pueden añadir bots a una partida iniciada.');
    if (room.players.size >= 5) throw new Error('Sala completa.');

    const botId = `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const botPlayer: RoomPlayer = {
      id: botId,
      name: botName || `Bot Monopoly ${room.players.size + 1}`,
      socketId: '',
      isBot: true,
      isConnected: true,
      sessionToken: `bot-token-${botId}`
    };

    room.players.set(botId, botPlayer);
    return botPlayer;
  }

  public reconnect(
    roomCode?: string,
    sessionToken?: string,
    newSocketId?: string
  ): { room: Room; player: RoomPlayer } | null {
    if (!roomCode || !sessionToken) return null;
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return null;

    for (const player of room.players.values()) {
      if (player.sessionToken === sessionToken) {
        player.socketId = newSocketId || '';
        player.isConnected = true;
        return { room, player };
      }
    }

    return null;
  }

  public getRoom(roomCode?: string): Room | undefined {
    if (!roomCode) return undefined;
    return this.rooms.get(roomCode.toUpperCase());
  }

  public startGame(roomCode?: string, hostPlayerId?: string): GameFSM {
    if (!roomCode) throw new Error('Código de sala no proporcionado.');
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) throw new Error('Sala no encontrada.');
    if (room.hostPlayerId !== hostPlayerId) {
      throw new Error('Solo el anfitrión de la sala puede iniciar la partida.');
    }
    if (room.players.size < 2) {
      throw new Error('Se necesitan al menos 2 jugadores (puedes añadir un Bot si estás solo).');
    }

    const playerList = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      isBot: p.isBot
    }));

    const fsm = new GameFSM();
    fsm.initializeGame(playerList);

    room.fsm = fsm;
    room.status = 'IN_PROGRESS';

    return fsm;
  }

  public broadcastState(roomCode?: string, io?: Server) {
    if (!roomCode || !io) return;
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.fsm) return;

    for (const player of room.players.values()) {
      if (!player.isBot && player.isConnected && player.socketId) {
        const maskedState: MaskedGameState = room.fsm.getMaskedState(player.id);
        io.to(player.socketId).emit('game:state', maskedState);
      }
    }
  }

  public broadcastLobby(roomCode?: string, io?: Server) {
    if (!roomCode || !io) return;
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return;

    const lobbyInfo = {
      code: room.code,
      hostPlayerId: room.hostPlayerId,
      status: room.status,
      players: Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        isBot: p.isBot,
        isConnected: p.isConnected
      }))
    };

    io.to(room.code).emit('lobby:update', lobbyInfo);
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'DEAL-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }
}
