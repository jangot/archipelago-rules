import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentTypeCodes } from '@library/entity/enum';
import { ScheduleService } from '@library/shared/service';
import { PlanPreviewInput, PlanPreviewOutputItem, RepaymentPlanPaidPayment } from '@library/shared/type/lending';
import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { BaseLoanPaymentManager, PaymentAccountPair } from './base-loan-payment-manager';

/**
 * Handles loan repayment payments
 */
@Injectable()
export class RepaymentPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Repayment);
  }

  protected getAccountPairForPaymentType(loan: ILoan): PaymentAccountPair {
    return { 
      fromAccountId: loan.borrowerAccountId,
      toAccountId: loan.lenderAccountId,
    };
  }

  protected canInitiateWhenPaymentsExist(loan: ILoan, completedPayments: ILoanPayment[]): boolean {
    const { id: loanId, paymentsCount } = loan;
    const highestPaymentNumber = Math.max(...completedPayments.map(p => p.paymentNumber || 0));
    if (highestPaymentNumber >= paymentsCount) { 
      this.logger.error(`Loan ${loanId} already has all payments completed or initiated`);
      return false;
    }
    return true;
  }

  protected calculateNewPayment(loan: ILoan): Partial<ILoanPayment> | null {
    const { id: loanId, payments } = loan;

    const samePaymentsCompleted = this.getSameCompletedPayments(payments);
    const anyPaymentsCompleted = samePaymentsCompleted && samePaymentsCompleted.length;
    const paymentNumber = anyPaymentsCompleted ? samePaymentsCompleted.length + 1 : 1;

    const nextPayment = this.getNextPayment(loan, samePaymentsCompleted);
    if (!nextPayment) {
      this.logger.error(`Unable to calculate next payment for loan ${loanId}`, { loan });
      return null;
    }

    // TODO: Attemts calc goes here
    return {
      amount: nextPayment.amount,
      loanId,
      paymentNumber,
      type: this.paymentType,
      state: LoanPaymentStateCodes.Created,
      scheduledAt: nextPayment.paymentDate,
    };
  }

  /**
   * Gets the next payment for the loan based on the current state and paid payments
   * @param loan The loan for which to get the next payment
   * @param paidPayments The list of payments that have already been made
   * @returns The next payment to be made, or null if it cannot be determined
   */
  private getNextPayment(loan: ILoan, paidPayments: ILoanPayment[]): PlanPreviewOutputItem | null {
    const { id: loanId, amount, paymentsCount, paymentFrequency, feeMode, feeAmount, createdAt } = loan;
    
    // Build the current state for repayment plan preview
    const currentState: PlanPreviewInput = {
      amount,
      paymentsCount,
      paymentFrequency,
      feeMode,
      feeAmount,
      repaymentStartDate: createdAt,
    };

    // Map paid payments to the format required for remaining repayments calculation
    const paidRepayments: RepaymentPlanPaidPayment[] = paidPayments.map(p => ({
      amount: p.amount,
      paymentDate: p.scheduledAt || p.createdAt,
      index: p.paymentNumber || 1,
    }));

    // Calculate remaining repayments
    const remainingRepayments = ScheduleService.previewRemainingRepayments(currentState, paidRepayments);
    if (!remainingRepayments || !remainingRepayments.length) {
      this.logger.error(`Unable to calculate remaining repayments plan for loan ${loanId}`, { currentState, paidRepayments });
      return null;
    }

    // Return the next payment from the remaining repayments
    return remainingRepayments.reduce((lowest, current) => 
      current.index < lowest.index ? current : lowest
    );
  }


}
