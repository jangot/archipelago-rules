import { ITransfer } from '@library/entity/entity-interface/itransfer';
import { IRepositoryBase } from '@library/shared/common/data';
import { TransferRelation } from '@library/shared/domain/entity/relation';
import { DeepPartial } from 'typeorm';

 
export interface ITransferRepository extends IRepositoryBase<ITransfer> {
  getLatestTransferForStep(stepId: string): Promise<ITransfer | null>;
  createTransferForStep(transferData: DeepPartial<ITransfer>): Promise<ITransfer | null>;
  getTransferById(transferId: string, relations?: TransferRelation[]): Promise<ITransfer | null>;
  completeTransfer(transferId: string): Promise<boolean | null>;
  failTransfer(transferId: string): Promise<boolean | null>;
}

export const ITransferRepository = Symbol('ITransferRepository');
