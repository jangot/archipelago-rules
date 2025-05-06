import { ContactType, LoanBindIntent } from '@library/entity/enum';

export interface LoanBindToContactInput {
  contactValue: string;
  contactType: ContactType;
  intent: LoanBindIntent;
  loanId: string | null;
}

export interface LoanBindToUserInput extends LoanBindToContactInput {
  userId: string | null;
}
