import React, { useState } from 'react';
import { Card, CardType, MaskedGameState, WildPropertyCard } from '@monopoly-deal/shared';
import { GameCard } from './GameCard.js';
import { AlertCircle, Check } from 'lucide-react';

interface PaymentModalProps {
  gameState: MaskedGameState;
  myPlayerId: string;
  onPay: (paymentCardIds: string[]) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  gameState,
  myPlayerId,
  onPay
}) => {
  const pending = gameState.pendingAction;
  if (!pending || pending.status !== 'AWAITING_PAYMENT') return null;

  const isDebtor = pending.targetPlayerIds.includes(myPlayerId);
  const isPaid = pending.responsesRecorded[myPlayerId] === 'PAID';
  if (!isDebtor || isPaid) return null;

  const amountOwed = pending.amountOwedPerPlayer[myPlayerId] ?? 0;
  const me = gameState.players[myPlayerId]!;

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Collect all eligible payment cards from table (Bank and Properties)
  const eligibleBankCards: Card[] = [...me.bank];
  const eligiblePropertyCards: Card[] = [];

  for (const s of me.properties) {
    for (const c of s.cards) {
      // Exclude $0M rainbow wild
      if (c.type === CardType.PROPERTY_WILD && (c as WildPropertyCard).value === 0) {
        continue;
      }
      eligiblePropertyCards.push(c);
    }
  }

  const allEligibleCards = [...eligibleBankCards, ...eligiblePropertyCards];
  const maxTableValue = allEligibleCards.reduce((sum, c) => sum + c.value, 0);

  // Calculate current selected total
  const selectedCards = allEligibleCards.filter((c) => selectedCardIds.includes(c.id));
  const selectedTotal = selectedCards.reduce((sum, c) => sum + c.value, 0);

  const toggleCard = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(selectedCardIds.filter((id) => id !== cardId));
    } else {
      setSelectedCardIds([...selectedCardIds, cardId]);
    }
  };

  const isPaymentValid =
    selectedTotal >= amountOwed || (maxTableValue > 0 && selectedCards.length === allEligibleCards.length);

  const initiatorName = gameState.players[pending.initiatorPlayerId]?.name ?? 'Rival';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
      <div className="glass-modal max-w-2xl w-full rounded-2xl p-6 border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2 text-gamehub-orange">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-xl font-bold text-white">Pago de Deuda Obligatorio</h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/50">Debes a {initiatorName}</span>
            <div className="text-2xl font-mono font-black text-gamehub-gold">${amountOwed}M</div>
          </div>
        </div>

        {/* Notice on Hasbro No-Change rule */}
        <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
          <strong>Regla oficial:</strong> Nunca se da cambio. Si pagas de más, el cobrador se queda con el total. Las propiedades entregadas van a la mesa de {initiatorName}.
        </div>

        {/* Selection Totals */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10 mb-4">
          <span className="text-sm text-white/80">Total seleccionado:</span>
          <div className="text-lg font-mono font-bold flex items-center gap-1.5">
            <span
              className={
                selectedTotal >= amountOwed ? 'text-gamehub-green' : 'text-gamehub-orange'
              }
            >
              ${selectedTotal}M
            </span>
            <span className="text-white/40">/ ${amountOwed}M</span>
          </div>
        </div>

        {/* Table Cards Picker */}
        <div className="max-h-60 overflow-y-auto mb-6 pr-1 space-y-4">
          {/* Bank Cards */}
          <div>
            <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
              Cartas en tu Banco ({eligibleBankCards.length})
            </div>
            {eligibleBankCards.length === 0 ? (
              <div className="text-xs text-white/40 italic">Tu banco está vacío.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {eligibleBankCards.map((c) => (
                  <GameCard
                    key={c.id}
                    card={c}
                    isCompact
                    isSelected={selectedCardIds.includes(c.id)}
                    onClick={() => toggleCard(c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Property Cards */}
          <div>
            <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
              Propiedades en tu Mesa ({eligiblePropertyCards.length})
            </div>
            {eligiblePropertyCards.length === 0 ? (
              <div className="text-xs text-white/40 italic">No tienes propiedades disponibles.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {eligiblePropertyCards.map((c) => (
                  <GameCard
                    key={c.id}
                    card={c}
                    isCompact
                    isSelected={selectedCardIds.includes(c.id)}
                    onClick={() => toggleCard(c.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Payment Button */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            disabled={!isPaymentValid}
            onClick={() => onPay(selectedCardIds)}
            className={`btn-tactile px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 ${
              isPaymentValid
                ? 'bg-gradient-to-r from-gamehub-gold to-amber-500 text-black shadow-gold-glow hover:brightness-110'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Pago (${selectedTotal}M)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
