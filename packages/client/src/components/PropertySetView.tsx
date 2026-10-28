import React from 'react';
import { PropertySet, PropertyColor, FULL_SET_SIZES, CardType, WildPropertyCard } from '@monopoly-deal/shared';
import { GameCard } from './GameCard.js';
import { Star } from 'lucide-react';

interface PropertySetViewProps {
  set: PropertySet;
  isOwner?: boolean;
  canRotate?: boolean;
  onRotateWildcard?: (cardId: string, newColor: PropertyColor) => void;
  onCardClick?: (cardId: string) => void;
}

const COLOR_ACCENTS: Record<PropertyColor, { bg: string; text: string; label: string }> = {
  [PropertyColor.BROWN]: { bg: 'bg-amber-900', text: 'text-amber-200', label: 'Marrón' },
  [PropertyColor.LIGHT_BLUE]: { bg: 'bg-sky-400', text: 'text-sky-950', label: 'Azul Claro' },
  [PropertyColor.PINK]: { bg: 'bg-pink-500', text: 'text-pink-950', label: 'Rosa' },
  [PropertyColor.ORANGE]: { bg: 'bg-orange-500', text: 'text-orange-950', label: 'Naranja' },
  [PropertyColor.RED]: { bg: 'bg-red-600', text: 'text-white', label: 'Rojo' },
  [PropertyColor.YELLOW]: { bg: 'bg-yellow-400', text: 'text-yellow-950', label: 'Amarillo' },
  [PropertyColor.GREEN]: { bg: 'bg-emerald-600', text: 'text-white', label: 'Verde' },
  [PropertyColor.DARK_BLUE]: { bg: 'bg-blue-700', text: 'text-white', label: 'Azul Oscuro' },
  [PropertyColor.RAILROAD]: { bg: 'bg-zinc-800', text: 'text-white', label: 'Estaciones' },
  [PropertyColor.UTILITY]: { bg: 'bg-stone-500', text: 'text-white', label: 'Servicios' }
};

export const PropertySetView: React.FC<PropertySetViewProps> = ({
  set,
  canRotate = false,
  onRotateWildcard,
  onCardClick
}) => {
  const accent = COLOR_ACCENTS[set.color];
  const required = FULL_SET_SIZES[set.color];

  return (
    <div
      className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
        set.isComplete
          ? 'bg-amber-500/10 border border-amber-400/40 set-complete-glow'
          : 'bg-white/[0.03] border border-white/10 hover:border-white/20'
      }`}
    >
      {/* Set Header Pill */}
      <div className="flex items-center gap-1.5 mb-2 w-full justify-between">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${accent.bg} ${accent.text}`}
        >
          {accent.label} {set.cards.length}/{required}
        </span>

        {set.isComplete && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black tracking-wider">
            <Star className="w-2.5 h-2.5 fill-black" />
            COMPLETO
          </span>
        )}
      </div>

      {/* House & Hotel Badges */}
      {(set.hasHouse || set.hasHotel) && (
        <div className="flex items-center gap-1 mb-1.5 w-full justify-start text-[9px] font-bold">
          {set.hasHouse && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              🏠 +$3M
            </span>
          )}
          {set.hasHotel && (
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
              🏨 +$4M
            </span>
          )}
        </div>
      )}

      {/* Stacked Cards Layout */}
      <div className="relative flex flex-col -space-y-24 sm:-space-y-28 pb-4">
        {set.cards.map((card, idx) => {
          const isWild = card.type === CardType.PROPERTY_WILD;
          const wild = card as WildPropertyCard;

          const handleRotate = () => {
            if (!canRotate || !onRotateWildcard) return;
            if (Array.isArray(wild.colors) && wild.colors.length === 2) {
              const otherColor =
                wild.activeColor === wild.colors[0] ? wild.colors[1] : wild.colors[0];
              onRotateWildcard(card.id, otherColor!);
            }
          };

          return (
            <div key={card.id} style={{ zIndex: idx + 1 }}>
              <GameCard
                card={card}
                isCompact
                onClick={() => onCardClick?.(card.id)}
                onRotate={canRotate && isWild ? handleRotate : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
