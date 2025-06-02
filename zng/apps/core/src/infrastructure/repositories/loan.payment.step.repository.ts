import { LoanPaymentStep } from '@library/shared/domain/entities';
import { ILoanPaymentStepRepository } from '@core/shared/interfaces/repositories';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LoanPaymentStepRepository extends RepositoryBase<LoanPaymentStep> implements ILoanPaymentStepRepository {
  private readonly logger: Logger = new Logger(LoanPaymentStepRepository.name);

  constructor(@InjectRepository(LoanPaymentStep) protected readonly repository: Repository<LoanPaymentStep>) {
    super(repository, LoanPaymentStep);
  }
}
