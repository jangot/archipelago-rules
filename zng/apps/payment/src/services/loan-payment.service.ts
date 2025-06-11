import { LoanPaymentType } from '@library/entity/enum';
import { Injectable, Logger } from '@nestjs/common';
import { IDomainServices } from '@payment/domain/idomain.services';

@Injectable()
export class LoanPaymentService {
  private readonly logger: Logger = new Logger(LoanPaymentService.name);

  constructor(private readonly domainServices: IDomainServices) {}

  /**
   * Initiates a payment for a specified loan
   * 
   * @param loanId - The unique identifier of the loan for which payment is being initiated
   * @param paymentType - The type of loan payment (e.g., scheduled, extra, payoff)
   * @returns A Promise resolving to boolean indicating success, or null if operation failed
   * @description This method triggers the payment initiation process for a loan, creating 
   *              the necessary payment record and preparing it for processing based on the
   *              specified payment type.
   */
  public async initiatePayment(loanId: string, paymentType: LoanPaymentType): Promise<boolean | null> {
    this.logger.debug(`Initiating payment for loan ${loanId} with type ${paymentType}`);
    return this.domainServices.management.initiateLoanPayment(loanId, paymentType);
  }

  /**
   * Advances a payment to its next stage in the payment processing workflow
   * 
   * @param paymentId - The unique identifier of the payment to advance
   * @param paymentType - The type of loan payment that is being advanced
   * @returns A Promise resolving to boolean indicating success, or null if operation failed
   * @description This method progresses a payment from its current state to the next stage
   *              in the payment workflow (e.g., from initiated to processing, or from 
   *              processing to completed). The specific state transitions depend on the 
   *              payment type and current state.
   */
  public async advancePayment(paymentId: string, paymentType: LoanPaymentType): Promise<boolean | null> {
    this.logger.debug(`Advancing payment ${paymentId} of type ${paymentType}`);
    return this.domainServices.management.advancePayment(paymentId, paymentType);
  }
}
