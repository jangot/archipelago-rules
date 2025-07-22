import { LoanState } from '@library/entity/enum';
import { IZngEvent } from '@library/shared/common/event/interface/izng-event';
import { LoanEventName, LoanEventNameType } from './event-names';

export class LoanEventBase implements IZngEvent {
  public readonly name: LoanEventNameType;
  public readonly isExternal: boolean;
  public readonly loanId: string;

  constructor(eventName: LoanEventNameType, loanId: string, isExternal: boolean = false) {
    this.name = eventName;
    this.loanId = loanId;
    this.isExternal = isExternal;
  }
}

export class LoanStateChangedEvent extends LoanEventBase {
  public readonly newState: LoanState;
  public readonly oldState: LoanState;

  constructor(loanId: string, newState: LoanState, oldState: LoanState) {
    super(LoanEventName.LoanStateChanged, loanId, true);
    this.newState = newState;
    this.oldState = oldState;
  }
}
