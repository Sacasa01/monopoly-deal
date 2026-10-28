import React from 'react';
import { ActionType, CardType, MaskedGameState } from '@monopoly-deal/shared';
import { ShieldAlert, ShieldCheck, Check } from 'lucide-react';
import { GameCard } from './GameCard.js';

interface ReactionModalProps {
  gameState: MaskedGameState;
  myPlayerId: string;
  onRespondJSN: (cardId: string) => void;
  onPassJSN: () => void;
}

export const ReactionModal: React.FC<ReactionModalProps> = ({
  gameState,
  myPlayerId,
  onRespondJSN,
  onPassJSN
}) => {
  const pending = gameState.pendingAction;
  if (!pending || pending.status !== 'AWAITING_JUST_SAY_NO') return null;

  // Check if I am a target or counter-target
  const isTarget = pending.targetPlayerIds.includes(myPlayerId);
  const isCounterTarget = pending.currentJustSayNoTargetPlayerId === myPlayerId;
  const isAlreadyHandled = pending.responsesRecorded[myPlayerId] && pending.responsesRecorded[myPlayerId] !== 'PENDING';

  if ((!isTarget && !isCounterTarget) || isAlreadyHandled) return null;

  // Find if player holds a Just Say No card
  const jsnCard = gameState.myHand.find(
    (c) => c.type === CardType.ACTION && (c as any).actionType === ActionType.JUST_SAY_NO
  );

  const initiatorName = gameState.players[pending.initiatorPlayerId]?.name ?? 'Rival';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-modal max-w-md w-full rounded-2xl p-6 border border-white/20 text-center shadow-2xl">
        {/* Header Icon */}
        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/30">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">¡Acción en tu contra!</h3>
        <p className="text-xs text-white/60 mb-4">
          <strong>{initiatorName}</strong> ha jugado una acción dirigida hacia ti:
        </p>

        {/* Action Card Preview */}
        <div className="flex justify-center mb-6">
          <GameCard card={pending.cardPlayed} isPlayable={false} />
        </div>

        {/* Just Say No Status */}
        {jsnCard ? (
          <div className="p-3 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Tienes un <strong>¡Di que No!</strong> disponible en tu mano.</span>
          </div>
        ) : (
          <div className="p-3 mb-6 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/50">
            No tienes un ¡Di que No! en la mano.
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3">
          {jsnCard && (
            <button
              type="button"
              onClick={() => onRespondJSN(jsnCard.id)}
              className="btn-tactile flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm shadow-lg hover:brightness-110 flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>¡Di que No!</span>
            </button>
          )}

          <button
            type="button"
            onClick={onPassJSN}
            className="btn-tactile flex-1 py-2.5 px-4 rounded-xl bg-white/10 text-white hover:bg-white/20 font-bold text-sm border border-white/15 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Aceptar / Continuar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
