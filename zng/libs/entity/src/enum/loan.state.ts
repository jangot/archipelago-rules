export const LoanStateCodes = {
  /** Loan initial information provided (amount, plan, type), optional - Biller info */
  Created: 'created',
  /** (Borrower side) Borrower provided payment method information, waiting to set target User */
  Requested: 'requested',
  /** (Lender side) Lender provided payment method information, waiting to set target User */
  Offered: 'offered',
  /** Target User is registered, linked to Loan */
  Bound: 'bound',
  /** Target User Accepted the Loan */
  Accepted: 'accepted',
  /** Funds transfer from Lender to Zirtue started */
  Funding: 'funding',
  /** Funds transfer from Lender to Zirtue paused  */
  FundingPaused: 'funding_paused',
  /** Funds transfer from Lender to Zirtue completed */
  Funded: 'funded',
  /** Funds transfer from Zirtue to Borrower \ Biller started */
  Disbursing: 'disbursing',
  /** Funds transfer from Zirtue to Borrower \ Biller paused */
  DisbursingPaused: 'disbursing_paused',
  /** Funds transfer from Zirtue to Borrower \ Biller completed */
  Disbursed: 'disbursed',
  /** Borrower started to repay the loan */
  Repaying: 'repaying',
  /** Borrower paused the repayment */
  RepaymentPaused: 'repayment_paused',
  /** Borrower repaid Loan */
  Repaid: 'repaid',
  /** Loan is closed */
  Closed: 'closed',
} as const;

export type LoanState = typeof LoanStateCodes[keyof typeof LoanStateCodes];
