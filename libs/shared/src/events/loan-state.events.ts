import { LoanState } from '@library/entity/enum';
import { IZngEvent } from '@library/shared/common/event/interface/izng-event';
import { LoanEventName, LoanEventNameType } from './event-names';

export class LoanEventBase implements IZngEvent {
  public name: LoanEventNameType;
  public isExternal: boolean;
  public loanId: string;

  constructor() { }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static create(...args: any[]): LoanEventBase { 
    return new LoanEventBase();
  }
}

export class LoanStateChangedEvent extends LoanEventBase {
  public newState: LoanState;
  public oldState: LoanState;

  constructor() {
    super();
  }

  public static override create(loanId: string, oldState: LoanState, newState: LoanState): LoanStateChangedEvent {
    const event = new LoanStateChangedEvent();
    event.name = LoanEventName.LoanStateChanged;
    event.isExternal = true;
    event.loanId = loanId;
    event.oldState = oldState;
    event.newState = newState;
    return event;
  }
}

/**
 * Event representing a progression within the same loan state.
 * This event is used to indicate that a loan has stepped forward in its current state,
 * such as moving to next Repayment Payment without changing the overall state
 */
export class LoanStateSteppedEvent extends LoanEventBase {
  public state: LoanState;

  constructor() {
    super();
  }

  public static override create(loanId: string, state: LoanState): LoanStateSteppedEvent {
    const event = new LoanStateSteppedEvent();
    event.name = LoanEventName.LoanStateStepped;
    event.isExternal = true;
    event.loanId = loanId;
    event.state = state;
    return event;
  }
}
