import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoanPayment, ILoanPaymentStep, IPaymentsRoute, IPaymentsRouteStep } from '@library/entity/interface';
import { LOAN_RELATIONS } from '@library/shared/domain/entities/relations';
import { LoanPaymentStateCodes, LoanPaymentTypeCodes } from '@library/entity/enum';
import { IDomainServices } from '@payment/domain/idomain.services';
import { DeepPartial } from 'typeorm';
import { v4 } from 'uuid';

/**
 * Handles loan disbursement payments
 */
@Injectable()
export class DisbursementPaymentManager extends BaseLoanPaymentManager {

  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, LoanPaymentTypeCodes.Disbursement);
  }

  /**
   * Initiates a new disbursement payment for a loan
   * @param loanId The ID of the loan for which to initiate a disbursement payment
   * @returns The created loan payment or null if creation failed
   */
  public async initiate(loanId: string): Promise<ILoanPayment | null> {
    this.logger.debug(`Initiating disbursement payment for loan ${loanId}`);
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

    // Check if a disbursement payment already exists
    const disbursementPayment = payments && payments.find(payment => payment.type === this.paymentType);
    if (disbursementPayment) {
      this.logger.error(`Disbursement payment already exists for loan ${loanId}`);
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
      this.logger.error(`Failed to create disbursement payment for loan ${loanId}`);
      return null; // Payment creation failed
    }

    const generatedSteps = await this.generateStepsForPayment(payment, route, lenderAccountId, biller.paymentAccountId);
    if (!generatedSteps || !generatedSteps.length) {
      this.logger.error('Failed to generate disbursement payment steps for loan', { payment, route, lenderAccountId, billerPaymentAccountId: biller.paymentAccountId });
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
      this.logger.error('Failed to generate disbursement payment steps for loan as payment was not provided', { payment, route, fromAccountId, toAccountId });
      return null; // Payment creation failed
    }

    if (!route || !route.steps) {
      this.logger.error(`Cant route ${this.paymentType} payment for Loan`, { payment, route, fromAccountId, toAccountId });
      return null; // Cannot proceed without a valid payment route
    }

    const { id: loanPaymentId, amount } = payment;
    const { steps: routeSteps } = route;
    const stepsToApply: IPaymentsRouteStep[] = [];
    const paymentSteps: DeepPartial<ILoanPaymentStep>[] = [];
    // Funding + Disbursement specifics:
    // IF Funding + Disbursement route is a single step, then Funding has 0 steps, Disbursement 1
    // IF Funding + Disbursement route has N steps, then Funding has 1st step, Disbursement has N-1 steps, starting from second
    if (routeSteps.length > 1) {
      stepsToApply.push(...routeSteps.slice(1));
    } else {
      stepsToApply.push(...routeSteps);
    }

    for (let index = 0; index < stepsToApply.length; index++) {
      const stepToApply = stepsToApply[index];
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
