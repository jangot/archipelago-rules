import { EntityId } from '@library/shared/common/data/id.entity';
import { IApplicationUser } from './iapplication-user';

export interface ILoan extends EntityId<string> {
  id: string; // UUID
  amount: number;

  lenderId: string;
  lender: IApplicationUser;

  borrowerId: string;
  borrower: IApplicationUser;
}
