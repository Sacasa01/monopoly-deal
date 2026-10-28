export enum PropertyColor {
  BROWN = 'BROWN',
  LIGHT_BLUE = 'LIGHT_BLUE',
  PINK = 'PINK',
  ORANGE = 'ORANGE',
  RED = 'RED',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  DARK_BLUE = 'DARK_BLUE',
  RAILROAD = 'RAILROAD',
  UTILITY = 'UTILITY'
}

export enum CardType {
  MONEY = 'MONEY',
  PROPERTY = 'PROPERTY',
  PROPERTY_WILD = 'PROPERTY_WILD',
  RENT = 'RENT',
  ACTION = 'ACTION'
}

export enum ActionType {
  PASS_GO = 'PASS_GO',
  DEAL_BREAKER = 'DEAL_BREAKER',
  JUST_SAY_NO = 'JUST_SAY_NO',
  SLY_DEAL = 'SLY_DEAL',
  FORCED_DEAL = 'FORCED_DEAL',
  DEBT_COLLECTOR = 'DEBT_COLLECTOR',
  ITS_MY_BIRTHDAY = 'ITS_MY_BIRTHDAY',
  DOUBLE_THE_RENT = 'DOUBLE_THE_RENT',
  HOUSE = 'HOUSE',
  HOTEL = 'HOTEL'
}

export interface BaseCard {
  id: string;
  templateId: string;
  name: string;
  type: CardType;
  value: number; // Value in $M
  imagePath: string;
}

export interface MoneyCard extends BaseCard {
  type: CardType.MONEY;
}

export interface StandardPropertyCard extends BaseCard {
  type: CardType.PROPERTY;
  color: PropertyColor;
}

export interface WildPropertyCard extends BaseCard {
  type: CardType.PROPERTY_WILD;
  colors: PropertyColor[] | 'ALL';
  activeColor: PropertyColor;
}

export interface RentCard extends BaseCard {
  type: CardType.RENT;
  colors: [PropertyColor, PropertyColor] | 'ALL';
  target: 'ALL_PLAYERS' | 'SINGLE_PLAYER';
}

export interface ActionCard extends BaseCard {
  type: CardType.ACTION;
  actionType: ActionType;
}

export type Card =
  | MoneyCard
  | StandardPropertyCard
  | WildPropertyCard
  | RentCard
  | ActionCard;

export interface CardBack {
  imagePath: string;
}
