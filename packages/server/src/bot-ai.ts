import { ActionType, CardType, GameFSM, PropertyColor, WildPropertyCard } from '@monopoly-deal/shared';

export class BotAI {
  /**
   * Executes a step for a bot if required by current game state.
   * Returns true if an action was taken.
   */
  public static handleBotAction(fsm: GameFSM): boolean {
    const state = fsm.getState();
    if (state.status !== 'IN_PROGRESS') return false;

    // 1. Pending Action Resolution (JSN or Payment)
    if (state.pendingAction) {
      const action = state.pendingAction;

      // Handle JSN phase
      if (action.status === 'AWAITING_JUST_SAY_NO') {
        const pendingTargets = action.targetPlayerIds.filter(
          (tId) => !action.responsesRecorded[tId] || action.responsesRecorded[tId] === 'PENDING'
        );

        for (const tId of pendingTargets) {
          const player = state.players[tId];
          if (player && player.isBot) {
            // Check if bot holds a Just Say No
            const jsnCard = player.hand.find(
              (c) => c.type === CardType.ACTION && (c as any).actionType === ActionType.JUST_SAY_NO
            );

            // If bot has JSN and debt >= 3M or stealing card, 70% chance to use it
            if (jsnCard && Math.random() < 0.7) {
              fsm.respondJustSayNo(tId, jsnCard.id);
            } else {
              fsm.passJustSayNo(tId);
            }
            return true;
          }
        }
      }

      // Handle Payment phase
      if (action.status === 'AWAITING_PAYMENT') {
        for (const tId of action.targetPlayerIds) {
          const player = state.players[tId];
          if (player && player.isBot && action.responsesRecorded[tId] !== 'PAID') {
            const owed = action.amountOwedPerPlayer[tId] ?? 0;
            const chosenCardIds: string[] = [];
            let total = 0;

            // Pick bank cards first
            for (const c of player.bank) {
              if (total >= owed) break;
              chosenCardIds.push(c.id);
              total += c.value;
            }

            // Pick property cards if still needed
            if (total < owed) {
              for (const s of player.properties) {
                if (total >= owed) break;
                for (const c of s.cards) {
                  if (total >= owed) break;
                  if (c.type === CardType.PROPERTY_WILD && (c as WildPropertyCard).value === 0) {
                    continue; // Skip $0M rainbow wild
                  }
                  chosenCardIds.push(c.id);
                  total += c.value;
                }
              }
            }

            fsm.submitPayment(tId, chosenCardIds);
            return true;
          }
        }
      }
      return false;
    }

    // 2. Active Turn Plays
    const currentId = state.currentTurnPlayerId;
    const activePlayer = state.players[currentId];
    if (!activePlayer || !activePlayer.isBot) return false;

    // Discard phase if hand > 7
    if (state.turnPhase === 'DISCARD_EXCESS') {
      const excess = activePlayer.hand.length - 7;
      if (excess > 0) {
        const toDiscard = activePlayer.hand.slice(0, excess).map((c) => c.id);
        fsm.discardExcessCards(currentId, toDiscard);
        return true;
      }
    }

    if (state.turnPhase !== 'PLAY_CARDS') return false;

    // Bot has remaining plays
    if (state.turnPlaysRemaining > 0 && activePlayer.hand.length > 0) {
      // Priority 1: Play Pass Go
      const passGo = activePlayer.hand.find(
        (c) => c.type === CardType.ACTION && (c as any).actionType === ActionType.PASS_GO
      );
      if (passGo) {
        fsm.playPassGo(currentId, passGo.id);
        return true;
      }

      // Priority 2: Play Properties
      const propertyCard = activePlayer.hand.find((c) => c.type === CardType.PROPERTY);
      if (propertyCard) {
        fsm.playProperty(currentId, propertyCard.id);
        return true;
      }

      // Priority 3: Play Wildcard (Bicolor)
      const wildCard = activePlayer.hand.find(
        (c) => c.type === CardType.PROPERTY_WILD && (c as WildPropertyCard).colors !== 'ALL'
      );
      if (wildCard) {
        fsm.playProperty(currentId, wildCard.id);
        return true;
      }

      // Priority 4: Bank Money
      const moneyCard = activePlayer.hand.find((c) => c.type === CardType.MONEY);
      if (moneyCard) {
        fsm.bankCard(currentId, moneyCard.id);
        return true;
      }

      // Priority 5: Bank unused Action cards as money
      const actionCard = activePlayer.hand.find((c) => c.type === CardType.ACTION);
      if (actionCard && (actionCard as any).actionType !== ActionType.JUST_SAY_NO) {
        fsm.bankCard(currentId, actionCard.id);
        return true;
      }
    }

    // No more favorable plays or plays exhausted: end turn
    fsm.endTurn(currentId);
    return true;
  }
}
