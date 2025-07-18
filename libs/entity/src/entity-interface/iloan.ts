import { EntityId } from '@library/shared/common/data/id.entity';
import { IApplicationUser } from './iapplication-user';
import { LoanClosure, LoanFeeMode, LoanPaymentFrequency, LoanState, LoanType } from '../enum';
import { IBiller } from './ibiller';
import { IPaymentAccount } from './ipayment-account';
import { ILoanPayment } from './iloan-payment';
import { ITransferError } from './itransfer-error';

export interface ILoan extends EntityId<string> {
  id: string; // UUID
  amount: number;

  lenderId: string | null;
  lender: IApplicationUser | null;

  borrowerId: string | null;
  borrower: IApplicationUser | null;

  // New fields WIP
  // #region General / Descriptional Info
  /** Enum that gives an idea of the type of loan (P2P, DBP, B2B, whatever) */
  type: LoanType; 
  /** Enum that gives an idea of the state of the loan (created, completed, etc.) */
  state: LoanState; 
  /** Enum that gives an idea of how Loan was closed (Paid out, Declined, Deactivated, Forgiven, Cancelled) */
  closureType: LoanClosure;
  /** Relationship between lender and borrower. FE controls content */
  relationship: string | null;
  /** Reason for the Loan. FE controls content */
  reason: string | null;
  /** User-defined note for the Loan */
  note: string | null;

  /** URL to the attachment (if any) --> might be multiple fields based on Product requirements */
  attachment: string | null; 
  /** Deeplink to Loan for sharing / invite */
  deeplink: string | null; 
  // #endregion

  // #region Target/Source Assignment
  // #endregion

  // #region Bill-Pay info
  /** Biller Id FK  */
  billerId: string | null;
  /** IBiller referenced by `billerId` */
  biller: IBiller | null;
  /** Account Number from Biller system to which pay towards */
  billingAccountNumber: string | null;
  // #endregion

  // #region Payment Schedule Info
  /** Total number of (re)payments for the Loan */
  paymentsCount: number;

  /** Enum that tells how often (re)payment should happen
 * 'monthly' by default but configurable
 * For now lets not overcomplicate it with custom repayment frequency */  
  paymentFrequency: LoanPaymentFrequency;

  payments: ILoanPayment[] | null;
  // #endregion

  // #region Fee
  /** Enum for fee pay mode (who and how)
   * Lets keep it simple and have just few 'presets'
   */
  feeMode: LoanFeeMode | null;
  /** Total amount of the fee.
   * If it is splitted to few payments - need to keep track on that
   */
  feeAmount: number | null;
  // #endregion

  // #region Payment Account Assignment
  // Idea is to remove four accounts links from zirtue-microservices implementation and keep just two
  // Should nicely cover all needs for changes / validation / information retrieval
  // Transfers objects will still contain the fact accounts used while this fields are for storing current ones
  /** FK to PaymentAccount for Lender */
  lenderAccountId: string | null;
  /** (type - payment method object, TBD) PaymentAccount for Lender */
  lenderAccount: IPaymentAccount | null;
  /** FK to PaymentAccount for Borrower */
  borrowerAccountId: string | null;
  /** (type - payment method object, TBD) PaymentAccount for Borrower */
  borrowerAccount: IPaymentAccount | null;
  // #endregion

  // #region Timestamps
  /** Timestamp when the loan was created */
  createdAt: Date;
  /** Timestamp when the loan was last updated */
  updatedAt: Date | null;
  /** When the loan was accepted by the target user */
  acceptedAt: Date | null; 
  //etc
  // #endregion

  currentError: ITransferError | null; // Current error of the Loan
  retryCount: number; // Number of retries for the Loan. Includes only errors reasoned by personal accounts



  // // #region Loan State Tracking
  // // For Loan State I suggest to have a separate table, which will contain historical entries of Loan state changes
  // // No matter was it success or failure - we are interested in storing this information anyway
  // // It will contain:
  // /** 'id' not 'stateId'. PK UUID */
  // stateId: string;
  // /** FK to Loan */
  // loanId: string;
  // /** 'state' not 'loanState'. Enum. At which Loan state event happened */
  // loanState: string;
  // /** Enum. What event happened */
  // event: string;
  // /** Timestamp of event happened */
  // timestamp: Date;
  // /** Optional - User resulted an event */
  // userId: string | null;
  // /** Optional - Transfer whith which event happened */
  // transferId: string | null;
  // /** Optional - JSON with any extra event data payload */
  // data: object | null;
  // // #endregion
}
