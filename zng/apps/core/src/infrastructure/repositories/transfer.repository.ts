import { Transfer } from '@library/shared/domain/entities';
import { ITransferRepository } from '@core/shared/interfaces/repositories';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TransferRepository extends RepositoryBase<Transfer> implements ITransferRepository {
  private readonly logger: Logger = new Logger(TransferRepository.name);

  constructor(@InjectRepository(Transfer) protected readonly repository: Repository<Transfer>) {
    super(repository, Transfer);
  }
}
