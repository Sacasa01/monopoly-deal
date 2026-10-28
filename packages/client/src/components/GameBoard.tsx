import React, { useState } from 'react';
import {
  ActionType,
  Card,
  CardType,
  MaskedGameState,
  PropertyColor,
  RentCard
} from '@monopoly-deal/shared';
import { Dock } from './Dock.js';
import { OpponentShelf } from './OpponentShelf.js';
import { GameCard } from './GameCard.js';
import { PropertySetView } from './PropertySetView.js';
import { ActionPill } from './ActionPill.js';
import { PaymentModal } from './PaymentModal.js';
import { ReactionModal } from './ReactionModal.js';
import {
  Coins,
  Layers,
  ArrowRight,
  Trophy,
  AlertTriangle,
  X
} from 'lucide-react';

interface GameBoardProps {
  gameState: MaskedGameState;
  myPlayerId: string;
  onBankCard: (cardId: string) => void;
  onPlayProperty: (cardId: string, targetColor?: PropertyColor) => void;
  onReorganizeWildcard: (cardId: string, targetColor: PropertyColor) => void;
  onPlayPassGo: (cardId: string) => void;
  onPlayDebtCollector: (cardId: string, targetPlayerId: string) => void;
  onPlayBirthday: (cardId: string) => void;
  onPlayRent: (
    cardId: string,
    color: PropertyColor,
    targetPlayerId?: string,
    doubleRentCardId?: string
  ) => void;
  onPlaySlyDeal: (
    cardId: string,
    targetPlayerId: string,
    targetPropertyId: string
  ) => void;
  onPlayForcedDeal: (
    cardId: string,
    targetPlayerId: string,
    myPropertyId: string,
    targetPropertyId: string
  ) => void;
  onPlayDealBreaker: (
    cardId: string,
    targetPlayerId: string,
    targetColor: PropertyColor
  ) => void;
  onPlayHouse: (cardId: string, color: PropertyColor) => void;
  onPlayHotel: (cardId: string, color: PropertyColor) => void;
  onRespondJSN: (jsnCardId: string) => void;
  onPassJSN: () => void;
  onSubmitPayment: (cardIds: string[]) => void;
  onEndTurn: () => void;
  onDiscardExcess: (cardIds: string[]) => void;
  onLeaveRoom: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  myPlayerId,
  onBankCard,
  onPlayProperty,
  onReorganizeWildcard,
  onPlayPassGo,
  onPlayDebtCollector,
  onPlayBirthday,
  onPlayRent,
  onPlaySlyDeal,
  onPlayForcedDeal,
  onPlayDealBreaker,
  onPlayHouse,
  onPlayHotel,
  onRespondJSN,
  onPassJSN,
  onSubmitPayment,
  onEndTurn,
  onDiscardExcess,
  onLeaveRoom
}) => {
  const me = gameState.players[myPlayerId]!;
  const isMyTurn = gameState.currentTurnPlayerId === myPlayerId;
  const opponents = Object.values(gameState.players).filter((p) => p.id !== myPlayerId);

  // Card interaction state
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null);
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null);

  // Target picker dialog state
  const [pendingActionCard, setPendingActionCard] = useState<Card | null>(null);
  const [pickerType, setPickerType] = useState<
    'TARGET_PLAYER' | 'COLOR_SELECT' | 'PROPERTY_SELECT' | 'DISCARD_EXCESS' | null
  >(null);
  const [selectedExcessCards, setSelectedExcessCards] = useState<string[]>([]);

  const selectedHandCard = gameState.myHand.find((c) => c.id === selectedHandCardId);

  // Handle hand card click
  const handleHandCardClick = (card: Card) => {
    if (gameState.turnPhase === 'DISCARD_EXCESS') {
      if (selectedExcessCards.includes(card.id)) {
        setSelectedExcessCards(selectedExcessCards.filter((id) => id !== card.id));
      } else {
        setSelectedExcessCards([...selectedExcessCards, card.id]);
      }
      return;
    }

    if (selectedHandCardId === card.id) {
      setSelectedHandCardId(null);
    } else {
      setSelectedHandCardId(card.id);
    }
  };

  // Dispatch Action card execution
  const executeCardAction = (card: Card) => {
    setSelectedHandCardId(null);

    if (card.type === CardType.ACTION) {
      const actionCard = card as any;

      if (actionCard.actionType === ActionType.PASS_GO) {
        onPlayPassGo(card.id);
      } else if (actionCard.actionType === ActionType.ITS_MY_BIRTHDAY) {
        onPlayBirthday(card.id);
      } else if (actionCard.actionType === ActionType.DEBT_COLLECTOR) {
        setPendingActionCard(card);
        setPickerType('TARGET_PLAYER');
      } else if (actionCard.actionType === ActionType.SLY_DEAL) {
        setPendingActionCard(card);
        setPickerType('PROPERTY_SELECT');
      } else if (actionCard.actionType === ActionType.FORCED_DEAL) {
        setPendingActionCard(card);
        setPickerType('PROPERTY_SELECT');
      } else if (actionCard.actionType === ActionType.DEAL_BREAKER) {
        setPendingActionCard(card);
        setPickerType('PROPERTY_SELECT');
      } else if (actionCard.actionType === ActionType.HOUSE) {
        // Find complete set eligible for house
        const eligibleSet = me.properties.find(
          (s) => s.isComplete && !s.hasHouse && s.color !== PropertyColor.RAILROAD && s.color !== PropertyColor.UTILITY
        );
        if (eligibleSet) {
          onPlayHouse(card.id, eligibleSet.color);
        } else {
          alert('No tienes ningún conjunto completo sin casa (no válido para estaciones ni servicios).');
        }
      } else if (actionCard.actionType === ActionType.HOTEL) {
        const eligibleSet = me.properties.find((s) => s.isComplete && s.hasHouse && !s.hasHotel);
        if (eligibleSet) {
          onPlayHotel(card.id, eligibleSet.color);
        } else {
          alert('No tienes ningún conjunto con casa previa para colocar un hotel.');
        }
      }
    } else if (card.type === CardType.RENT) {
      const rentCard = card as RentCard;
      if (rentCard.target === 'SINGLE_PLAYER') {
        setPendingActionCard(card);
        setPickerType('TARGET_PLAYER');
      } else {
        // Bicolor rent: choose which of the colors to charge
        const colors = rentCard.colors as [PropertyColor, PropertyColor];
        const ownedColor = colors.find((col) => me.properties.some((s) => s.color === col));
        if (!ownedColor) {
          alert('No posees propiedades de ninguno de los colores de esta carta de renta.');
          return;
        }
        onPlayRent(card.id, ownedColor);
      }
    }
  };

  const excessCount = me.handCount > 7 ? me.handCount - 7 : 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gamehub-bg">
      {/* 1. Left Vertical Dock */}
      <Dock
        playsRemaining={gameState.turnPlaysRemaining}
        actionLog={gameState.actionLog}
        onLeaveRoom={onLeaveRoom}
      />

      {/* 2. Main Game Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header & Opponents Shelf */}
        <header className="flex items-center justify-between px-6 py-2 border-b border-white/10 bg-gamehub-surface/60 backdrop-blur-md z-20 shrink-0">
          <div className="flex-1 overflow-x-auto">
            <OpponentShelf
              opponents={opponents}
              currentTurnPlayerId={gameState.currentTurnPlayerId}
            />
          </div>

          {/* Turn Status & End Turn Button */}
          <div className="flex items-center gap-3 pl-4 shrink-0">
            {isMyTurn ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-gamehub-cyan/20 text-gamehub-cyan border border-gamehub-cyan/30 text-xs font-bold animate-pulse">
                  TU TURNO ({gameState.turnPlaysRemaining} jugadas)
                </span>
                <button
                  type="button"
                  onClick={onEndTurn}
                  disabled={gameState.turnPhase !== 'PLAY_CARDS'}
                  className="btn-tactile px-4 py-2 rounded-xl bg-gradient-to-r from-gamehub-cyan to-blue-500 text-black text-xs font-bold shadow-cyan-glow hover:brightness-110 flex items-center gap-1.5"
                >
                  <span>Terminar Turno</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50">
                Turno de: <strong className="text-white">{gameState.players[gameState.currentTurnPlayerId]?.name}</strong>
              </div>
            )}
          </div>
        </header>

        {/* Center: Table Playing Area */}
        <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto relative z-10">
          {/* Active Discard & Deck Pile Display */}
          <div className="flex items-center justify-center gap-8 py-2">
            {/* Draw Deck */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <GameCard isFaceDown className="shadow-2xl" />
                <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/20 text-[10px] font-mono font-bold text-white">
                  {gameState.deckCount} cartas
                </div>
              </div>
            </div>

            {/* Discard Pile */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {gameState.discardPile.length > 0 ? (
                  <GameCard
                    card={gameState.discardPile[gameState.discardPile.length - 1]}
                    isPlayable={false}
                    className="shadow-2xl"
                  />
                ) : (
                  <div className="w-20 sm:w-28 md:w-32 aspect-[5/7] rounded-xl border border-dashed border-white/15 flex items-center justify-center text-xs text-white/30">
                    Descarte
                  </div>
                )}
                <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/20 text-[10px] font-mono font-bold text-white/70">
                  Descartes ({gameState.discardPile.length})
                </div>
              </div>
            </div>
          </div>

          {/* Your Table Area (Properties + Bank) */}
          <div className="flex flex-col gap-3">
            {/* Properties Sets Row */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gamehub-cyan flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Tus Propiedades ({me.properties.length} sets en mesa)
                </span>
                <span className="text-xs text-white/40">
                  {me.properties.filter((s) => s.isComplete).length} / 3 Sets Completos
                </span>
              </div>

              {me.properties.length === 0 ? (
                <div className="p-4 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-xl">
                  Aún no has bajado propiedades a tu mesa. Selecciona una carta de tu mano para colocarla.
                </div>
              ) : (
                <div className="flex items-start gap-3 overflow-x-auto pb-2">
                  {me.properties.map((s) => (
                    <PropertySetView
                      key={s.id}
                      set={s}
                      isOwner
                      canRotate={isMyTurn}
                      onRotateWildcard={onReorganizeWildcard}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bank Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gamehub-gold flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  Tu Banco (${me.bankValue}M en {me.bank.length} cartas)
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto p-2 bg-white/[0.02] border border-white/10 rounded-xl min-h-[72px]">
                {me.bank.length === 0 ? (
                  <span className="text-xs text-white/30 italic px-2">Banco vacío. Deposita dinero o acciones para protegerte de cobros.</span>
                ) : (
                  me.bank.map((c) => (
                    <GameCard key={c.id} card={c} isCompact isPlayable={false} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Player Hand Dock */}
        <footer className="relative border-t border-white/10 bg-gradient-to-t from-black via-zinc-950/90 to-transparent pt-3 pb-4 px-4 z-20 shrink-0">
          {/* Action Pill Micro-Interaction (Appears above hand when a card is selected) */}
          {selectedHandCard && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30">
              <ActionPill
                card={selectedHandCard}
                onPlayAction={() => executeCardAction(selectedHandCard)}
                onBank={() => {
                  onBankCard(selectedHandCard.id);
                  setSelectedHandCardId(null);
                }}
                onPlayProperty={(color) => {
                  onPlayProperty(selectedHandCard.id, color);
                  setSelectedHandCardId(null);
                }}
                onCancel={() => setSelectedHandCardId(null)}
              />
            </div>
          )}

          {/* Discard Excess Notification Bar */}
          {gameState.turnPhase === 'DISCARD_EXCESS' && (
            <div className="flex items-center justify-between p-2.5 mb-2 bg-red-500/20 border border-red-500/40 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>
                  Debes descartar <strong>{excessCount}</strong> carta(s) en exceso (Selecciona en tu mano: {selectedExcessCards.length}/{excessCount})
                </span>
              </div>
              <button
                type="button"
                disabled={selectedExcessCards.length !== excessCount}
                onClick={() => onDiscardExcess(selectedExcessCards)}
                className={`btn-tactile px-3 py-1 rounded-lg text-xs font-bold ${
                  selectedExcessCards.length === excessCount
                    ? 'bg-red-500 text-white shadow-lg cursor-pointer'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                Confirmar Descarte
              </button>
            </div>
          )}

          {/* Hand Cards Horizontal Carousel */}
          <div className="flex items-end justify-center -space-x-8 sm:-space-x-10 overflow-x-auto py-2 px-4">
            {gameState.myHand.map((card) => {
              const isSelected =
                selectedHandCardId === card.id || selectedExcessCards.includes(card.id);

              return (
                <div key={card.id} className="transition-transform duration-200 hover:-translate-y-4">
                  <GameCard
                    card={card}
                    isSelected={isSelected}
                    onClick={() => handleHandCardClick(card)}
                    onZoom={setZoomedCard}
                  />
                </div>
              );
            })}
          </div>
        </footer>

        {/* 4. Modals and Overlays */}
        <PaymentModal
          gameState={gameState}
          myPlayerId={myPlayerId}
          onPay={onSubmitPayment}
        />

        <ReactionModal
          gameState={gameState}
          myPlayerId={myPlayerId}
          onRespondJSN={onRespondJSN}
          onPassJSN={onPassJSN}
        />

        {/* High Resolution Card Zoom Inspector */}
        {zoomedCard && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
            onClick={() => setZoomedCard(null)}
          >
            <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <GameCard card={zoomedCard} isPlayable={false} className="w-full !aspect-[5/7] shadow-2xl" />
              <button
                onClick={() => setZoomedCard(null)}
                className="absolute -top-3 -right-3 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Target Player Picker Dialog (e.g. for Cobrador de Deudas) */}
        {pickerType === 'TARGET_PLAYER' && pendingActionCard && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setPickerType(null)}
          >
            <div className="glass-modal max-w-md w-full rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-2">Selecciona un Jugador Objetivo</h3>
              <p className="text-xs text-white/60 mb-4">
                Elige a quién dirigir la acción de <strong>{pendingActionCard.name}</strong>:
              </p>

              <div className="space-y-2 mb-6">
                {opponents.map((opp) => (
                  <button
                    key={opp.id}
                    onClick={() => {
                      if (pendingActionCard.type === CardType.RENT) {
                        onPlayRent(pendingActionCard.id, PropertyColor.BROWN, opp.id);
                      } else {
                        onPlayDebtCollector(pendingActionCard.id, opp.id);
                      }
                      setPickerType(null);
                      setPendingActionCard(null);
                    }}
                    className="btn-tactile w-full p-3 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-left flex items-center justify-between"
                  >
                    <span className="font-bold text-white">{opp.name}</span>
                    <span className="text-xs text-gamehub-gold font-mono">${opp.bankValue}M</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPickerType(null)}
                className="w-full py-2.5 rounded-xl bg-white/10 text-white/70 hover:text-white text-xs font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Property Steal Picker Dialog (for Robo Astuto / Trato Forzoso / Robanegocios) */}
        {pickerType === 'PROPERTY_SELECT' && pendingActionCard && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setPickerType(null)}
          >
            <div className="glass-modal max-w-2xl w-full rounded-2xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-2">
                Objetivo de {pendingActionCard.name}
              </h3>
              <p className="text-xs text-white/60 mb-4">
                Elige la propiedad del rival a robar o intercambiar:
              </p>

              <div className="space-y-4">
                {opponents.map((opp) => (
                  <div key={opp.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="text-sm font-bold text-white mb-2">{opp.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {opp.properties.flatMap((s) => s.cards).map((c) => (
                        <GameCard
                          key={c.id}
                          card={c}
                          isCompact
                          onClick={() => {
                            if ((pendingActionCard as any).actionType === ActionType.SLY_DEAL) {
                              onPlaySlyDeal(pendingActionCard.id, opp.id, c.id);
                            } else if ((pendingActionCard as any).actionType === ActionType.FORCED_DEAL) {
                              // Pick first eligible property from my sets to swap
                              const myEligible = me.properties.find((s) => !s.isComplete)?.cards[0];
                              if (myEligible) {
                                onPlayForcedDeal(pendingActionCard.id, opp.id, myEligible.id, c.id);
                              } else {
                                alert('No tienes ninguna propiedad suelta (fuera de un set completo) para intercambiar.');
                                return;
                              }
                            } else if ((pendingActionCard as any).actionType === ActionType.DEAL_BREAKER) {
                              const s = opp.properties.find((set) => set.cards.some((card) => card.id === c.id));
                              if (s && s.isComplete) {
                                onPlayDealBreaker(pendingActionCard.id, opp.id, s.color);
                              } else {
                                alert('Robanegocios solo puede robar conjuntos completos.');
                                return;
                              }
                            }
                            setPickerType(null);
                            setPendingActionCard(null);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setPickerType(null)}
                  className="w-full py-2.5 rounded-xl bg-white/10 text-white/70 hover:text-white text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Victory Screen Modal */}
        {gameState.status === 'FINISHED' && gameState.winnerId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in zoom-in-95">
            <div className="glass-modal max-w-md w-full rounded-3xl p-8 border border-amber-400/40 text-center shadow-gold-glow">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center mb-4 border border-amber-400/40 animate-bounce">
                <Trophy className="w-8 h-8 fill-amber-400 text-amber-400" />
              </div>

              <h2 className="text-3xl font-black text-white mb-1">¡PARTIDA FINALIZADA!</h2>
              <p className="text-sm text-gamehub-gold font-bold mb-6">
                🏆 {gameState.players[gameState.winnerId]?.name} ha conseguido 3 conjuntos completos de propiedades y se corona campeón!
              </p>

              <button
                onClick={onLeaveRoom}
                className="btn-tactile w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-gamehub-gold to-amber-500 text-black font-bold text-sm shadow-gold-glow"
              >
                Volver a la Sala / Inicio
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
