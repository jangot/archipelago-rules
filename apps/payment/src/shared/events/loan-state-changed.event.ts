import { LoanState } from '@library/entity/enum';
import { IZngEvent } from '@library/shared/common/event/interface/izng-event';

// TODO: move to Libs
export class LoanStateChangedEvent implements IZngEvent {
  public readonly name: string; 
  public isExternal: boolean = true;
  public readonly loanId: string;
  public readonly newState: LoanState;
  public readonly oldState: LoanState;

  constructor(loanId: string, newState: LoanState, oldState: LoanState) {
    this.name = 'LoanStateChanged'; // TODO: Move to a common enum for event names
    this.loanId = loanId;
    this.newState = newState;
    this.oldState = oldState;
  }
}
