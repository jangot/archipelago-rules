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

export class LoanStateChangedEvent extends ZirtueDistributedEvent<LoanEventStateChangePayload> {
  public static create(loanId: string, oldState: LoanState, newState: LoanState): LoanStateChangedEvent {
    return new LoanStateChangedEvent({ loanId, oldState, newState });
  }
}

/**
 * Event representing a progression within the same loan state.
 * This event is used to indicate that a loan has stepped forward in its current state,
 * such as moving to next Repayment Payment without changing the overall state
 */
export class LoanStateSteppedEvent extends ZirtueDistributedEvent<LoanEventStateStoppedPayload> {
  public static create(loanId: string, state: LoanState): LoanStateSteppedEvent {
    return new LoanStateSteppedEvent({ loanId, state });
  }
}
