import { Transfer } from '@library/shared/domain/entities';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ITransferRepository } from '@payment/shared/interfaces/repositories';
import { ITransfer } from '@library/entity/interface';
import { TransferRelation } from '@library/shared/domain/entities/relations';

@Injectable()
export class TransferRepository extends RepositoryBase<Transfer> implements ITransferRepository {
  private readonly logger: Logger = new Logger(TransferRepository.name);

  constructor(@InjectRepository(Transfer) protected readonly repository: Repository<Transfer>) {
    super(repository, Transfer);
  }

  public async getLatestTransferForStep(stepId: string): Promise<ITransfer | null> {
    return this.repository.findOne({ where: { loanPaymentStepId: stepId }, order: { order: 'DESC' } });
  }

  public async createTransferForStep(transferData: DeepPartial<Transfer>): Promise<Transfer | null> {
    return this.repository.create(transferData);
  }

  public async getTransferById(transferId: string, relations?: TransferRelation[]): Promise<Transfer | null> {
    return this.repository.findOne({ where: { id: transferId }, relations });
  }
}
