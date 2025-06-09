import { ITransfer } from '@library/entity/interface/itransfer';
import { IRepositoryBase } from '@library/shared/common/data';

 
export interface ITransferRepository extends IRepositoryBase<ITransfer> {
  getLatestTransferForStep(stepId: string): Promise<ITransfer | null>;
}

export const ITransferRepository = Symbol('ITransferRepository');
