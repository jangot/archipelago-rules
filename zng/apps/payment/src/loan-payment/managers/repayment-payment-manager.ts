import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoanPayment, ILoanPaymentStep, IPaymentsRoute, IPaymentsRouteStep } from '@library/entity/interface';
import { Loan } from '@library/shared/domain/entities';
import { IDomainServices } from '@payment/domain/idomain.services';
import { LoanPaymentStateCodes, LoanPaymentTypeCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entities/relations';
import { DeepPartial } from 'typeorm';
import { v4 } from 'uuid';

/**
 * Handles loan repayment payments
 */
@Injectable()
export class RepaymentPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, LoanPaymentTypeCodes.Repayment);
  }

  /**
   * Initiates a new repayment payment for a loan
   * TODO: Repayments require more sophisticated logic and should be revisited to make multiple repayments work.
   * This is a placeholder implementation that may not cover all edge cases.
   * @param loanId The ID of the loan for which to initiate a repayment payment
   * @returns The created loan payment or null if creation failed
   */
  public async initiate(loanId: string): Promise<ILoanPayment | null> {
    this.logger.debug(`Initiating repayment payment for loan ${loanId}`);
    // 1. Check the existance of the payment -> duplicates throws error
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments, LOAN_RELATIONS.Biller, LOAN_RELATIONS.BillerPaymentAccount]);
    const { payments, lenderAccountId, biller, type, amount } = loan;

    if (!lenderAccountId) {
      this.logger.warn(`Lender account ID is missing for loan ${loanId}`);
      return null; // Cannot proceed without a lender account
    }

    if (!biller || !biller.paymentAccountId) {
      this.logger.warn(`Biller or Biller's payment Account is missing for loan ${loanId}`);
      return null; // Cannot proceed without a biller
    }

    // Check if a repayment payment already exists
    const repaymentPayment = payments && payments.find(payment => payment.type === this.paymentType);
    if (repaymentPayment) {
      this.logger.error(`Repayment payment already exists for loan ${loanId}`);
      return null;
    }

    // 2. Get the Route with it steps
    const route = await this.domainServices.paymentServices.findRouteForPayment(
      lenderAccountId, 
      biller.paymentAccountId, 
      this.paymentType, 
      type
    );

    // 3. Create Payment and Steps -> save & return
    const payment = await this.domainServices.paymentServices.createPayment({
      amount,
      loanId,
      paymentNumber: null,
      type: this.paymentType,
      state: LoanPaymentStateCodes.Created,
    });

    if (!payment) {
      this.logger.error(`Failed to create repayment payment for loan ${loanId}`);
      return null; // Payment creation failed
    }

    const generatedSteps = this.generateStepsForPayment(payment, route, lenderAccountId, biller.paymentAccountId);
    if (!generatedSteps || !generatedSteps.length) {
      this.logger.error('Failed to generate repayment payment steps for loan', { payment, route, lenderAccountId, billerPaymentAccountId: biller.paymentAccountId });
      return null; // Step generation failed
    }
    const savedSteps = await this.domainServices.paymentServices.createPaymentSteps(generatedSteps);
    return { ...payment, steps: savedSteps };
  }

  protected generateStepsForPayment(
    payment: ILoanPayment | null, 
    route: IPaymentsRoute | null, 
    fromAccountId: string, 
    toAccountId: string
  ): DeepPartial<ILoanPaymentStep>[] | null {
    if (!payment) {
      this.logger.error('Failed to generate repayment payment steps for loan as payment was not provided', { payment, route, fromAccountId, toAccountId });
      return null; // Payment creation failed
    }

    if (!route || !route.steps) {
      this.logger.error(`Cant route ${this.paymentType} payment for Loan`, { payment, route, fromAccountId, toAccountId });
      return null; // Cannot proceed without a valid payment route
    }

    const { id: loanPaymentId, amount } = payment;
    const { steps: routeSteps } = route;
    const paymentSteps: DeepPartial<ILoanPaymentStep>[] = [];

    for (let index = 0; index < routeSteps.length; index++) {
      const stepToApply = routeSteps[index];
      const { fromId, toId } = stepToApply;
      const paymentStep: DeepPartial<ILoanPaymentStep> = {
        id: v4(), // We generate id here as TypeORM sometimes fails to generate multiple uuids within one transaction
        loanPaymentId,
        order: index,
        amount,
        sourcePaymentAccountId: fromId || fromAccountId,
        targetPaymentAccountId: toId || toAccountId,
        state: LoanPaymentStateCodes.Created,
        awaitStepState: index === 0 ? null : LoanPaymentStateCodes.Completed,
        awaitStepId: null,
      };
      paymentSteps.push(paymentStep);
    }

    return paymentSteps;
  }

  /**
   * Gets information about the next scheduled repayment
   * @param loan The loan to check for next repayment
   * @returns The next scheduled repayment or null if none exists
   */
  public async getNextScheduledRepayment(loan: Loan): Promise<ILoanPayment | null> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _loan = loan; // Prevent unused parameter warning while implementation is pending
    return null; // Implementation needed
  }
}
