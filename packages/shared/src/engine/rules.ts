import { PropertyColor, CardType, WildPropertyCard, StandardPropertyCard } from '../types/card.js';
import { PropertySet } from '../types/game.js';

/**
 * Number of properties required to complete a full set for each color.
 */
export const FULL_SET_SIZES: Record<PropertyColor, number> = {
  [PropertyColor.BROWN]: 2,
  [PropertyColor.LIGHT_BLUE]: 3,
  [PropertyColor.PINK]: 3,
  [PropertyColor.ORANGE]: 3,
  [PropertyColor.RED]: 3,
  [PropertyColor.YELLOW]: 3,
  [PropertyColor.GREEN]: 3,
  [PropertyColor.DARK_BLUE]: 2,
  [PropertyColor.RAILROAD]: 4,
  [PropertyColor.UTILITY]: 2
};

/**
 * Rent scale per color based on the number of properties owned in that set.
 * Index 0 corresponds to 1 property, index 1 to 2 properties, etc.
 */
export const RENT_TIERS: Record<PropertyColor, number[]> = {
  [PropertyColor.BROWN]: [1, 2],
  [PropertyColor.LIGHT_BLUE]: [1, 2, 3],
  [PropertyColor.PINK]: [1, 2, 4],
  [PropertyColor.ORANGE]: [1, 3, 5],
  [PropertyColor.RED]: [2, 3, 6],
  [PropertyColor.YELLOW]: [2, 4, 6],
  [PropertyColor.GREEN]: [2, 4, 7],
  [PropertyColor.DARK_BLUE]: [3, 8],
  [PropertyColor.RAILROAD]: [1, 2, 3, 4],
  [PropertyColor.UTILITY]: [1, 2]
};

/**
 * Checks if a property set is complete.
 */
export function isSetComplete(set: PropertySet): boolean {
  const required = FULL_SET_SIZES[set.color];
  return set.cards.length >= required;
}

/**
 * Calculates the base rent for a property set given its current cards.
 */
export function calculateBaseRent(set: PropertySet): number {
  if (set.cards.length === 0) return 0;
  const tiers = RENT_TIERS[set.color];
  const count = Math.min(set.cards.length, tiers.length);
  return tiers[count - 1] ?? 0;
}

/**
 * Calculates the total rent of a set including House, Hotel, and Double Rent multipliers.
 */
export function calculateTotalRent(
  set: PropertySet,
  doubleRentCount: number = 0
): number {
  let rent = calculateBaseRent(set);
  if (rent === 0) return 0;

  // Houses and hotels can only be added to complete sets (and not Railroads/Utilities)
  if (isSetComplete(set)) {
    if (set.hasHouse) {
      rent += 3;
    }
    if (set.hasHotel) {
      rent += 4;
    }
  }

  // Each double rent doubles the total
  for (let i = 0; i < doubleRentCount; i++) {
    rent *= 2;
  }

  return rent;
}

/**
 * Checks whether a House card can be added to the property set.
 * Rules:
 * - Set must be complete
 * - Set cannot already have a house
 * - Color cannot be RAILROAD or UTILITY
 */
export function canAddHouse(set: PropertySet): boolean {
  if (set.color === PropertyColor.RAILROAD || set.color === PropertyColor.UTILITY) {
    return false;
  }
  if (!isSetComplete(set)) return false;
  if (set.hasHouse) return false;
  return true;
}

/**
 * Checks whether a Hotel card can be added to the property set.
 * Rules:
 * - Set must already have a house
 * - Set cannot already have a hotel
 * - Color cannot be RAILROAD or UTILITY
 */
export function canAddHotel(set: PropertySet): boolean {
  if (set.color === PropertyColor.RAILROAD || set.color === PropertyColor.UTILITY) {
    return false;
  }
  if (!set.hasHouse) return false;
  if (set.hasHotel) return false;
  return true;
}

/**
 * Checks if a single property can be targeted by Sly Deal.
 * Rules: Cannot target any card that is part of a complete set!
 */
export function canStealPropertyWithSlyDeal(set: PropertySet): boolean {
  return !isSetComplete(set);
}

/**
 * Checks if a property set can be targeted by Deal Breaker.
 * Rules: Must be a fully completed set!
 */
export function canStealSetWithDealBreaker(set: PropertySet): boolean {
  return isSetComplete(set);
}

/**
 * Evaluates whether a player has won.
 * Rules: Must have 3 completed property sets of DIFFERENT colors.
 */
export function checkWinCondition(propertySets: PropertySet[]): boolean {
  const completedColors = new Set<PropertyColor>();

  for (const set of propertySets) {
    if (isSetComplete(set)) {
      completedColors.add(set.color);
    }
  }

  return completedColors.size >= 3;
}
