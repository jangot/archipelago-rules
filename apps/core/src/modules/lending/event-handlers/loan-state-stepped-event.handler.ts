import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanState, LoanStateCodes } from '@library/entity/enum';
import { LoanStateSteppedEvent } from '@library/shared/events';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

@Injectable()
@EventsHandler(LoanStateSteppedEvent)
export class LoanStateSteppedEventHandler implements IEventHandler<LoanStateSteppedEvent> {
  private readonly logger: Logger = new Logger(LoanStateSteppedEventHandler.name);
  private readonly supportedSteppedStates: Set<LoanState> = new Set([LoanStateCodes.Repaying]);

  constructor(private readonly domainServices: IDomainServices) {}

  async handle(event: LoanStateSteppedEvent): Promise<boolean | null> {
    const { loanId, state } = event.payload;
    this.logger.debug(`Handling LoanStateSteppedEvent for loanId: ${loanId}, state: ${state}`);

    // Fast return if the state is not supported for stepping
    if (!this.supportedSteppedStates.has(state)) {
      this.logger.debug(`Loan state ${state} for loanId: ${loanId} is not supported for stepping. No action taken.`);
      return false;
    }

    switch (state) {
      case LoanStateCodes.Repaying:
        this.logger.debug(`Initiating repayment amounts left calculation for loanId: ${loanId} due to state stepping in repayment`);
        return this.domainServices.loanServices.refreshRepaymentAmountsLeft(loanId);
      default:
        this.logger.warn(`Unhandled loan state stepping for loanId: ${loanId} with state ${state}`);
        return false;
    }
  }
}
