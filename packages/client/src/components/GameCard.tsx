import React, { useState } from 'react';
import { Card, CardType, WildPropertyCard } from '@monopoly-deal/shared';
import { ZoomIn } from 'lucide-react';

interface GameCardProps {
  card?: Card;
  isFaceDown?: boolean;
  isSelected?: boolean;
  isPlayable?: boolean;
  isCompact?: boolean;
  onClick?: () => void;
  onRotate?: () => void;
  onZoom?: (card: Card) => void;
  className?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  card,
  isFaceDown = false,
  isSelected = false,
  isPlayable = true,
  isCompact = false,
  onClick,
  onRotate,
  onZoom,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  // If face down (e.g. deck or opponent hand)
  if (isFaceDown || !card) {
    return (
      <div
        className={`relative aspect-[5/7] rounded-xl overflow-hidden bg-gradient-to-br from-red-950 via-zinc-900 to-black border border-white/10 shadow-lg ${
          isCompact ? 'w-14 sm:w-16' : 'w-20 sm:w-28 md:w-32'
        } ${className}`}
      >
        <img
          src="/assets/cards/reverso/card-back.jpg"
          alt="Monopoly Deal Reverso"
          className="w-full h-full object-cover select-none pointer-events-none"
          loading="lazy"
          onError={() => setImageError(true)}
        />
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-[10px] text-white/60 font-bold bg-zinc-900">
            MONOPOLY DEAL
          </div>
        )}
      </div>
    );
  }

  // Check if wildcard should be rotated 180deg
  let isRotated = false;
  if (card.type === CardType.PROPERTY_WILD) {
    const wild = card as WildPropertyCard;
    if (Array.isArray(wild.colors) && wild.colors.length === 2) {
      // If active color is the second color, rotate 180deg so that color is on top!
      if (wild.activeColor === wild.colors[1]) {
        isRotated = true;
      }
    }
  }

  const imageUrl = `/assets/cards/${card.imagePath}`;

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`group relative aspect-[5/7] rounded-xl overflow-hidden cursor-pointer select-none card-hover-lift ${
        isCompact ? 'w-16 sm:w-20' : 'w-24 sm:w-28 md:w-32'
      } ${
        isSelected
          ? 'ring-2 ring-white shadow-halo scale-105 z-20'
          : 'ring-1 ring-white/15 hover:ring-white/40 hover:scale-105 hover:z-10'
      } ${!isPlayable ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Card Image */}
      <div
        className={`w-full h-full transition-transform duration-300 ease-apple-out ${
          isRotated ? 'rotate-180' : 'rotate-0'
        }`}
      >
        {!imageError ? (
          <img
            src={imageUrl}
            alt={card.name}
            className="w-full h-full object-cover pointer-events-none"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Elegant GameHub fallback placeholder */
          <div className="w-full h-full flex flex-col justify-between p-2 bg-gamehub-surface border border-white/10 text-left">
            <div className="text-[10px] font-bold text-gamehub-cyan truncate">{card.type}</div>
            <div className="text-xs font-bold leading-tight line-clamp-2 text-white">{card.name}</div>
            <div className="text-xs font-mono font-bold text-gamehub-gold">${card.value}M</div>
          </div>
        )}
      </div>

      {/* Value Badge Overlay (Bottom Right) */}
      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/20 pointer-events-none">
        ${card.value}M
      </div>

      {/* Zoom Inspector Icon */}
      {onZoom && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onZoom(card);
          }}
          className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white/70 hover:text-white hover:bg-black/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          title="Ver en grande"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Rotation Indicator for Bicolor Wildcard */}
      {onRotate && card.type === CardType.PROPERTY_WILD && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRotate();
          }}
          className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-white/20 text-white hover:bg-white/40 text-[9px] font-bold backdrop-blur-md border border-white/20"
          title="Girar comodín 180°"
        >
          ↻ Girar
        </button>
      )}
    </div>
  );
};
