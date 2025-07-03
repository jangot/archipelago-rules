import { EntityId } from '@library/shared/common/data';
import { ILoan } from './iloan';
import { LoanInviteeType } from '../enum';

export interface ILoanInvitee extends EntityId<string> {
  id: string; //UUID
  loanId: string;
  loan: ILoan;
  type: LoanInviteeType;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}
