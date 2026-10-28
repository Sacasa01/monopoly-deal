import React from 'react';
import { Card, CardType, PropertyColor } from '@monopoly-deal/shared';
import { Zap, Coins, Home, X } from 'lucide-react';

interface ActionPillProps {
  card: Card;
  onPlayAction: () => void;
  onBank: () => void;
  onPlayProperty: (color?: PropertyColor) => void;
  onCancel: () => void;
}

export const ActionPill: React.FC<ActionPillProps> = ({
  card,
  onPlayAction,
  onBank,
  onPlayProperty,
  onCancel
}) => {
  const canBank = card.type === CardType.MONEY || card.type === CardType.ACTION || card.type === CardType.RENT;
  const canPlayAction = card.type === CardType.ACTION || card.type === CardType.RENT;
  const isProperty = card.type === CardType.PROPERTY || card.type === CardType.PROPERTY_WILD;

  return (
    <div className="flex items-center gap-2 p-1.5 bg-zinc-950/90 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      {/* 1. Play as Action button */}
      {canPlayAction && (
        <button
          onClick={onPlayAction}
          className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-gamehub-cyan to-blue-500 text-black text-xs font-bold shadow-cyan-glow hover:brightness-110"
        >
          <Zap className="w-3.5 h-3.5 fill-black" />
          <span>Jugar Acción</span>
        </button>
      )}

      {/* 2. Play as Property button */}
      {isProperty && (
        <button
          onClick={() => onPlayProperty()}
          className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-600 text-black text-xs font-bold shadow-lg hover:brightness-110"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Bajar a la Mesa</span>
        </button>
      )}

      {/* 3. Bank as Money button */}
      {canBank && (
        <button
          onClick={onBank}
          className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-gamehub-gold to-amber-500 text-black text-xs font-bold shadow-gold-glow hover:brightness-110"
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Al Banco (${card.value}M)</span>
        </button>
      )}

      {/* 4. Cancel / Close Pill */}
      <button
        onClick={onCancel}
        className="btn-tactile p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10"
        title="Cancelar selección"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
