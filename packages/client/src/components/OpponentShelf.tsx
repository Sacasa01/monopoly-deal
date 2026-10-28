import React, { useState } from 'react';
import { MaskedPlayerState, PropertyColor, FULL_SET_SIZES } from '@monopoly-deal/shared';
import { Coins, Layers, Star, X } from 'lucide-react';
import { PropertySetView } from './PropertySetView.js';
import { GameCard } from './GameCard.js';

interface OpponentShelfProps {
  opponents: MaskedPlayerState[];
  currentTurnPlayerId: string;
}

const COLOR_DOTS: Record<PropertyColor, string> = {
  [PropertyColor.BROWN]: 'bg-amber-900',
  [PropertyColor.LIGHT_BLUE]: 'bg-sky-400',
  [PropertyColor.PINK]: 'bg-pink-500',
  [PropertyColor.ORANGE]: 'bg-orange-500',
  [PropertyColor.RED]: 'bg-red-600',
  [PropertyColor.YELLOW]: 'bg-yellow-400',
  [PropertyColor.GREEN]: 'bg-emerald-600',
  [PropertyColor.DARK_BLUE]: 'bg-blue-700',
  [PropertyColor.RAILROAD]: 'bg-zinc-700',
  [PropertyColor.UTILITY]: 'bg-stone-500'
};

export const OpponentShelf: React.FC<OpponentShelfProps> = ({
  opponents,
  currentTurnPlayerId
}) => {
  const [inspectingPlayer, setInspectingPlayer] = useState<MaskedPlayerState | null>(null);

  return (
    <div className="flex items-center gap-3 overflow-x-auto py-2 px-1">
      {opponents.map((opp) => {
        const isHisTurn = opp.id === currentTurnPlayerId;
        const completeCount = opp.properties.filter((s) => s.isComplete).length;

        return (
          <div
            key={opp.id}
            className={`relative flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
              isHisTurn
                ? 'bg-gradient-to-r from-gamehub-surface to-zinc-900 border border-gamehub-cyan shadow-cyan-glow'
                : 'bg-white/[0.04] border border-white/10 hover:border-white/20'
            }`}
            onClick={() => setInspectingPlayer(opp)}
          >
            {/* Avatar & Turn Indicator */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center text-sm font-bold text-white shadow-md">
                {opp.name.substring(0, 2).toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${
                  opp.isConnected ? 'bg-gamehub-green' : 'bg-zinc-500'
                }`}
                title={opp.isConnected ? 'Conectado' : 'Desconectado'}
              />
            </div>

            {/* Info Column */}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate max-w-[100px]">
                  {opp.name}
                </span>
                {opp.isBot && (
                  <span className="text-[9px] px-1 rounded bg-white/10 text-white/70">BOT</span>
                )}
                {isHisTurn && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-gamehub-cyan/20 text-gamehub-cyan font-bold animate-pulse">
                    EN TURNO
                  </span>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-2 mt-1 text-[11px] text-white/70">
                <span className="flex items-center gap-1 text-gamehub-gold font-mono font-bold">
                  <Coins className="w-3 h-3 text-gamehub-gold" />
                  ${opp.bankValue}M
                </span>
                <span className="flex items-center gap-1 text-white/60">
                  <Layers className="w-3 h-3" />
                  {opp.handCount}
                </span>
                {completeCount > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {completeCount}/3
                  </span>
                )}
              </div>

              {/* Mini Color Chips */}
              <div className="flex items-center gap-1 mt-1.5">
                {opp.properties.map((s) => (
                  <div
                    key={s.id}
                    className={`w-2.5 h-2.5 rounded-full ${COLOR_DOTS[s.color]} ${
                      s.isComplete ? 'ring-1 ring-amber-300' : ''
                    }`}
                    title={`${s.color}: ${s.cards.length}/${FULL_SET_SIZES[s.color]}`}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Opponent Table Inspection Modal */}
      {inspectingPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setInspectingPlayer(null)}
        >
          <div
            className="glass-modal max-w-4xl w-full max-h-[85vh] rounded-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Mesa de {inspectingPlayer.name}</span>
                  {inspectingPlayer.isBot && (
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">BOT</span>
                  )}
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Total en Banco: ${inspectingPlayer.bankValue}M • Cartas en Mano: {inspectingPlayer.handCount}
                </p>
              </div>
              <button
                onClick={() => setInspectingPlayer(null)}
                className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Properties Section */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gamehub-cyan uppercase tracking-wider mb-3">
                Propiedades ({inspectingPlayer.properties.length} sets)
              </h4>
              {inspectingPlayer.properties.length === 0 ? (
                <div className="p-8 text-center text-sm text-white/40 border border-dashed border-white/10 rounded-xl">
                  Este jugador aún no tiene propiedades en la mesa.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {inspectingPlayer.properties.map((s) => (
                    <PropertySetView key={s.id} set={s} />
                  ))}
                </div>
              )}
            </div>

            {/* Bank Section */}
            <div>
              <h4 className="text-sm font-bold text-gamehub-gold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                Banco (${inspectingPlayer.bankValue}M en {inspectingPlayer.bank.length} cartas)
              </h4>
              <div className="flex flex-wrap gap-2">
                {inspectingPlayer.bank.map((c) => (
                  <GameCard key={c.id} card={c} isCompact isPlayable={false} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
