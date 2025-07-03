import { TransferErrorCode, TransferErrorType } from '@library/entity/enum';

export interface TransferErrorDetails {
  type: TransferErrorType;
  code: TransferErrorCode;
  displayMessage: string;
  raw: string;
}
