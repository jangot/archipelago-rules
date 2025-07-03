import { EntityId } from '@library/shared/common/data';
import { TransferErrorCode, TransferErrorType } from '../enum';
import { ILoan } from './iloan';
import { ITransfer } from './itransfer';

export interface ITransferError extends EntityId<string> {
  id: string; // UUID
  
  transferId: string; // FK to Transfer
  transfer: ITransfer;

  loanId: string | null; // FK to Loan
  loan: ILoan | null;
  
  // TODO: Block below is TBD
  // Main purposes are:
  // 1. Highlight is it business or technical error
  // 2. Give enhough description about what happened in short manner
  type: TransferErrorType; // Type of the error: 'business' or 'technical'
  code: TransferErrorCode; // Enum of the error code
  
  displayMessage: string; // Message to be displayed to the user / team
  
  createdAt: Date; // Date of the error
  
  raw: string; // Raw error data from the provider. TODO: Maybe more typped than just string
}
