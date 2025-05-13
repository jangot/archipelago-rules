import { EntityId } from '@library/shared/common/data';
import { ILoan } from './iloan';
import { LoanPaymentState, LoanPaymentType } from '../enum';
import { ITransfer } from './itransfer';

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
  /** Indicates order number for Loan Payment if multiple steps are involved.
   * Ex: In Loan 'Repayment' step `0` is for `Borrower->Zirtue` payment and `1` for `Zirtue->Lender`.
   * For one-step payments and by default `0` is used.
   */
  step: number;
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
  initiatedAt: Date;
  /** Date for which Loan Payment was originally scheduled */
  scheduledAt: Date;
  /** Date when Payment was completed.*/
  completedAt: Date | null;
  /**
   * Collection of Transfers that are part of this Loan Payment.
   * Ideally should contain only one Transfer. 
   * But if Transfer failed and re-attempt happened - new Transfer will be also referenced to the same Loan Payment.
   */
  transfers: ITransfer[] | null;
}
