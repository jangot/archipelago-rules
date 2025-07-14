import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { LoanApplication } from '@library/shared/domain/entity';
import { ILoanApplicationRepository } from '@core/shared/interfaces/repositories/iloan-application.repository';

@Injectable()
export class LoanApplicationRepository extends RepositoryBase<LoanApplication> implements ILoanApplicationRepository {
  constructor(
    @InjectRepository(LoanApplication)
    protected readonly repository: Repository<LoanApplication>,
  ) {
    super(repository, LoanApplication);
  }
}
