import { ITransfer } from '@library/entity/entity-interface';
import { TransferStateCodes } from '@library/entity/enum';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Transfer } from '@library/shared/domain/entity';
import { TransferRelation } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ITransferRepository } from '@payment/shared/interfaces/repositories';
import { Repository } from 'typeorm';

@Injectable()
export class TransferRepository extends RepositoryBase<Transfer> implements ITransferRepository {
  private readonly logger: Logger = new Logger(TransferRepository.name);

  constructor(@InjectRepository(Transfer) protected readonly repository: Repository<Transfer>) {
    super(repository, Transfer);
  }

  public async getLatestTransferForStep(stepId: string): Promise<ITransfer | null> {
    return this.repository.findOne({ where: { loanPaymentStepId: stepId }, order: { order: 'DESC' } });
  }

  public async createTransferForStep(transferData: Partial<Transfer>): Promise<Transfer | null> {
    return this.insert(transferData, true);
  }

  public async getTransferById(transferId: string, relations?: TransferRelation[]): Promise<Transfer | null> {
    return this.repository.findOne({ where: { id: transferId }, relations });
  }

  public async completeTransfer(transferId: string): Promise<boolean | null> {
    const result = await this.repository.update({ id: transferId }, { state: TransferStateCodes.Completed });
    return this.actionResult(result);
  }

  public async failTransfer(transferId: string): Promise<boolean | null> {
    const result = await this.repository.update({ id: transferId }, { state: TransferStateCodes.Failed });
    return this.actionResult(result);

  }
}
