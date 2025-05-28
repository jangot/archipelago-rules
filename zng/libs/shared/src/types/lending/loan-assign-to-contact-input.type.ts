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
