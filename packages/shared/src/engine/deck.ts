import { Card } from '../types/card.js';
import { generateFullDeck } from '../constants/cards-data.js';

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 */
export function createPRNG(seed: number = Date.now()) {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffles an array of cards using Fisher-Yates with a given PRNG.
 */
export function shuffleDeck(cards: Card[], random: () => number = Math.random): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

/**
 * Creates and shuffles a new 106-card deck.
 */
export function createShuffledDeck(seed?: number): Card[] {
  const baseDeck = generateFullDeck();
  const random = seed !== undefined ? createPRNG(seed) : Math.random;
  return shuffleDeck(baseDeck, random);
}

/**
 * Draws N cards from the deck.
 * If the deck runs out of cards, the discard pile is shuffled back in to form a new deck.
 */
export function drawCards(
  deck: Card[],
  discardPile: Card[],
  count: number,
  random: () => number = Math.random
): { drawn: Card[]; newDeck: Card[]; newDiscardPile: Card[] } {
  let currentDeck = [...deck];
  let currentDiscard = [...discardPile];
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (currentDeck.length === 0) {
      if (currentDiscard.length === 0) {
        // No cards left anywhere
        break;
      }
      currentDeck = shuffleDeck(currentDiscard, random);
      currentDiscard = [];
    }
    const card = currentDeck.pop();
    if (card) {
      drawn.push(card);
    }
  }

  return {
    drawn,
    newDeck: currentDeck,
    newDiscardPile: currentDiscard
  };
}
