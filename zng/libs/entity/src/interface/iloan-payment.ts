import { EntityId } from '@library/shared/common/data';
import { ILoan } from './iloan';
import { LoanPaymentState, LoanPaymentType } from '../enum';
import { ITransfer } from './itransfer';

export interface ILoanPayment extends EntityId<string> {
  id: string; // UUID
  amount: number;

  loanId: string;
  loan: ILoan;

  /** Reflects the Payment Index for Loan Repayments.
   * `null` while Loan is not in Repayment state.
   */
  paymentIndex: number | null;
  /** Shows for what Loan lifecycle Payment is assigned */
  type: LoanPaymentType;
  /** Indicates order number for Loan Payment if multiple stages are involved.
   * Ex: In Loan 'Repayment' state `0` is for `Borrower->Zirtue` payment and `1` for `Zirtue->Lender`.
   * For one-stage payments and by default `0` is used.
   */
  stage: number;
  state: LoanPaymentState;

  createdAt: Date;
  updatedAt: Date | null;
  /** For what date Loan Payment was scheduled last time. 
     * Should be the same with `originalExecutionDate` if it is first execution attempt, otherwise - should contain the date of latest re-attempt */
  executionDate: Date;
  /** Date for which Loan Payment was originally scheduled */
  originalExecutionDate: Date;

  transfers: ITransfer[] | null;
}
