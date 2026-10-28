import React, { useEffect, useState } from 'react';
import { MaskedGameState } from '@monopoly-deal/shared';
import {
  socket,
  saveSession,
  getSavedSession,
  clearSession
} from './services/socket.js';
import { LobbyView } from './components/LobbyView.js';
import { GameBoard } from './components/GameBoard.js';

export const App: React.FC = () => {
  const [, setIsConnected] = useState(socket.connected);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [lobbyPlayers, setLobbyPlayers] = useState<
    { id: string; name: string; isBot: boolean; isConnected: boolean }[]
  >([]);
  const [gameState, setGameState] = useState<MaskedGameState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-reconnect on load if session exists
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      const saved = getSavedSession();
      if (saved.roomCode && saved.sessionToken) {
        socket.emit(
          'room:reconnect',
          { roomCode: saved.roomCode, sessionToken: saved.sessionToken },
          (res: any) => {
            if (res.success) {
              setRoomCode(res.roomCode);
              setMyPlayerId(res.player.id);
            } else {
              clearSession();
            }
          }
        );
      }
    };

    const handleDisconnect = () => setIsConnected(false);

    const handleLobbyUpdate = (lobby: any) => {
      setRoomCode(lobby.code);
      setLobbyPlayers(lobby.players);
      if (lobby.status === 'LOBBY') {
        setGameState(null);
      }
    };

    const handleGameState = (state: MaskedGameState) => {
      setGameState(state);
      setRoomCode(state.roomCode);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('lobby:update', handleLobbyUpdate);
    socket.on('game:state', handleGameState);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('lobby:update', handleLobbyUpdate);
      socket.off('game:state', handleGameState);
    };
  }, []);

  const handleCreateRoom = (hostName: string) => {
    socket.emit('room:create', { hostName }, (res: any) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setMyPlayerId(res.player.id);
        saveSession(res.roomCode, res.player.sessionToken, hostName);
      } else {
        alert(res.error || 'Error al crear sala.');
      }
    });
  };

  const handleJoinRoom = (code: string, playerName: string) => {
    socket.emit('room:join', { roomCode: code, playerName }, (res: any) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setMyPlayerId(res.player.id);
        saveSession(res.roomCode, res.player.sessionToken, playerName);
      } else {
        alert(res.error || 'Error al unirse a la sala.');
      }
    });
  };

  const handleAddBot = () => {
    if (!roomCode) return;
    socket.emit('room:add-bot', { roomCode }, (res: any) => {
      if (!res.success) {
        alert(res.error || 'No se pudo añadir el bot.');
      }
    });
  };

  const handleStartGame = () => {
    if (!roomCode) return;
    socket.emit('room:start', { roomCode }, (res: any) => {
      if (!res.success) {
        alert(res.error || 'No se pudo iniciar la partida.');
      }
    });
  };

  const handleLeaveRoom = () => {
    clearSession();
    window.location.reload();
  };

  // Game Action wrappers
  const wrapAction = (event: string, payload: any) => {
    socket.emit(event, payload, (res: any) => {
      if (!res?.success && res?.error) {
        setErrorMessage(res.error);
        setTimeout(() => setErrorMessage(null), 3500);
      }
    });
  };

  // If match is active
  if (gameState && gameState.status !== 'LOBBY') {
    return (
      <div className="relative w-screen h-screen">
        {errorMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-600/90 text-white font-bold text-xs shadow-2xl backdrop-blur-md animate-bounce">
            ⚠️ {errorMessage}
          </div>
        )}

        <GameBoard
          gameState={gameState}
          myPlayerId={myPlayerId}
          onBankCard={(cardId) => wrapAction('game:bank-card', { cardId })}
          onPlayProperty={(cardId, targetColor) =>
            wrapAction('game:play-property', { cardId, targetColor })
          }
          onReorganizeWildcard={(cardId, targetColor) =>
            wrapAction('game:reorganize-wildcard', { cardId, targetColor })
          }
          onPlayPassGo={(cardId) => wrapAction('game:play-pass-go', { cardId })}
          onPlayDebtCollector={(cardId, targetPlayerId) =>
            wrapAction('game:play-debt-collector', { cardId, targetPlayerId })
          }
          onPlayBirthday={(cardId) => wrapAction('game:play-birthday', { cardId })}
          onPlayRent={(cardId, color, targetPlayerId, doubleRentCardId) =>
            wrapAction('game:play-rent', { cardId, color, targetPlayerId, doubleRentCardId })
          }
          onPlaySlyDeal={(cardId, targetPlayerId, targetPropertyId) =>
            wrapAction('game:play-sly-deal', { cardId, targetPlayerId, targetPropertyId })
          }
          onPlayForcedDeal={(cardId, targetPlayerId, myPropertyId, targetPropertyId) =>
            wrapAction('game:play-forced-deal', {
              cardId,
              targetPlayerId,
              myPropertyId,
              targetPropertyId
            })
          }
          onPlayDealBreaker={(cardId, targetPlayerId, targetSetColor) =>
            wrapAction('game:play-deal-breaker', { cardId, targetPlayerId, targetSetColor })
          }
          onPlayHouse={(cardId, targetColor) =>
            wrapAction('game:play-house', { cardId, targetColor })
          }
          onPlayHotel={(cardId, targetColor) =>
            wrapAction('game:play-hotel', { cardId, targetColor })
          }
          onRespondJSN={(jsnCardId) => wrapAction('game:respond-jsn', { jsnCardId })}
          onPassJSN={() => wrapAction('game:pass-jsn', {})}
          onSubmitPayment={(paymentCardIds) =>
            wrapAction('game:submit-payment', { paymentCardIds })
          }
          onEndTurn={() => wrapAction('game:end-turn', {})}
          onDiscardExcess={(cardIds) => wrapAction('game:discard-excess', { cardIds })}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>
    );
  }

  // Otherwise, Lobby Screen
  const isHost = lobbyPlayers.length > 0 && lobbyPlayers[0]!.id === myPlayerId;

  return (
    <LobbyView
      roomCode={roomCode ?? undefined}
      players={lobbyPlayers}
      isHost={isHost}
      myPlayerId={myPlayerId}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      onAddBot={handleAddBot}
      onStartGame={handleStartGame}
    />
  );
};
