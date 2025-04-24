import { LoanPaymentFrequency, LoanType } from '@library/entity/enum';

export interface LendingBasePayload {
  loanId: string | null;
}

export interface LoanCreatePayload extends LendingBasePayload {
  userId: string;
  amount: number;
  type: LoanType;
  isLendLoan: boolean;
  relationship: string | null;
  reason: string | null;
  note: string | null;
  attachement: string | null;
  targetUserUri: string;
  targetUserFirstName: string;
  targetUserLastName: string;
  billerId: string | null;
  billingAccountNumber: string | null;
  paymentsCount: number;
  paymentFrequency: LoanPaymentFrequency;
}

