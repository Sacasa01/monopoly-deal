import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { generateFullDeck, CARD_TEMPLATES, CARD_BACK_IMAGE } from '../src/constants/cards-data.js';
import { CardType } from '../src/types/card.js';
import { GameFSM } from '../src/engine/game-fsm.js';

describe('106-Card Deck Mathematical Invariants', () => {
  it('should generate exactly 106 cards', () => {
    const deck = generateFullDeck();
    expect(deck).toHaveLength(106);
  });

  it('should match exact category counts', () => {
    const deck = generateFullDeck();

    const money = deck.filter((c) => c.type === CardType.MONEY);
    const properties = deck.filter((c) => c.type === CardType.PROPERTY);
    const wilds = deck.filter((c) => c.type === CardType.PROPERTY_WILD);
    const rents = deck.filter((c) => c.type === CardType.RENT);
    const actions = deck.filter((c) => c.type === CardType.ACTION);

    expect(money).toHaveLength(20);
    expect(properties).toHaveLength(28);
    expect(wilds).toHaveLength(11);
    expect(rents).toHaveLength(13);
    expect(actions).toHaveLength(34);

    expect(money.length + properties.length + wilds.length + rents.length + actions.length).toBe(106);
  });

  it('should have exactly $57M total in pure money cards', () => {
    const deck = generateFullDeck();
    const moneyCards = deck.filter((c) => c.type === CardType.MONEY);
    const totalMoney = moneyCards.reduce((acc, c) => acc + c.value, 0);
    expect(totalMoney).toBe(57);
  });

  it('should map every card image to an actual file on disk', () => {
    const baseAssetsDir = path.resolve(__dirname, '../../../assets/cards');
    const deck = generateFullDeck();

    // Check back image
    const backPath = path.join(baseAssetsDir, CARD_BACK_IMAGE);
    expect(fs.existsSync(backPath), `Card back not found: ${backPath}`).toBe(true);

    // Check all unique template images
    for (const template of CARD_TEMPLATES) {
      const fullPath = path.join(baseAssetsDir, template.imagePath);
      expect(fs.existsSync(fullPath), `Card image not found: ${fullPath} for ${template.name}`).toBe(true);
    }
  });

  it('preserves exact 106 total cards across the entire game state (Conservation Law)', () => {
    const fsm = new GameFSM();
    fsm.initializeGame([
      { id: 'p1', name: 'Santiago' },
      { id: 'p2', name: 'Carlos' },
      { id: 'p3', name: 'Ana' }
    ], 42);

    const state = fsm.getState();
    const countPlayerCards = (p: typeof state.players[string]) => {
      const hand = p.hand.length;
      const bank = p.bank.length;
      const props = p.properties.reduce((sum, s) => sum + s.cards.length, 0);
      return hand + bank + props;
    };

    let totalCardsInPlay = state.deck.length + state.discardPile.length;
    for (const p of Object.values(state.players)) {
      totalCardsInPlay += countPlayerCards(p);
    }

    expect(totalCardsInPlay).toBe(106);
  });
});
