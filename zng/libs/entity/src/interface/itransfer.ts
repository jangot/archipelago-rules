import { EntityId } from '@library/shared/common/data';
import { IPaymentAccount } from './ipayment-account';
import { TransferState } from '../enum';
import { ILoanPaymentStep } from './iloan-payment-step';
import { ITransferError } from './itransfer-error';

export interface ITransfer extends EntityId<string> {
  id: string; // UUID
  amount: number;

  /**
   * Current Transfer state:
   * `created` - Transfer is created but not yet initiated
   * `pending` - Transfer is executed but not completed yet
   * `completed` - Transfer was executed successfully
   * `failed` - Transfer was not executed successfully due to some error
   */
  state: TransferState;
  /** Error data if Transfer failed */
  error: ITransferError | null;

  createdAt: Date;
  updatedAt: Date | null;

  sourceAccountId: string;
  sourceAccount: IPaymentAccount;
  destinationAccountId: string;
  destinationAccount: IPaymentAccount;

  loanPaymentStepId: string | null;
  loanPaymentStep: ILoanPaymentStep | null;

}
