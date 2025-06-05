import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoanPayment, ILoanPaymentStep, IPaymentsRoute, IPaymentsRouteStep } from '@library/entity/interface';
import { IDomainServices } from '@payment/domain/idomain.services';
import { LoanPaymentStateCodes, LoanPaymentTypeCodes } from '@library/entity/enum';
import { DeepPartial } from 'typeorm';
import { LOAN_RELATIONS } from '@library/shared/domain/entities/relations';
import { v4 } from 'uuid';

/**
 * Handles loan fee payments
 */
@Injectable()
export class FeePaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, LoanPaymentTypeCodes.Fee);
  }

  /**
   * Initiates a new fee payment for a loan
   * @param loanId The ID of the loan for which to initiate a fee payment
   * @returns The created loan payment or null if creation failed
   */
  public async initiate(loanId: string): Promise<ILoanPayment | null> {
    this.logger.debug(`Initiating fee payment for loan ${loanId}`);
    // 1. Check the existance of the payment -> duplicates throws error
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments, LOAN_RELATIONS.Biller, LOAN_RELATIONS.BillerPaymentAccount]);
    const { payments, lenderAccountId, biller, type, feeAmount: amount } = loan;

    if (!lenderAccountId) {
      this.logger.warn(`Lender account ID is missing for loan ${loanId}`);
      return null; // Cannot proceed without a lender account
    }

    if (!biller || !biller.paymentAccountId) {
      this.logger.warn(`Biller or Biller's payment Account is missing for loan ${loanId}`);
      return null; // Cannot proceed without a biller
    }

    // Check if a fee payment already exists
    const feePayment = payments && payments.find(payment => payment.type === this.paymentType);
    if (feePayment) {
      this.logger.error(`Fee payment already exists for loan ${loanId}`);
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
    // If amount is zero then we create a completed payment without steps
    const completionDate = amount ? null : new Date();
    const creationState = amount ? LoanPaymentStateCodes.Created : LoanPaymentStateCodes.Completed;
    const payment = await this.domainServices.paymentServices.createPayment({
      amount: amount || 0,
      loanId,
      paymentNumber: null,
      type: this.paymentType,
      state: creationState,
      completedAt: completionDate,
      scheduledAt: completionDate,
      initiatedAt: completionDate,
    });

    if (!payment) {
      this.logger.error(`Failed to create fee payment for loan ${loanId}`);
      return null; // Payment creation failed
    }

    let savedSteps: ILoanPaymentStep[] | null = [];
    if (amount) {
      const generatedSteps = this.generateStepsForPayment(payment, route, lenderAccountId, biller.paymentAccountId);
      if (!generatedSteps || !generatedSteps.length) {
        this.logger.error('Failed to generate fee payment steps for loan', { payment, route, lenderAccountId, billerPaymentAccountId: biller.paymentAccountId });
        return null; // Step generation failed
      }
      savedSteps = await this.domainServices.paymentServices.createPaymentSteps(generatedSteps);
    }
    return { ...payment, steps: savedSteps };
  }

  protected generateStepsForPayment(
    payment: ILoanPayment | null, 
    route: IPaymentsRoute | null, 
    fromAccountId: string, 
    toAccountId: string
  ): DeepPartial<ILoanPaymentStep>[] | null {
    if (!payment) {
      this.logger.error('Failed to generate fee payment steps for loan as payment was not provided', { payment, route, fromAccountId, toAccountId });
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
}
