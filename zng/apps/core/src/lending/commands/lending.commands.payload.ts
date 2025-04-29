import { LoanBindIntent, LoanInviteeType, LoanPaymentFrequency, LoanType } from '@library/entity/enum';

export interface LendingBasePayload {
  loanId: string | null;
}

export interface LoanCreateInviteePayload {
  type: LoanInviteeType;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  
}

export interface LoanCreatePayload extends LendingBasePayload {
  userId: string;
  amount: number;
  type: LoanType;
  relationship: string | null;
  reason: string | null;
  note: string | null;
  attachement: string | null;
  invitee: LoanCreateInviteePayload;
  billerId: string | null;
  billingAccountNumber: string | null;
  paymentsCount: number;
  paymentFrequency: LoanPaymentFrequency;
}

export interface LoanProposePayload extends LendingBasePayload {
  userId: string;
  sourcePaymentAccountId: string;
}

export interface LoanBindPayload extends LendingBasePayload {
  contactUri: string;
  intent: LoanBindIntent;
}

