import { ITransferError } from '@library/entity/entity-interface';
import { IRepositoryBase } from '@library/shared/common/data';
import { TransferErrorDetails } from '@library/shared/type/lending';

 
export interface ITransferErrorRepository extends IRepositoryBase<ITransferError> {
  createTransferError(transferId: string, error: TransferErrorDetails, loanId: string | null): Promise<ITransferError | null>;
}

export const ITransferErrorRepository = Symbol('ITransferErrorRepository');
