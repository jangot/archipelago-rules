import { TransferError } from '@library/shared/domain/entities';
import { ITransferErrorRepository } from '@core/shared/interfaces/repositories';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TransferErrorRepository extends RepositoryBase<TransferError> implements ITransferErrorRepository {
  private readonly logger: Logger = new Logger(TransferErrorRepository.name);

  constructor(@InjectRepository(TransferError) protected readonly repository: Repository<TransferError>) {
    super(repository, TransferError);
  }
}
