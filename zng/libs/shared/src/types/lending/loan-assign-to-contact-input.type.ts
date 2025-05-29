import { ContactType, LoanAssignIntent, LoanInviteeType } from '@library/entity/enum';

export interface LoanAssignToContactInput {
  contactValue: string;
  contactType: ContactType;
  intent: LoanAssignIntent;
  loanId: string | null;
}

export interface LoanAssignToUserInput extends LoanAssignToContactInput {
  userId: string | null;
}

export interface LoanTargetUserInput {
  loanId: string;
  userType: LoanInviteeType;
}

export interface LoansSetTargetUserInput {
  userId: string;
  loansTargets: LoanTargetUserInput[];
}
