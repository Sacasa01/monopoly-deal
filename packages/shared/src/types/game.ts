import {
  ActionType,
  Card,
  MoneyCard,
  PropertyColor,
  RentCard,
  StandardPropertyCard,
  WildPropertyCard,
  ActionCard
} from './card.js';

export interface PropertySet {
  id: string;
  color: PropertyColor;
  cards: (StandardPropertyCard | WildPropertyCard)[];
  hasHouse: boolean;
  hasHotel: boolean;
  isComplete: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  bank: (MoneyCard | ActionCard | RentCard)[];
  properties: PropertySet[];
  isReady: boolean;
  isConnected: boolean;
  isBot: boolean;
}

export interface MaskedPlayerState {
  id: string;
  name: string;
  handCount: number;
  bank: (MoneyCard | ActionCard | RentCard)[];
  properties: PropertySet[];
  bankValue: number;
  isReady: boolean;
  isConnected: boolean;
  isBot: boolean;
}

export interface PendingAction {
  id: string;
  initiatorPlayerId: string;
  type: ActionType | 'RENT';
  cardPlayed: Card;
  targetPlayerIds: string[];
  amountOwedPerPlayer: Record<string, number>;
  doubleRentApplied: boolean;
  stolenProperty?: Card;
  swappedMyProperty?: Card;
  swappedTargetProperty?: Card;
  stolenSetColor?: PropertyColor;
  status: 'AWAITING_JUST_SAY_NO' | 'AWAITING_PAYMENT' | 'RESOLVED';
  justSayNoChain: { playerId: string; cardId: string }[];
  currentJustSayNoTargetPlayerId?: string;
  responsesRecorded: Record<string, 'PENDING' | 'ACCEPTED' | 'SAID_NO' | 'PAID'>;
}

export type TurnPhase =
  | 'PLAY_CARDS'
  | 'AWAITING_ACTION_RESOLUTION'
  | 'DISCARD_EXCESS'
  | 'GAME_OVER';

export interface GameState {
  id: string;
  roomCode: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
  players: Record<string, PlayerState>;
  playerOrder: string[];
  currentTurnPlayerId: string;
  turnPlaysRemaining: number;
  deck: Card[];
  discardPile: Card[];
  pendingAction: PendingAction | null;
  turnPhase: TurnPhase;
  winnerId: string | null;
  turnCount: number;
  actionLog: { timestamp: number; text: string }[];
}

export interface MaskedGameState {
  id: string;
  roomCode: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
  myPlayerId: string;
  myHand: Card[];
  players: Record<string, MaskedPlayerState>;
  playerOrder: string[];
  currentTurnPlayerId: string;
  turnPlaysRemaining: number;
  deckCount: number;
  discardPile: Card[];
  pendingAction: PendingAction | null;
  turnPhase: TurnPhase;
  winnerId: string | null;
  turnCount: number;
  actionLog: { timestamp: number; text: string }[];
}
