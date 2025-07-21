import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { TransferError } from '@library/shared/domain/entity';
import { TransferErrorDetails } from '@library/shared/type/lending';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TransferErrorRepository extends RepositoryBase<TransferError> {
  private readonly logger: Logger = new Logger(TransferErrorRepository.name);

  constructor(@InjectRepository(TransferError) protected readonly repository: Repository<TransferError>) {
    super(repository, TransferError);
  }

  public async createTransferError(transferId: string, error: TransferErrorDetails, loanId: string | null): Promise<TransferError | null> {
    const { type, code, displayMessage, raw } = error;
    return this.insert({
      transferId,
      type,
      code,
      displayMessage,
      raw,
      loanId,
    }, true);
  }
}
