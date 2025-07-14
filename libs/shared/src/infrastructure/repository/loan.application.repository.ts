import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { ILoanApplicationRepository } from '../interface';
import { LoanApplication } from '@library/shared/domain/entity';

@Injectable()
export class LoanApplicationRepository extends RepositoryBase<LoanApplication> implements ILoanApplicationRepository {
  constructor(
    @InjectRepository(LoanApplication)
    protected readonly repository: Repository<LoanApplication>,
  ) {
    super(repository, LoanApplication);
  }
}
