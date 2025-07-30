import { LoanState } from '@library/entity/enum';
import { ZirtueDistributedEvent } from '@library/shared/modules/event';

class LoanEventPayload {
  constructor(public loanId: string) {}
}

class LoanEventStateChangePayload extends LoanEventPayload {
  public newState: LoanState;
  public oldState: LoanState;
}

class LoanEventStateStoppedPayload extends LoanEventPayload {
  public state: LoanState;
}

/**
 * Event representing a change in the state of a Loan.
 * 
 * This event is fired when a loan transitions from one state to another,
 * such as from 'Accepted' to 'Funding'.
 * 
 * @remarks
 * - Source: `core` service (triggered on loan state change)
 * - Target: `payment` service (handled by LoanStateChangedEventHandler)
 */
export class LoanStateChangedEvent extends ZirtueDistributedEvent<LoanEventStateChangePayload> {
  /**
   * Creates a new LoanStateChangedEvent instance.
   * 
   * @param loanId - The unique identifier of the loan
   * @param oldState - The previous state of the loan
   * @param newState - The new state of the loan
   * @returns A new LoanStateChangedEvent instance
   */
  public static create(loanId: string, oldState: LoanState, newState: LoanState): LoanStateChangedEvent {
    return new LoanStateChangedEvent({ loanId, oldState, newState });
  }
}

/**
 * Event representing a progression within the same loan state.
 * 
 * This event is fired when a loan steps forward in its current state without
 * transitioning to a different state, such as moving to the next repayment
 * payment while remaining in the 'Repaying' state.
 * 
 * @remarks
 * - Source: `core` service (triggered on loan state progression)
 * - Targets: 
 *   - `payment` service (handled by LoanStateSteppedEventHandler) to initiate new Repayment Payment
 *   - `core` service (handled by LoanStateSteppedEventHandler) to update Loan remaining amounts left
 */
export class LoanStateSteppedEvent extends ZirtueDistributedEvent<LoanEventStateStoppedPayload> {
  /**
   * Creates a new LoanStateSteppedEvent instance.
   * 
   * @param loanId - The unique identifier of the loan
   * @param state - The current state of the loan
   * @returns A new LoanStateSteppedEvent instance
   */
  public static create(loanId: string, state: LoanState): LoanStateSteppedEvent {
    return new LoanStateSteppedEvent({ loanId, state });
  }
}
