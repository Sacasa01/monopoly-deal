import { describe, it, expect } from 'vitest';
import { PropertyColor } from '../src/types/card.js';
import { PropertySet } from '../src/types/game.js';
import {
  calculateBaseRent,
  calculateTotalRent,
  canAddHouse,
  canAddHotel,
  checkWinCondition,
  isSetComplete,
  FULL_SET_SIZES
} from '../src/engine/rules.js';

describe('Monopoly Deal Rules Engine', () => {
  it('correctly reports set completion based on full set sizes', () => {
    const darkBlueSet: PropertySet = {
      id: 'set-1',
      color: PropertyColor.DARK_BLUE,
      cards: [
        {
          id: 'c1',
          templateId: 'p1',
          name: 'Paseo de la Castellana',
          type: 1 as any,
          value: 4,
          color: PropertyColor.DARK_BLUE,
          imagePath: ''
        },
        {
          id: 'c2',
          templateId: 'p2',
          name: 'Paseo del Prado',
          type: 1 as any,
          value: 4,
          color: PropertyColor.DARK_BLUE,
          imagePath: ''
        }
      ],
      hasHouse: false,
      hasHotel: false,
      isComplete: false
    };

    expect(isSetComplete(darkBlueSet)).toBe(true);
    expect(FULL_SET_SIZES[PropertyColor.DARK_BLUE]).toBe(2);
  });

  it('calculates rent correctly with House, Hotel, and Double Rent', () => {
    const greenSet: PropertySet = {
      id: 'set-green',
      color: PropertyColor.GREEN,
      cards: [
        { id: 'g1', templateId: 't1', name: 'G1', type: 1 as any, value: 4, color: PropertyColor.GREEN, imagePath: '' },
        { id: 'g2', templateId: 't2', name: 'G2', type: 1 as any, value: 4, color: PropertyColor.GREEN, imagePath: '' },
        { id: 'g3', templateId: 't3', name: 'G3', type: 1 as any, value: 4, color: PropertyColor.GREEN, imagePath: '' }
      ],
      hasHouse: false,
      hasHotel: false,
      isComplete: true
    };

    // Full green set base rent = $7M
    expect(calculateBaseRent(greenSet)).toBe(7);

    // Can add house
    expect(canAddHouse(greenSet)).toBe(true);
    greenSet.hasHouse = true;
    // With house: $7M + $3M = $10M
    expect(calculateTotalRent(greenSet, 0)).toBe(10);

    // Can add hotel
    expect(canAddHotel(greenSet)).toBe(true);
    greenSet.hasHotel = true;
    // With hotel: $10M + $4M = $14M
    expect(calculateTotalRent(greenSet, 0)).toBe(14);

    // With Double Rent: $14M * 2 = $28M
    expect(calculateTotalRent(greenSet, 1)).toBe(28);

    // With 2x Double Rent: $14M * 4 = $56M
    expect(calculateTotalRent(greenSet, 2)).toBe(56);
  });

  it('disallows houses and hotels on Railroads and Utilities', () => {
    const railroadSet: PropertySet = {
      id: 'set-rr',
      color: PropertyColor.RAILROAD,
      cards: [
        { id: 'r1', templateId: 't', name: 'R1', type: 1 as any, value: 2, color: PropertyColor.RAILROAD, imagePath: '' },
        { id: 'r2', templateId: 't', name: 'R2', type: 1 as any, value: 2, color: PropertyColor.RAILROAD, imagePath: '' },
        { id: 'r3', templateId: 't', name: 'R3', type: 1 as any, value: 2, color: PropertyColor.RAILROAD, imagePath: '' },
        { id: 'r4', templateId: 't', name: 'R4', type: 1 as any, value: 2, color: PropertyColor.RAILROAD, imagePath: '' }
      ],
      hasHouse: false,
      hasHotel: false,
      isComplete: true
    };

    expect(canAddHouse(railroadSet)).toBe(false);
    expect(canAddHotel(railroadSet)).toBe(false);
  });

  it('validates win condition: exactly 3 completed sets of DIFFERENT colors', () => {
    const createCompleteSet = (id: string, color: PropertyColor, count: number): PropertySet => ({
      id,
      color,
      cards: Array.from({ length: count }, (_, i) => ({
        id: `${id}-${i}`,
        templateId: 't',
        name: 'Prop',
        type: 1 as any,
        value: 1,
        color,
        imagePath: ''
      })),
      hasHouse: false,
      hasHotel: false,
      isComplete: true
    });

    const set1 = createCompleteSet('s1', PropertyColor.BROWN, 2);
    const set2 = createCompleteSet('s2', PropertyColor.DARK_BLUE, 2);
    const set3 = createCompleteSet('s3', PropertyColor.UTILITY, 2);

    // 2 complete sets: not yet won
    expect(checkWinCondition([set1, set2])).toBe(false);

    // 3 complete sets of distinct colors: WIN!
    expect(checkWinCondition([set1, set2, set3])).toBe(true);

    // 3 complete sets but 2 of same color (e.g. 2 dark blue sets + 1 brown = 2 colors): NOT won
    const duplicateColorSet = createCompleteSet('s4', PropertyColor.DARK_BLUE, 2);
    expect(checkWinCondition([set1, set2, duplicateColorSet])).toBe(false);
  });
});
