import { ITransferError } from '@library/entity/entity-interface';
import { IRepositoryBase } from '@library/shared/common/data';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ITransferErrorRepository extends IRepositoryBase<ITransferError> {}

export const ITransferErrorRepository = Symbol('ITransferErrorRepository');
