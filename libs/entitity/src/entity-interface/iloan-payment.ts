import { EntityId } from '@library/shared/common/data';
import { ILoan } from './iloan';
import { LoanPaymentState, LoanPaymentType } from '../enum';
import { ILoanPaymentStep } from './iloan-payment-step';

export interface ILoanPayment extends EntityId<string> {
  id: string; // UUID
  amount: number;

  loanId: string;
  loan: ILoan;

  /** Reflects the Payment number for Loan Repayments.
   * `null` while Loan is not in Repayment state.
   */
  paymentNumber: number | null;
  /** Shows for what Loan lifecycle Payment is assigned
   * `funding` - Lender transfers funds to Zirtue
   * `disbursement` - Zirtue transfers funds to Biller
   * `fee` - Lender pays Zirtue fee
   * `repayment` - Borrower repays Lender
   * `refund` - Performing refund for the payment
   */
  type: LoanPaymentType;

  /** Indicates current state of the Loan Payment.
   * `pending` - Payment is executed but not completed yet
   * `completed` - Payment was executed successfully
   * `failed` - Payment was not executed successfully due to some error
   */
  state: LoanPaymentState;

  createdAt: Date;
  updatedAt: Date | null;
  /** What date Loan Payment was executed last time. 
     * Should be the same with `originalExecutionDate` if it is first execution attempt, 
     * otherwise - should contain the date of latest re-attempt */
  initiatedAt: Date | null;
  /** Date for which Loan Payment was originally scheduled */
  scheduledAt: Date | null;
  /** Date when Payment was completed.*/
  completedAt: Date | null;
  /**
   * Collection of LoanPaymentSteps that are part of this Loan Payment.
   * Each Step represents a specific transfer segment in the payment route.
   */
  steps: ILoanPaymentStep[] | null;
}
