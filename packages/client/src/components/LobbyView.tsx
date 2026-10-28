import React, { useState } from 'react';
import { Copy, Plus, Play, Bot, Crown, Users, LogIn } from 'lucide-react';

interface LobbyViewProps {
  roomCode?: string;
  players?: { id: string; name: string; isBot: boolean; isConnected: boolean }[];
  isHost?: boolean;
  myPlayerId?: string;
  onCreateRoom: (hostName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onAddBot: () => void;
  onStartGame: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomCode,
  players = [],
  isHost = false,
  myPlayerId,
  onCreateRoom,
  onJoinRoom,
  onAddBot,
  onStartGame
}) => {
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If already in a lobby room
  if (roomCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-[#0B0C10] via-[#111219] to-[#0B0C10]">
        <div className="glass-modal max-w-xl w-full rounded-2xl p-8 border border-white/15 shadow-2xl text-center">
          {/* Room Header */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gamehub-cyan/15 text-gamehub-cyan border border-gamehub-cyan/30 text-xs font-bold uppercase tracking-wider mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Sala de Juego Multijugador</span>
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Monopoly Deal Online</h2>
          <p className="text-sm text-white/60 mb-6">
            Comparte el código con tus amigos o añade bots de prueba para jugar.
          </p>

          {/* Room Code Badge */}
          <div className="flex items-center justify-center gap-3 p-3.5 mb-8 rounded-xl bg-white/[0.04] border border-white/10">
            <span className="text-xs uppercase text-white/50 tracking-wider">Código de Sala:</span>
            <span className="font-mono text-2xl font-black text-gamehub-cyan tracking-widest">
              {roomCode}
            </span>
            <button
              onClick={handleCopy}
              className="btn-tactile p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
              title="Copiar código"
            >
              <Copy className="w-4 h-4" />
            </button>
            {copied && <span className="text-xs font-bold text-gamehub-green animate-fade-in">¡Copiado!</span>}
          </div>

          {/* Players Grid (Up to 5) */}
          <div className="space-y-2.5 mb-8 text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center justify-between">
              <span>Jugadores en la sala ({players.length}/5)</span>
              <span>Mínimo 2 requeridos</span>
            </div>

            {players.map((p, idx) => {
              const isMe = p.id === myPlayerId;
              const isRoomHost = idx === 0;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isMe
                      ? 'bg-gamehub-cyan/10 border-gamehub-cyan/30 shadow-sm'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{p.name}</span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-white">
                            Tú
                          </span>
                        )}
                        {p.isBot && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            BOT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-white/40">
                        {p.isConnected ? 'Conectado y listo' : 'Desconectado'}
                      </div>
                    </div>
                  </div>

                  {isRoomHost && (
                    <div className="flex items-center gap-1 text-gamehub-gold text-xs font-bold">
                      <Crown className="w-4 h-4 fill-gamehub-gold" />
                      <span>Anfitrión</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isHost && players.length < 5 && (
              <button
                type="button"
                onClick={onAddBot}
                className="btn-tactile w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4 text-purple-400" />
                <span>+ Añadir Bot</span>
              </button>
            )}

            {isHost ? (
              <button
                type="button"
                disabled={players.length < 2}
                onClick={onStartGame}
                className={`btn-tactile w-full sm:w-auto flex-1 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
                  players.length >= 2
                    ? 'bg-gradient-to-r from-gamehub-cyan to-blue-500 text-black shadow-cyan-glow hover:brightness-110 cursor-pointer'
                    : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Partida</span>
              </button>
            ) : (
              <div className="w-full py-3 text-center text-xs text-white/50 animate-pulse">
                Esperando a que el anfitrión inicie la partida...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Initial Join / Create Screen
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-[#0B0C10] via-[#111219] to-[#0B0C10]">
      <div className="glass-modal max-w-md w-full rounded-2xl p-8 border border-white/15 shadow-2xl text-center">
        {/* GameHub Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/15 text-xs font-bold uppercase tracking-wider mb-4">
          <span>🎮 GameHub Edition</span>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Monopoly Deal Online</h1>
        <p className="text-sm text-white/60 mb-6">
          Juega con tus amigos a las reglas oficiales del Monopoly Deal con diseño prémium.
        </p>

        {/* Name Input */}
        <div className="mb-6 text-left">
          <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
            Tu Nombre o Apodo
          </label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Ej: Santiago"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-gamehub-cyan focus:border-transparent transition-all"
            maxLength={18}
          />
        </div>

        {/* Buttons: Create vs Join */}
        <div className="space-y-4">
          <button
            type="button"
            disabled={!nameInput.trim()}
            onClick={() => onCreateRoom(nameInput)}
            className={`btn-tactile w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
              nameInput.trim()
                ? 'bg-gradient-to-r from-gamehub-cyan to-blue-500 text-black shadow-cyan-glow hover:brightness-110 cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Crear Sala Nueva</span>
          </button>

          <div className="flex items-center gap-3 my-2 text-white/30 text-xs">
            <span className="flex-1 h-px bg-white/10" />
            <span>O ÚNETE CON CÓDIGO</span>
            <span className="flex-1 h-px bg-white/10" />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="DEAL-XXXX"
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/15 text-white placeholder-white/30 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-white/40"
              maxLength={10}
            />
            <button
              type="button"
              disabled={!nameInput.trim() || !codeInput.trim()}
              onClick={() => onJoinRoom(codeInput, nameInput)}
              className={`btn-tactile px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-1.5 ${
                nameInput.trim() && codeInput.trim()
                  ? 'bg-white/20 text-white hover:bg-white/30 border border-white/20 cursor-pointer'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
