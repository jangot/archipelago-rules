import { ContactType, LoanAssignIntent } from '@library/entity/enum';

export interface LoanAssignToContactInput {
  contactValue: string;
  contactType: ContactType;
  intent: LoanAssignIntent;
  loanId: string | null;
}

export interface LoanAssignToUserInput extends LoanAssignToContactInput {
  userId: string | null;
}
// TODO: This might not be needed anymore.
/*
export interface LoanTargetUserInput {
  loanId: string;
  userType: LoanInviteeType;
}

export interface LoansSetTargetUserInput {
  userId: string;
  loansTargets: LoanTargetUserInput[];
}
 */
