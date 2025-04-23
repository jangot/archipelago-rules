import { EntityId } from '@library/shared/common/data';
import { IPaymentAccount } from './ipayment-account';
import { TransferState } from '../enum';
import { ILoanPayment } from './iloan-payment';

export interface ITransfer extends EntityId<string> {
  id: string; // UUID
  amount: number;

  state: TransferState;
  errorData: string | null;

  createdAt: Date;
  updatedAt: Date | null;

  // TODO: What to do with Zirtue internal accounts? Billers accounts?
  sourceAccountId: string | null;
  sourceAccount: IPaymentAccount | null;
  destinationAccountId: string | null;
  destinationAccount: IPaymentAccount | null;
  // TODO: ? 'user', 'zirtue_ach', 'zirtue_card', 'biller'
  sourceAccountType: string; 
  destinationAccountType: string;

  loanPaymentId: string | null;
  loanPayment: ILoanPayment | null;

}
