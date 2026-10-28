import {
  ActionType,
  Card,
  CardType,
  MoneyCard,
  PropertyColor,
  RentCard,
  StandardPropertyCard,
  WildPropertyCard,
  ActionCard
} from '../types/card.js';
import {
  GameState,
  MaskedGameState,
  MaskedPlayerState,
  PendingAction,
  PlayerState,
  PropertySet,
  TurnPhase
} from '../types/game.js';
import { createShuffledDeck, drawCards } from './deck.js';
import {
  calculateTotalRent,
  canAddHotel,
  canAddHouse,
  canStealPropertyWithSlyDeal,
  canStealSetWithDealBreaker,
  checkWinCondition,
  FULL_SET_SIZES,
  isSetComplete
} from './rules.js';

export class GameFSM {
  private state: GameState;

  constructor(initialState?: GameState) {
    if (initialState) {
      this.state = structuredClone(initialState);
    } else {
      this.state = {
        id: 'game-' + Date.now(),
        roomCode: 'DEAL-001',
        status: 'LOBBY',
        players: {},
        playerOrder: [],
        currentTurnPlayerId: '',
        turnPlaysRemaining: 3,
        deck: [],
        discardPile: [],
        pendingAction: null,
        turnPhase: 'PLAY_CARDS',
        winnerId: null,
        turnCount: 0,
        actionLog: []
      };
    }
  }

  public getState(): GameState {
    return structuredClone(this.state);
  }

  public logAction(text: string) {
    this.state.actionLog.push({
      timestamp: Date.now(),
      text
    });
  }

  /**
   * Initializes a match with the given players, dealing 5 cards to each.
   */
  public initializeGame(
    players: { id: string; name: string; isBot?: boolean }[],
    seed?: number
  ): GameState {
    if (players.length < 2 || players.length > 5) {
      throw new Error('Monopoly Deal requires between 2 and 5 players');
    }

    const deck = createShuffledDeck(seed);
    const discardPile: Card[] = [];
    const playerRecord: Record<string, PlayerState> = {};
    const playerOrder = players.map((p) => p.id);

    for (const player of players) {
      const { drawn, newDeck } = drawCards(deck, discardPile, 5);
      deck.length = 0;
      deck.push(...newDeck);

      playerRecord[player.id] = {
        id: player.id,
        name: player.name,
        hand: drawn,
        bank: [],
        properties: [],
        isReady: true,
        isConnected: true,
        isBot: !!player.isBot
      };
    }

    const firstPlayerId = playerOrder[0]!;

    this.state = {
      id: 'game-' + Date.now(),
      roomCode: this.state.roomCode || 'DEAL-001',
      status: 'IN_PROGRESS',
      players: playerRecord,
      playerOrder,
      currentTurnPlayerId: firstPlayerId,
      turnPlaysRemaining: 3,
      deck,
      discardPile,
      pendingAction: null,
      turnPhase: 'PLAY_CARDS',
      winnerId: null,
      turnCount: 1,
      actionLog: [
        {
          timestamp: Date.now(),
          text: `Partida iniciada con ${players.length} jugadores.`
        }
      ]
    };

    // First player turn start: draw 2 cards
    this.executeTurnStartDraw(firstPlayerId);

    return this.getState();
  }

  private executeTurnStartDraw(playerId: string) {
    const player = this.state.players[playerId];
    if (!player) return;

    // Rule: Draw 2 cards (or 5 if hand is empty at turn start)
    const countToDraw = player.hand.length === 0 ? 5 : 2;
    const { drawn, newDeck, newDiscardPile } = drawCards(
      this.state.deck,
      this.state.discardPile,
      countToDraw
    );

    this.state.deck = newDeck;
    this.state.discardPile = newDiscardPile;
    player.hand.push(...drawn);
    this.state.turnPlaysRemaining = 3;
    this.state.turnPhase = 'PLAY_CARDS';

    this.logAction(
      `${player.name} inicia turno y roba ${countToDraw} carta(s).`
    );
  }

  /**
   * Bank a Money, Action, or Rent card as currency.
   */
  public bankCard(playerId: string, cardId: string) {
    this.validateActiveTurn(playerId);

    const player = this.state.players[playerId]!;
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error(`Carta ${cardId} no encontrada en la mano.`);
    }

    const card = player.hand[cardIndex]!;
    if (card.type === CardType.PROPERTY || card.type === CardType.PROPERTY_WILD) {
      throw new Error('Las propiedades no pueden depositarse directamente en el banco.');
    }

    player.hand.splice(cardIndex, 1);
    player.bank.push(card as MoneyCard | ActionCard | RentCard);
    this.state.turnPlaysRemaining--;

