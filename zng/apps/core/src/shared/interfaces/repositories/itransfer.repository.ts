import { ITransfer } from '@library/entity/interface/itransfer';
import { IRepositoryBase } from '@library/shared/common/data';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ITransferRepository extends IRepositoryBase<ITransfer> {}

export const ITransferRepository = Symbol('ITransferRepository');
