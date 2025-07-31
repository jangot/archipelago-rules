import { Transfer } from '@library/shared/domain/entity';
import { TransferErrorDetails } from './transfer-error-details';
import { TransferUpdatePayload } from './transfer-update-payload';

export interface TransferUpdateDetails {
  updates: Partial<Transfer> | null;
  error: TransferErrorDetails | null;
  rawUpdate: TransferUpdatePayload | null;
}
