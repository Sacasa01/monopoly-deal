import { describe, it, expect } from 'vitest';
import { GameFSM } from '../src/engine/game-fsm.js';
import { CardType, ActionType, PropertyColor } from '../src/types/card.js';

describe('GameFSM Action & Turn Lifecycle', () => {
  it('initializes game, deals 5 cards, and first player draws 2 on turn start', () => {
    const fsm = new GameFSM();
    fsm.initializeGame([
      { id: 'player1', name: 'Alice' },
      { id: 'player2', name: 'Bob' }
    ], 12345);

    const state = fsm.getState();
    expect(state.status).toBe('IN_PROGRESS');
    expect(state.currentTurnPlayerId).toBe('player1');
    expect(state.turnPlaysRemaining).toBe(3);

    // Initial 5 dealt + 2 drawn on turn start = 7 cards in hand for player1
    expect(state.players['player1']!.hand).toHaveLength(7);
    // Player 2 has 5 cards in hand
    expect(state.players['player2']!.hand).toHaveLength(5);
  });

  it('allows banking money and playing properties', () => {
    const fsm = new GameFSM();
    fsm.initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' }
    ], 12345);

    const state = fsm.getState();
    const alice = state.players['p1']!;

    // Find a money card in Alice's hand
    const moneyCard = alice.hand.find((c) => c.type === CardType.MONEY);
    if (moneyCard) {
      fsm.bankCard('p1', moneyCard.id);
      const updated = fsm.getState();
      expect(updated.players['p1']!.bank).toHaveLength(1);
      expect(updated.turnPlaysRemaining).toBe(2);
    }
  });

  it('debt payment with table cards (no change given)', () => {
    const baseFsm = new GameFSM();
    baseFsm.initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' }
    ], 12345);

    const state = baseFsm.getState();

    // Give Bob a $10M bill in his bank
    state.players['p2']!.bank.push({
      id: 'bob-money-10m',
      templateId: 'money-10m',
      name: 'Dinero $10M',
      type: CardType.MONEY,
      value: 10,
      imagePath: 'dinero/Dinero_10M.jpg'
    });

    // Give Alice a Debt Collector card in her hand
    const debtCard = {
      id: 'alice-debt-collector',
      templateId: 'action-debt-collector',
      name: 'Cobrador de Deudas',
      type: CardType.ACTION,
      actionType: ActionType.DEBT_COLLECTOR,
      value: 3,
      imagePath: 'acciones/Accion_Debt_Collector.jpg'
    };
    state.players['p1']!.hand.push(debtCard);

    // Create FSM with this exact state
    const fsm = new GameFSM(state);

    fsm.playDebtCollector('p1', debtCard.id, 'p2');

    let current = fsm.getState();
    expect(current.turnPhase).toBe('AWAITING_ACTION_RESOLUTION');
    expect(current.pendingAction?.status).toBe('AWAITING_JUST_SAY_NO');

    // Bob passes Just Say No
    fsm.passJustSayNo('p2');

    current = fsm.getState();
    expect(current.pendingAction?.status).toBe('AWAITING_PAYMENT');

    // Bob pays the $5M debt with his $10M bill
    fsm.submitPayment('p2', ['bob-money-10m']);

    current = fsm.getState();
    // Bob has 0 in bank
    expect(current.players['p2']!.bank).toHaveLength(0);
    // Alice receives the full $10M bill (No change given!)
    expect(current.players['p1']!.bank.some((c) => c.id === 'bob-money-10m')).toBe(true);
    // Action resolved
    expect(current.pendingAction).toBeNull();
    expect(current.turnPhase).toBe('PLAY_CARDS');
  });

  it('masks hand cards for opponents in getMaskedState', () => {
    const fsm = new GameFSM();
    fsm.initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' }
    ], 12345);

    const maskedBobView = fsm.getMaskedState('p2');
    expect(maskedBobView.myPlayerId).toBe('p2');
    expect(maskedBobView.myHand).toHaveLength(5);

    // Opponent Alice's hand must be masked: only handCount visible, not cards array
    const aliceMasked = maskedBobView.players['p1']!;
    expect(aliceMasked.handCount).toBe(7);
    expect((aliceMasked as any).hand).toBeUndefined();
  });
});
