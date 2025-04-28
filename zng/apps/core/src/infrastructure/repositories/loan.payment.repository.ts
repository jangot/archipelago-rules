import { LoanPayment } from '@core/domain/entities';
import { ILoanPaymentRepository } from '@core/shared/interfaces/repositories';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class LoanPaymentRepository extends RepositoryBase<LoanPayment> implements ILoanPaymentRepository {
  private readonly logger: Logger = new Logger(LoanPaymentRepository.name);

  constructor(@InjectRepository(LoanPayment) protected readonly repository: Repository<LoanPayment>) {
    super(repository, LoanPayment);
  }
}
