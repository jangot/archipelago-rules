import { EntityId } from '@library/shared/common/data/id.entity';
import { IApplicationUser } from './iapplication-user';

export interface ILoan extends EntityId<string> {
  id: string; // UUID
  amount: number;

  lenderId: string;
  lender: IApplicationUser;

  borrowerId: string;
  borrower: IApplicationUser;

  // New fields WIP
  // #region General / Descriptional Info
  /** Enum that gives an idea of the type of loan (P2P, DBP, B2B, whatever) */
  type: string; 
  /** Gives a direction info. Particularly useful for Loans bound to unregistered User (contact). 
   * Helps to identify who is the lender and who is the borrower */
  isLendLoan: boolean; 
  /** Enum that gives an idea of the state of the loan (created, completed, etc.) */
  state: string; 
  /** Description of the loan --> might be multiple fields based on Product requirements */
  description: string | null; 
  /** URL to the attachment (if any) --> might be multiple fields based on Product requirements */
  attachement: string | null; 
  /** Deeplink to Loan for sharing / invite */
  deeplink: string | null; 
  // #endregion

  // #region Partner-related Info
  /** Partner FK if Loan is Partner-referred */
  partnerId: string | null; 
  /** IPartner in fact, not IApplicationUser for sure */
  partner: IApplicationUser | null; 
  /** If Loan was created by Partner Preset (presets could not be changed if any Loans created with it already - keeps data linked relevant) */
  presetLink: string | null; 
  // etc
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

  // #region Target/Source Bindings
  /** For the Loans that are created targeting User who not registered yet. 
   * Contains contact uri in format mailto:email or tel:+1234567890 */
  targetUserUri: string | null; 

  // For B2C and B2B Loans I suggest to think about creating service-user for Partner
  // It will be used (for now) only for binding a Loan to it
  // Such ServiceUser will have a type (needs to extend ApplicationUser) and will be excluded from most avaliable actions for real Users (Login, change props, etc)
  // By this we will avoid making solution more complex to support B2C B2B Loans

  // #endregion

  // #region Payment Account Bindings
  // Idea is to remove four accounts links from zirtue-microservices implementation and keep just two
  // Should nicely cover all needs for changes / validation / information retrieval
  // Transfers objects will still contain the fact accounts used while this fields are for storing current ones
  /** FK to PaymentAccount for Lender */
  lenderAccountId: string | null;
  /** (type - payment method object, TBD) PaymentAccount for Lender */
  lenderAccount: string | null;
  /** FK to PaymentAccount for Borrower */
  borrowerAccountId: string | null;
  /** (type - payment method object, TBD) PaymentAccount for Borrower */
  borrowerAccount: string | null;
  // #endregion

  // #region Payment Schedule Info
  /** Total numebr of (re)payments for the Loan */
  paymentsCount: number;
  /** Displays the index of current (re)payment.
   * If Loan not in acceptance yet - null
   */
  currentPaymentIndex: number | null;
  /** Contains a date at which Loan repayment should happen
   * Might be createdAt + 1month by default but configurable
   */
  nextPaymentDate: Date | null;
  /** Enum that tells how often (re)payment should happen
 * 'monthly' by default but configurable
 * For now lets not overcomplicate it with custom repayment frequency */  
  paymentFrequency: string | null;
  /** Amount of next (re)payment. 
   * Only for next one as we (check that) want to support rescheduling
   */
  paymmentAmount: number | null;
  // #endregion

  // #region Fee
  /** Enum for fee pay mode (who and how)
   * Lets keep it simple and have just few 'presets'
   */
  feeMode: string | null;
  /** Total amount of the fee.
   * If it is splitted to few payments - need to keep track on that
   */
  feeValue: number | null;
  // #endregion

  // #region Loan State Tracking
  // For Loan State I suggest to have a separate table, which will contain historical entries of Loan state changes
  // No matter was it success or failure - we are interested in storing this information anyway
  // It will contain:
  /** 'id' not 'stateId'. PK UUID */
  stateId: string;
  /** FK to Loan */
  loanId: string;
  /** 'state' not 'loanState'. Enum. At which Loan state event happened */
  loanState: string;
  /** Enum. What event happened */
  event: string;
  /** Historical order int */
  order: number;
  /** Timestamp of event happened */
  timestamp: Date;
  /** Optional - User resulted an event */
  userId: string | null;
  /** Optional - Transfer whith which event happened */
  transferId: string | null;
  /** Optional - JSON with any extra event data payload */
  data: object | null;
  // #endregion
}
