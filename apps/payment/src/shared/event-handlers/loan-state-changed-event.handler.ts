import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LoanStateChangedEvent } from '@library/shared/events';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { LoanPaymentService } from '@payment/modules/services';

@Injectable()
@EventsHandler(LoanStateChangedEvent)
export class LoanStateChangedEventHandler implements IEventHandler<LoanStateChangedEvent> {
  private readonly logger: Logger = new Logger(LoanStateChangedEventHandler.name);

  private readonly supportedTransitions: Map<LoanState, LoanState> = new Map([
    [LoanStateCodes.Accepted, LoanStateCodes.Funding], // on Loan Accepted
    [LoanStateCodes.FundingPaused, LoanStateCodes.Funding], // on Funding Pause resumed
    [LoanStateCodes.Funded, LoanStateCodes.Disbursing], // on transition from Funding to Disbursment
    [LoanStateCodes.DisbursingPaused, LoanStateCodes.Disbursing], // on Disbursing Pause resumed
    [LoanStateCodes.Disbursed, LoanStateCodes.Repaying], // on transition from Disbursement to Repayment
    [LoanStateCodes.RepaymentPaused, LoanStateCodes.Repaying], // on Repayment Pause resumed
  ]);

  private readonly supportedLoanStateToPaymentType: Map<LoanState, LoanPaymentType> = new Map([
    [LoanStateCodes.Funding, LoanPaymentTypeCodes.Funding],
    [LoanStateCodes.Disbursing, LoanPaymentTypeCodes.Disbursement],
    [LoanStateCodes.Repaying, LoanPaymentTypeCodes.Repayment],
  ]);

  constructor(private readonly paymentService: LoanPaymentService) {}

  async handle(event: LoanStateChangedEvent): Promise<boolean | null> {
    const { loanId, newState, oldState } = event.payload;
    this.logger.debug(`Handling LoanStateChangedEvent for loanId: ${loanId}, newState: ${newState}, oldState: ${oldState}`);

    // Fast return if no actual state change
    if (newState === oldState) {
      this.logger.debug(`Loan state for loanId: ${loanId} has not changed. No action taken.`);
      return false;
    }

    // Check that Loan changed state that requires payment initiation, return false otherwise
    const newStateTransition = this.supportedTransitions.get(oldState);
    if (!newStateTransition || newStateTransition !== newState) {
      this.logger.debug(`Loan state change from ${oldState} to ${newState} is not supported for payment initiation.`);
      return false;
    }

    // Initiate payment for the loan
    this.logger.debug(`Initiating payment for loanId: ${loanId} due to state change from ${oldState} to ${newState}`);
    const newPaymentType = this.supportedLoanStateToPaymentType.get(newState);
    if (!newPaymentType) {
      this.logger.error(`No payment type found for new loan state: ${newState}`);
      return false;
    }

    return this.paymentService.initiatePayment(loanId, newPaymentType);
  }
}
