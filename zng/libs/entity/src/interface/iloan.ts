import { IApplicationUser } from './iapplication-user';

export interface ILoan {
  id: string; // UUID
  amount: number;

  lenderId: string;
  lender: IApplicationUser;

  borrowerId: string;
  borrower: IApplicationUser;
}
