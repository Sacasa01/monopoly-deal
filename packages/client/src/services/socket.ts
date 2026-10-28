import { io, Socket } from 'socket.io-client';

const SERVER_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : window.location.origin;

export const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

export const SESSION_KEYS = {
  ROOM_CODE: 'monopoly_deal_room_code',
  SESSION_TOKEN: 'monopoly_deal_session_token',
  PLAYER_NAME: 'monopoly_deal_player_name'
};

export function saveSession(roomCode: string, sessionToken: string, playerName: string) {
  localStorage.setItem(SESSION_KEYS.ROOM_CODE, roomCode);
  localStorage.setItem(SESSION_KEYS.SESSION_TOKEN, sessionToken);
  localStorage.setItem(SESSION_KEYS.PLAYER_NAME, playerName);
}

export function getSavedSession(): {
  roomCode: string | null;
  sessionToken: string | null;
  playerName: string | null;
} {
  return {
    roomCode: localStorage.getItem(SESSION_KEYS.ROOM_CODE),
    sessionToken: localStorage.getItem(SESSION_KEYS.SESSION_TOKEN),
    playerName: localStorage.getItem(SESSION_KEYS.PLAYER_NAME)
  };
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEYS.ROOM_CODE);
  localStorage.removeItem(SESSION_KEYS.SESSION_TOKEN);
}