    this.logAction(`${player.name} depositó ${card.name} ($${card.value}M) en su Banco.`);
  }

  /**
   * Plays a property or wild card to the player's property zone.
   */
  public playProperty(
    playerId: string,
    cardId: string,
    targetColor?: PropertyColor
  ) {
    this.validateActiveTurn(playerId);

    const player = this.state.players[playerId]!;
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error(`Carta ${cardId} no encontrada en la mano.`);
    }

    const card = player.hand[cardIndex]!;
    if (card.type !== CardType.PROPERTY && card.type !== CardType.PROPERTY_WILD) {
      throw new Error('La carta no es una propiedad ni un comodín.');
    }

    let assignedColor: PropertyColor;

    if (card.type === CardType.PROPERTY) {
      assignedColor = card.color;
    } else {
      // Wildcard
      const wild = card as WildPropertyCard;
      if (wild.colors === 'ALL') {
        if (!targetColor) {
          throw new Error('Debes especificar un color para el comodín multicolor.');
        }
        // Multicolor wild cannot exist by itself in an empty set
        const existingSet = player.properties.find((s) => s.color === targetColor);
        if (!existingSet || existingSet.cards.length === 0) {
          throw new Error(
            'El comodín multicolor 10 colores no puede estar solo; debe acompañar al menos a 1 propiedad con color propio.'
          );
        }
        assignedColor = targetColor;
      } else {
        // Bi-color wildcard
        if (targetColor) {
          if (!wild.colors.includes(targetColor)) {
            throw new Error(`El color ${targetColor} no es válido para este comodín.`);
          }
          assignedColor = targetColor;
        } else {
          assignedColor = wild.colors[0]!;
        }
      }
      wild.activeColor = assignedColor;
    }

    player.hand.splice(cardIndex, 1);
    this.addCardToPlayerPropertySet(player, card as StandardPropertyCard | WildPropertyCard, assignedColor);
    this.state.turnPlaysRemaining--;

    this.logAction(`${player.name} jugó la propiedad ${card.name} (${assignedColor}).`);
    this.checkWin(playerId);
  }

  private addCardToPlayerPropertySet(
    player: PlayerState,
    card: StandardPropertyCard | WildPropertyCard,
    color: PropertyColor
  ) {
    let set = player.properties.find((s) => s.color === color && !s.isComplete);
    if (!set) {
      set = {
        id: `set-${player.id}-${color}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        color,
        cards: [],
        hasHouse: false,
        hasHotel: false,
        isComplete: false
      };
      player.properties.push(set);
    }

    set.cards.push(card);
    set.isComplete = isSetComplete(set);
  }

  /**
   * Free action during own turn: rotate or move a wildcard/property to another set.
   */
  public reorganizeWildcard(
    playerId: string,
    cardId: string,
    targetColor: PropertyColor
  ) {
    this.validateActiveTurn(playerId, false);

    const player = this.state.players[playerId]!;
    let foundSetIndex = -1;
    let foundCardIndex = -1;

    for (let sIdx = 0; sIdx < player.properties.length; sIdx++) {
      const s = player.properties[sIdx]!;
      const cIdx = s.cards.findIndex((c) => c.id === cardId);
      if (cIdx !== -1) {
        foundSetIndex = sIdx;
        foundCardIndex = cIdx;
        break;
      }
    }

    if (foundSetIndex === -1 || foundCardIndex === -1) {
      throw new Error(`Carta ${cardId} no encontrada en las propiedades de ${player.name}.`);
    }

    const currentSet = player.properties[foundSetIndex]!;
    const card = currentSet.cards[foundCardIndex]!;

    if (card.type !== CardType.PROPERTY_WILD) {
      throw new Error('Solo los comodines de propiedad pueden reorientarse de color.');
    }

    const wild = card as WildPropertyCard;
    if (wild.colors !== 'ALL' && !wild.colors.includes(targetColor)) {
      throw new Error(`El comodín no admite el color ${targetColor}.`);
    }

    // Remove from current set
    currentSet.cards.splice(foundCardIndex, 1);
    currentSet.isComplete = isSetComplete(currentSet);

    // If set is no longer complete and had house/hotel, demote them to bank
    if (!currentSet.isComplete) {
      if (currentSet.hasHotel) {
        currentSet.hasHotel = false;
        // Hotel card goes to bank
        const hotelCard = this.state.discardPile.find(
          (c) => c.type === CardType.ACTION && (c as ActionCard).actionType === ActionType.HOTEL
        ) ?? {
          id: `hotel-demoted-${Date.now()}`,
          templateId: 'action-hotel',
          name: 'Hotel',
          type: CardType.ACTION,
          actionType: ActionType.HOTEL,
          value: 4,
          imagePath: 'acciones/Accion_Hotel.jpg'
        };
        player.bank.push(hotelCard as ActionCard);
      }
      if (currentSet.hasHouse) {
        currentSet.hasHouse = false;
        const houseCard = this.state.discardPile.find(
          (c) => c.type === CardType.ACTION && (c as ActionCard).actionType === ActionType.HOUSE
        ) ?? {
          id: `house-demoted-${Date.now()}`,
          templateId: 'action-house',
          name: 'Casa',
          type: CardType.ACTION,
          actionType: ActionType.HOUSE,
          value: 3,
          imagePath: 'acciones/Accion_House.jpg'
        };
        player.bank.push(houseCard as ActionCard);
      }
    }

    // Remove empty sets
    if (currentSet.cards.length === 0) {
      player.properties.splice(foundSetIndex, 1);
    }

    // Add to target set
    wild.activeColor = targetColor;
    this.addCardToPlayerPropertySet(player, wild, targetColor);

    this.logAction(`${player.name} reorganizó su comodín ${wild.name} a ${targetColor}.`);
    this.checkWin(playerId);
  }

  /**
   * Action Card: Pass Go (Draw 2 cards, costs 1 play).
   */
  public playPassGo(playerId: string, cardId: string) {
    this.validateActiveTurn(playerId);

    const player = this.state.players[playerId]!;
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Carta no encontrada en la mano.');

    const card = player.hand[cardIndex]! as ActionCard;
    if (card.actionType !== ActionType.PASS_GO) {
      throw new Error('La carta no es Pass Go.');
    }

    player.hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);
    this.state.turnPlaysRemaining--;

    const { drawn, newDeck, newDiscardPile } = drawCards(
      this.state.deck,
      this.state.discardPile,
      2
    );
    this.state.deck = newDeck;
    this.state.discardPile = newDiscardPile;
    player.hand.push(...drawn);

    this.logAction(`${player.name} jugó Pasa por la Salida y robó 2 cartas.`);
  }

  /**
   * Action Card: Debt Collector (Demands $5M from a single target).
   */
  public playDebtCollector(playerId: string, cardId: string, targetPlayerId: string) {
    this.validateActiveTurn(playerId);
    if (playerId === targetPlayerId) {
      throw new Error('No puedes cobrarte a ti mismo.');
    }
    const target = this.state.players[targetPlayerId];
    if (!target) throw new Error('Jugador objetivo no existe.');

    const player = this.state.players[playerId]!;
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Carta no encontrada en la mano.');

    const card = player.hand[cardIndex]! as ActionCard;
    if (card.actionType !== ActionType.DEBT_COLLECTOR) {
      throw new Error('La carta no es Cobrador de Deudas.');
    }

    player.hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);
    this.state.turnPlaysRemaining--;

    this.state.pendingAction = {
      id: 'action-' + Date.now(),
      initiatorPlayerId: playerId,
      type: ActionType.DEBT_COLLECTOR,
      cardPlayed: card,
      targetPlayerIds: [targetPlayerId],
      amountOwedPerPlayer: { [targetPlayerId]: 5 },
      doubleRentApplied: false,
      status: 'AWAITING_JUST_SAY_NO',
      justSayNoChain: [],
      currentJustSayNoTargetPlayerId: targetPlayerId,
      responsesRecorded: { [targetPlayerId]: 'PENDING' }
    };

    this.state.turnPhase = 'AWAITING_ACTION_RESOLUTION';
    this.logAction(`${player.name} jugó Cobrador de Deudas contra ${target.name} ($5M).`);
  }

  /**
   * Action Card: It's My Birthday (Demands $2M from all other players).
   */
  public playBirthday(playerId: string, cardId: string) {
    this.validateActiveTurn(playerId);

    const player = this.state.players[playerId]!;
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Carta no encontrada en la mano.');

    const card = player.hand[cardIndex]! as ActionCard;
    if (card.actionType !== ActionType.ITS_MY_BIRTHDAY) {
      throw new Error('La carta no es Es mi Cumpleaños.');
    }

    player.hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);
    this.state.turnPlaysRemaining--;

    const targets = this.state.playerOrder.filter((id) => id !== playerId);
    const amountOwed: Record<string, number> = {};
    const responses: Record<string, 'PENDING' | 'ACCEPTED' | 'SAID_NO' | 'PAID'> = {};

    for (const tId of targets) {
      amountOwed[tId] = 2;
      responses[tId] = 'PENDING';
    }

    this.state.pendingAction = {
      id: 'action-' + Date.now(),
      initiatorPlayerId: playerId,
      type: ActionType.ITS_MY_BIRTHDAY,
      cardPlayed: card,
      targetPlayerIds: targets,
      amountOwedPerPlayer: amountOwed,
      doubleRentApplied: false,
      status: 'AWAITING_JUST_SAY_NO',
      justSayNoChain: [],
      responsesRecorded: responses
    };

    this.state.turnPhase = 'AWAITING_ACTION_RESOLUTION';
    this.logAction(`${player.name} jugó Es mi Cumpleaños ($2M a todos).`);
  }

  /**
   * Rent Card: Charges rent for a color.
   */
  public playRent(
    playerId: string,
    rentCardId: string,
    color: PropertyColor,
    targetPlayerId?: string,
    doubleRentCardId?: string
  ) {
    this.validateActiveTurn(playerId);

    const player = this.state.players[playerId]!;
    const rentCardIndex = player.hand.findIndex((c) => c.id === rentCardId);
    if (rentCardIndex === -1) throw new Error('Carta de renta no encontrada en la mano.');

    const rentCard = player.hand[rentCardIndex]!;
    if (rentCard.type !== CardType.RENT) {
      throw new Error('La carta no es una carta de renta.');
    }
    const rentTyped = rentCard as RentCard;

    // Must own properties of that color
    const propertySet = player.properties.find((s) => s.color === color);
    if (!propertySet || propertySet.cards.length === 0) {
      throw new Error(`No posees ninguna propiedad de color ${color} para cobrar renta.`);
    }

    // Validate color match
    if (rentTyped.colors !== 'ALL') {
      if (!rentTyped.colors.includes(color)) {
        throw new Error(`Esta carta de renta no admite el color ${color}.`);
      }
    }

    let doubleRentCount = 0;
    if (doubleRentCardId) {
      if (this.state.turnPlaysRemaining < 2) {
        throw new Error('Necesitas al menos 2 jugadas disponibles para aplicar Doble Renta.');
      }
      const doubleRentIndex = player.hand.findIndex((c) => c.id === doubleRentCardId);
      if (doubleRentIndex === -1) throw new Error('Doble Renta no encontrada en la mano.');
      const doubleRentCard = player.hand[doubleRentIndex]! as ActionCard;
      if (doubleRentCard.actionType !== ActionType.DOUBLE_THE_RENT) {
        throw new Error('La carta no es Doble Renta.');
      }

      player.hand.splice(doubleRentIndex, 1);
      this.state.discardPile.push(doubleRentCard);
      this.state.turnPlaysRemaining--;
      doubleRentCount = 1;
    }

    // Discard rent card & decrement play
    player.hand.splice(rentCardIndex, 1);
    this.state.discardPile.push(rentTyped);
    this.state.turnPlaysRemaining--;

    const totalRent = calculateTotalRent(propertySet, doubleRentCount);

    let targets: string[];
    if (rentTyped.target === 'SINGLE_PLAYER') {
      if (!targetPlayerId || targetPlayerId === playerId) {
        throw new Error('Debes especificar un rival objetivo para la renta multicolor.');
      }
      targets = [targetPlayerId];
    } else {
      targets = this.state.playerOrder.filter((id) => id !== playerId);
    }

    const amountOwed: Record<string, number> = {};
    const responses: Record<string, 'PENDING' | 'ACCEPTED' | 'SAID_NO' | 'PAID'> = {};
    for (const tId of targets) {
      amountOwed[tId] = totalRent;
      responses[tId] = 'PENDING';
    }

    this.state.pendingAction = {
      id: 'action-' + Date.now(),
      initiatorPlayerId: playerId,
      type: 'RENT',
      cardPlayed: rentTyped,
      targetPlayerIds: targets,
      amountOwedPerPlayer: amountOwed,
      doubleRentApplied: doubleRentCount > 0,
      status: 'AWAITING_JUST_SAY_NO',
      justSayNoChain: [],
      responsesRecorded: responses
    };

    this.state.turnPhase = 'AWAITING_ACTION_RESOLUTION';
    this.logAction(
      `${player.name} cobró Renta de ${color} ($${totalRent}M${
        doubleRentCount > 0 ? ' [DOBLADA]' : ''
      }).`
    );
  }

  /**
   * Action Card: Sly Deal (Steals 1 property not part of a full set).
   */
  public playSlyDeal(
    playerId: string,
    cardId: string,
    targetPlayerId: string,
    targetPropertyId: string
  ) {
    this.validateActiveTurn(playerId);
    if (playerId === targetPlayerId) throw new Error('No puedes robarte a ti mismo.');

    const target = this.state.players[targetPlayerId];
    if (!target) throw new Error('Jugador objetivo no existe.');

    const targetSet = target.properties.find((s) =>
      s.cards.some((c) => c.id === targetPropertyId)
    );
    if (!targetSet) throw new Error('Propiedad objetivo no encontrada en la mesa del rival.');

    if (!canStealPropertyWithSlyDeal(targetSet)) {
      throw new Error('¡No puedes robar una propiedad que forma parte de un set completo!');
    }

    const targetCard = targetSet.cards.find((c) => c.id === targetPropertyId)!;

    const player = this.state.players[playerId]!;
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Carta no encontrada en mano.');

    const card = player.hand[cardIndex]! as ActionCard;
    if (card.actionType !== ActionType.SLY_DEAL) throw new Error('La carta no es Robo Astuto.');

    player.hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);
    this.state.turnPlaysRemaining--;

    this.state.pendingAction = {
      id: 'action-' + Date.now(),
      initiatorPlayerId: playerId,
      type: ActionType.SLY_DEAL,
      cardPlayed: card,
      targetPlayerIds: [targetPlayerId],
      amountOwedPerPlayer: {},
      doubleRentApplied: false,
      stolenProperty: targetCard,
      status: 'AWAITING_JUST_SAY_NO',
      justSayNoChain: [],
      currentJustSayNoTargetPlayerId: targetPlayerId,
      responsesRecorded: { [targetPlayerId]: 'PENDING' }
    };

    this.state.turnPhase = 'AWAITING_ACTION_RESOLUTION';
    this.logAction(`${player.name} jugó Robo Astuto contra ${target.name} por ${targetCard.name}.`);
  }

  /**
   * Action Card: Forced Deal (Swaps properties, neither part of a full set).
   */
  public playForcedDeal(
    playerId: string,
    cardId: string,
    targetPlayerId: string,
    myPropertyId: string,
    targetPropertyId: string
  ) {
    this.validateActiveTurn(playerId);
    if (playerId === targetPlayerId) throw new Error('No puedes intercambiar contigo mismo.');

    const player = this.state.players[playerId]!;
    const target = this.state.players[targetPlayerId];
    if (!target) throw new Error('Jugador objetivo no existe.');

    const mySet = player.properties.find((s) => s.cards.some((c) => c.id === myPropertyId));
    if (!mySet) throw new Error('Tu propiedad elegida no está en tu mesa.');
    if (mySet.isComplete) throw new Error('No puedes entregar una propiedad de un set completo.');

    const targetSet = target.properties.find((s) =>
      s.cards.some((c) => c.id === targetPropertyId)
    );
    if (!targetSet) throw new Error('La propiedad del rival no está en su mesa.');
    if (targetSet.isComplete) {
      throw new Error('No puedes pedir una propiedad perteneciente a un set completo.');
    }

    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Carta no encontrada en mano.');
    const card = player.hand[cardIndex]! as ActionCard;
    if (card.actionType !== ActionType.FORCED_DEAL) throw new Error('La carta no es Trato Forzoso.');

    const myCard = mySet.cards.find((c) => c.id === myPropertyId)!;
    const targetCard = targetSet.cards.find((c) => c.id === targetPropertyId)!;

    player.hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);
    this.state.turnPlaysRemaining--;

    this.state.pendingAction = {
      id: 'action-' + Date.now(),
      initiatorPlayerId: playerId,
      type: ActionType.FORCED_DEAL,
      cardPlayed: card,
      targetPlayerIds: [targetPlayerId],
      amountOwedPerPlayer: {},
      doubleRentApplied: false,
      swappedMyProperty: myCard,
      swappedTargetProperty: targetCard,
      status: 'AWAITING_JUST_SAY_NO',
      justSayNoChain: [],
      currentJustSayNoTargetPlayerId: targetPlayerId,
      responsesRecorded: { [targetPlayerId]: 'PENDING' }
    };

    this.state.turnPhase = 'AWAITING_ACTION_RESOLUTION';
    this.logAction(
      `${player.name} propuso Trato Forzoso a ${target.name}: ${myCard.name} por ${targetCard.name}.`
    );
  }

  /**
   * Action Card: Deal Breaker (Steals an entire completed set).
   */
  public playDealBreaker(
    playerId: string,
    cardId: string,
    targetPlayerId: string,
    targetSetColor: PropertyColor
  ) {
    this.validateActiveTurn(playerId);
    if (playerId === targetPlayerId) throw new Error('No puedes robarte a ti mismo.');

    const target = this.state.players[targetPlayerId];
    if (!target) throw new Error('Jugador objetivo no existe.');

    const targetSet = target.properties.find((s) => s.color === targetSetColor && s.isComplete);
    if (!targetSet) throw new Error('El rival no tiene un set completo de ese color.');

    const player = this.state.players[playerId]!;
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Carta no encontrada en mano.');
    const card = player.hand[cardIndex]! as ActionCard;
    if (card.actionType !== ActionType.DEAL_BREAKER) throw new Error('La carta no es Robanegocios.');

    player.hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);
    this.state.turnPlaysRemaining--;

    this.state.pendingAction = {
      id: 'action-' + Date.now(),
      initiatorPlayerId: playerId,
      type: ActionType.DEAL_BREAKER,
      cardPlayed: card,
      targetPlayerIds: [targetPlayerId],
      amountOwedPerPlayer: {},
      doubleRentApplied: false,
      stolenSetColor: targetSetColor,
      status: 'AWAITING_JUST_SAY_NO',
      justSayNoChain: [],
      currentJustSayNoTargetPlayerId: targetPlayerId,
      responsesRecorded: { [targetPlayerId]: 'PENDING' }
    };

    this.state.turnPhase = 'AWAITING_ACTION_RESOLUTION';
    this.logAction(
      `${player.name} jugó Robanegocios contra ${target.name} para robar el set completo de ${targetSetColor}!`
    );
  }

  /**
   * Action Card: House (Adds +$3M rent to complete set, not RR/Utility).
   */
  public playHouse(playerId: string, cardId: string, targetColor: PropertyColor) {
    this.validateActiveTurn(playerId);

    const player = this.state.players[playerId]!;
    const set = player.properties.find((s) => s.color === targetColor);
    if (!set) throw new Error('No posees ese set.');
    if (!canAddHouse(set)) {
      throw new Error('No puedes añadir una casa: el set debe estar completo, sin casa, y no ser estación/servicio.');
    }

    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Carta no encontrada en mano.');
    const card = player.hand[cardIndex]! as ActionCard;
    if (card.actionType !== ActionType.HOUSE) throw new Error('La carta no es Casa.');

    player.hand.splice(cardIndex, 1);
    set.hasHouse = true;
    this.state.turnPlaysRemaining--;

    this.logAction(`${player.name} añadió una Casa al set ${targetColor}.`);
  }

  /**
   * Action Card: Hotel (Adds +$4M rent to complete set with House).
   */
  public playHotel(playerId: string, cardId: string, targetColor: PropertyColor) {
    this.validateActiveTurn(playerId);

    const player = this.state.players[playerId]!;
    const set = player.properties.find((s) => s.color === targetColor);
    if (!set) throw new Error('No posees ese set.');
    if (!canAddHotel(set)) {
      throw new Error('No puedes añadir un hotel: el set debe tener previamente una Casa.');
    }

    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Carta no encontrada en mano.');
    const card = player.hand[cardIndex]! as ActionCard;
    if (card.actionType !== ActionType.HOTEL) throw new Error('La carta no es Hotel.');

    player.hand.splice(cardIndex, 1);
    set.hasHotel = true;
    this.state.turnPlaysRemaining--;

    this.logAction(`${player.name} añadió un Hotel al set ${targetColor}.`);
  }

  /**
   * Responds to pending action with a Just Say No card.
   */
  public respondJustSayNo(playerId: string, jsnCardId: string) {
    const action = this.state.pendingAction;
    if (!action) throw new Error('No hay ninguna acción pendiente.');

    const player = this.state.players[playerId];
    if (!player) throw new Error('Jugador no existe.');

    const cardIndex = player.hand.findIndex((c) => c.id === jsnCardId);
    if (cardIndex === -1) throw new Error('Just Say No no encontrada en mano.');
    const card = player.hand[cardIndex]! as ActionCard;
    if (card.actionType !== ActionType.JUST_SAY_NO) {
      throw new Error('La carta no es Just Say No.');
    }

    player.hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);

    action.justSayNoChain.push({ playerId, cardId: jsnCardId });

    // The counter-target is now the player who played the previous card in chain or the initiator
    const previousPlayerId =
      action.justSayNoChain.length === 1
        ? action.initiatorPlayerId
        : action.justSayNoChain[action.justSayNoChain.length - 2]!.playerId;

    action.currentJustSayNoTargetPlayerId = previousPlayerId;
    this.logAction(`${player.name} ¡jugó Di que No!`);
  }

  /**
   * Declines playing Just Say No (or accepts after chain ends).
   */
  public passJustSayNo(playerId: string) {
    const action = this.state.pendingAction;
    if (!action) throw new Error('No hay ninguna acción pendiente.');

    // If there is an active JSN chain and the player asked to counter passes:
    if (action.justSayNoChain.length > 0) {
      const isOddChain = action.justSayNoChain.length % 2 === 1;
      // If odd: target successfully blocked action!
      if (isOddChain) {
        action.responsesRecorded[playerId] = 'SAID_NO';
        this.logAction(`El Di que No tuvo éxito: la acción quedó bloqueada para ${playerId}.`);
        this.checkActionCompletion();
        return;
      }
    }

    // Otherwise, player accepted the action
    action.responsesRecorded[playerId] = 'ACCEPTED';

    // If action is monetary (Debt, Birthday, Rent), move to payment phase
    if (
      action.type === ActionType.DEBT_COLLECTOR ||
      action.type === ActionType.ITS_MY_BIRTHDAY ||
      action.type === 'RENT'
    ) {
      action.status = 'AWAITING_PAYMENT';
      this.logAction(`${this.state.players[playerId]!.name} procede al pago de su deuda.`);
    } else {
      // It's a property action (Sly Deal, Forced Deal, Deal Breaker) -> Execute immediately!
      this.executePropertyAction(action, playerId);
      this.checkActionCompletion();
    }
  }

  private executePropertyAction(action: PendingAction, targetPlayerId: string) {
    const initiator = this.state.players[action.initiatorPlayerId]!;
    const target = this.state.players[targetPlayerId]!;

    if (action.type === ActionType.SLY_DEAL && action.stolenProperty) {
      // Steal single property
      this.transferProperty(target, initiator, action.stolenProperty.id);
      this.logAction(`${initiator.name} robó ${action.stolenProperty.name} de ${target.name}.`);
    } else if (
      action.type === ActionType.FORCED_DEAL &&
      action.swappedMyProperty &&
      action.swappedTargetProperty
    ) {
      // Swap properties
      this.transferProperty(target, initiator, action.swappedTargetProperty.id);
      this.transferProperty(initiator, target, action.swappedMyProperty.id);
      this.logAction(
        `${initiator.name} intercambió ${action.swappedMyProperty.name} por ${action.swappedTargetProperty.name} con ${target.name}.`
      );
    } else if (action.type === ActionType.DEAL_BREAKER && action.stolenSetColor) {
      // Steal full set
      const setIdx = target.properties.findIndex(
        (s) => s.color === action.stolenSetColor && s.isComplete
      );
      if (setIdx !== -1) {
        const fullSet = target.properties.splice(setIdx, 1)[0]!;
        initiator.properties.push(fullSet);
        this.logAction(
          `${initiator.name} robó el set completo de ${action.stolenSetColor} de ${target.name}!`
        );
      }
    }

    this.checkWin(action.initiatorPlayerId);
  }

  private transferProperty(fromPlayer: PlayerState, toPlayer: PlayerState, cardId: string) {
    for (let sIdx = 0; sIdx < fromPlayer.properties.length; sIdx++) {
      const s = fromPlayer.properties[sIdx]!;
      const cIdx = s.cards.findIndex((c) => c.id === cardId);
      if (cIdx !== -1) {
        const [card] = s.cards.splice(cIdx, 1);
        s.isComplete = isSetComplete(s);
        if (s.cards.length === 0) {
          fromPlayer.properties.splice(sIdx, 1);
        }
        if (card) {
          const color =
            card.type === CardType.PROPERTY_WILD
              ? (card as WildPropertyCard).activeColor
              : (card as StandardPropertyCard).color;
          this.addCardToPlayerPropertySet(toPlayer, card, color);
        }
        break;
      }
    }
  }

  /**
   * Submits debt payment using cards from debtor's table (Bank and/or Properties). Hand is immune!
   */
  public submitPayment(debtorPlayerId: string, paymentCardIds: string[]) {
    const action = this.state.pendingAction;
    if (!action) throw new Error('No hay cobro pendiente.');

    const debtor = this.state.players[debtorPlayerId];
    if (!debtor) throw new Error('Deudor no existe.');

    const initiator = this.state.players[action.initiatorPlayerId]!;
    const owed = action.amountOwedPerPlayer[debtorPlayerId] ?? 0;

    // Gather selected cards from bank and properties
    const selectedCards: Card[] = [];
    const bankCardsToRemove: number[] = [];
    const propertyCardsToRemove: { setIdx: number; cardIdx: number; card: Card }[] = [];

    // Check bank
    for (let i = 0; i < debtor.bank.length; i++) {
      const c = debtor.bank[i]!;
      if (paymentCardIds.includes(c.id)) {
        selectedCards.push(c);
        bankCardsToRemove.push(i);
      }
    }

    // Check properties
    for (let sIdx = 0; sIdx < debtor.properties.length; sIdx++) {
      const s = debtor.properties[sIdx]!;
      for (let cIdx = 0; cIdx < s.cards.length; cIdx++) {
        const c = s.cards[cIdx]!;
        if (paymentCardIds.includes(c.id)) {
          if (c.type === CardType.PROPERTY_WILD && (c as WildPropertyCard).value === 0) {
            throw new Error('El comodín multicolor vale $0M y no puede usarse para pagar deudas.');
          }
          selectedCards.push(c);
          propertyCardsToRemove.push({ setIdx: sIdx, cardIdx: cIdx, card: c });
        }
      }
    }

    if (selectedCards.length !== paymentCardIds.length) {
      throw new Error('Una o más cartas seleccionadas no están en la mesa del deudor.');
    }

    const totalOffered = selectedCards.reduce((sum, c) => sum + c.value, 0);

    // Calculate maximum possible payment the debtor could make from table
    const tableBankValue = debtor.bank.reduce((sum, c) => sum + c.value, 0);
    const tablePropertyValue = debtor.properties.reduce(
      (sum, s) =>
        sum +
        s.cards.reduce(
          (cSum, c) =>
            cSum + (c.type === CardType.PROPERTY_WILD && (c as WildPropertyCard).value === 0 ? 0 : c.value),
          0
        ),
      0
    );
    const maxTableValue = tableBankValue + tablePropertyValue;

    // Rule: Must satisfy debt OR surrender everything on table (partial insolvency)
    if (totalOffered < owed && totalOffered < maxTableValue) {
      throw new Error(
        `Pago insuficiente ($${totalOffered}M ofrecidos vs $${owed}M adeudados). Debes pagar la totalidad de la deuda o entregar todas las cartas de tu mesa si no te alcanza.`
      );
    }

    // Remove bank cards (in reverse order of indices)
    bankCardsToRemove.sort((a, b) => b - a);
    for (const idx of bankCardsToRemove) {
      const [removed] = debtor.bank.splice(idx, 1);
      if (removed) {
        initiator.bank.push(removed);
      }
    }

    // Remove property cards
    for (const item of propertyCardsToRemove) {
      const s = debtor.properties[item.setIdx];
      if (s) {
        const cIdx = s.cards.findIndex((c) => c.id === item.card.id);
        if (cIdx !== -1) {
          s.cards.splice(cIdx, 1);
          s.isComplete = isSetComplete(s);
          const color =
            item.card.type === CardType.PROPERTY_WILD
              ? (item.card as WildPropertyCard).activeColor
              : (item.card as StandardPropertyCard).color;
          this.addCardToPlayerPropertySet(
            initiator,
            item.card as StandardPropertyCard | WildPropertyCard,
            color
          );
        }
      }
    }

    // Clean up empty sets
    debtor.properties = debtor.properties.filter((s) => s.cards.length > 0);

    action.responsesRecorded[debtorPlayerId] = 'PAID';
    this.logAction(
      `${debtor.name} pagó $${totalOffered}M a ${initiator.name} con ${selectedCards.length} carta(s) (Sin cambio).`
    );

    this.checkWin(action.initiatorPlayerId);
    this.checkActionCompletion();
  }

  private checkActionCompletion() {
    const action = this.state.pendingAction;
    if (!action) return;

    const allFinished = action.targetPlayerIds.every(
      (tId) => action.responsesRecorded[tId] && action.responsesRecorded[tId] !== 'PENDING'
    );

    if (allFinished) {
      this.state.pendingAction = null;
      this.state.turnPhase = 'PLAY_CARDS';
      this.logAction('Acción resuelta por completo.');
    }
  }

  /**
   * End player's turn. Checks hand limit (7 cards).
   */
  public endTurn(playerId: string) {
    this.validateActiveTurn(playerId, false);

    if (this.state.pendingAction !== null) {
      throw new Error('No puedes finalizar turno mientras haya una acción pendiente.');
    }

    const player = this.state.players[playerId]!;

    // Check hand limit (7 cards)
    if (player.hand.length > 7) {
      this.state.turnPhase = 'DISCARD_EXCESS';
      this.logAction(`${player.name} debe descartar ${player.hand.length - 7} carta(s) en exceso.`);
      return;
    }

    this.advanceTurn();
  }

  /**
   * Discards excess cards to bring hand to 7.
   */
  public discardExcessCards(playerId: string, cardIds: string[]) {
    this.validateActiveTurn(playerId, false);

    if (this.state.turnPhase !== 'DISCARD_EXCESS') {
      throw new Error('No estás en la fase de descarte de exceso.');
    }

    const player = this.state.players[playerId]!;
    const excess = player.hand.length - 7;
    if (cardIds.length !== excess) {
      throw new Error(`Debes descartar exactamente ${excess} carta(s).`);
    }

    for (const cId of cardIds) {
      const idx = player.hand.findIndex((c) => c.id === cId);
      if (idx === -1) throw new Error(`Carta ${cId} no encontrada en mano.`);
      const [discarded] = player.hand.splice(idx, 1);
      if (discarded) {
        this.state.discardPile.push(discarded);
      }
    }

    this.logAction(`${player.name} descartó ${excess} carta(s).`);
    this.advanceTurn();
  }

  private advanceTurn() {
    const currentIdx = this.state.playerOrder.indexOf(this.state.currentTurnPlayerId);
    const nextIdx = (currentIdx + 1) % this.state.playerOrder.length;
    const nextPlayerId = this.state.playerOrder[nextIdx]!;

    this.state.currentTurnPlayerId = nextPlayerId;
    this.state.turnCount++;

    this.executeTurnStartDraw(nextPlayerId);
  }

  private checkWin(playerId: string) {
    // Rule: Winner must hold 3 completed sets of different colors during their own active turn
    if (this.state.currentTurnPlayerId !== playerId) return;

    const player = this.state.players[playerId];
    if (!player) return;

    if (checkWinCondition(player.properties)) {
      this.state.status = 'FINISHED';
      this.state.winnerId = playerId;
      this.state.turnPhase = 'GAME_OVER';
      this.logAction(`🏆 ¡¡${player.name} ha ganado la partida con 3 sets completos!! 🏆`);
    }
  }

  private validateActiveTurn(playerId: string, requirePlaysRemaining: boolean = true) {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new Error('La partida no está en curso.');
    }
    if (this.state.currentTurnPlayerId !== playerId) {
      throw new Error('No es el turno de este jugador.');
    }
    if (this.state.turnPhase !== 'PLAY_CARDS') {
      throw new Error(`No puedes jugar cartas en la fase actual (${this.state.turnPhase}).`);
    }
    if (requirePlaysRemaining && this.state.turnPlaysRemaining <= 0) {
      throw new Error('Ya has agotado tus 3 jugadas de este turno.');
    }
  }

  /**
   * Generates a masked game state for a specific player, hiding opponents' hand cards.
   */
  public getMaskedState(playerId: string): MaskedGameState {
    const maskedPlayers: Record<string, MaskedPlayerState> = {};

    for (const [pId, p] of Object.entries(this.state.players)) {
      const bankVal = p.bank.reduce((sum, c) => sum + c.value, 0);
      maskedPlayers[pId] = {
        id: p.id,
        name: p.name,
        handCount: p.hand.length,
        bank: p.bank,
        properties: p.properties,
        bankValue: bankVal,
        isReady: p.isReady,
        isConnected: p.isConnected,
        isBot: p.isBot
      };
    }

    const myHand = this.state.players[playerId]?.hand ?? [];

    return {
      id: this.state.id,
      roomCode: this.state.roomCode,
      status: this.state.status,
      myPlayerId: playerId,
      myHand,
      players: maskedPlayers,
      playerOrder: this.state.playerOrder,
      currentTurnPlayerId: this.state.currentTurnPlayerId,
      turnPlaysRemaining: this.state.turnPlaysRemaining,
      deckCount: this.state.deck.length,
      discardPile: this.state.discardPile,
      pendingAction: this.state.pendingAction,
      turnPhase: this.state.turnPhase,
      winnerId: this.state.winnerId,
      turnCount: this.state.turnCount,
      actionLog: this.state.actionLog
    };
  }
}
