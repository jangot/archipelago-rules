import { TransferError } from '@library/shared/domain/entity';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITransferErrorRepository } from '@payment/shared/interfaces/repositories';

@Injectable()
export class TransferErrorRepository extends RepositoryBase<TransferError> implements ITransferErrorRepository {
  private readonly logger: Logger = new Logger(TransferErrorRepository.name);

  constructor(@InjectRepository(TransferError) protected readonly repository: Repository<TransferError>) {
    super(repository, TransferError);
  }
}
