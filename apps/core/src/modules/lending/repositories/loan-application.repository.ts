import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RepositoryBase } from '@library/shared/common/data/base.repository';

import { ILoanApplicationRepository } from '@core/shared/interfaces/repositories/iloan-application.repository';
import { LoanApplication } from '@library/shared/domain/entity';

@Injectable()
export class LoanApplicationRepository extends RepositoryBase<LoanApplication> implements ILoanApplicationRepository {
  constructor(
    @InjectRepository(LoanApplication)
    protected readonly repository: Repository<LoanApplication>,
  ) {
    super(repository, LoanApplication);
  }

  public async getAllByUserId(userId: string): Promise<LoanApplication[]> {
    return this.repository.find({
      where: {
        borrowerId: userId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  public async getPendingLoanApplications(userId: string): Promise<LoanApplication[]> {
    return this.repository.find({
      where: {
        borrowerId: userId,
        status: 'pending',
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
