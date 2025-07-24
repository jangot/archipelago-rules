import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { LoanApplication } from '@library/shared/domain/entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


import { LoanApplicationStates } from '@library/entity/enum';

@Injectable()
export class LoanApplicationRepository extends RepositoryBase<LoanApplication> {
  constructor(
    @InjectRepository(LoanApplication)
    protected readonly repository: Repository<LoanApplication>
  ) {
    super(repository, LoanApplication);
  }

  public async getAllByUserId(userId: string): Promise<LoanApplication[]> {
    return this.repository.find({
      where: [
        { borrowerId: userId },
        { lenderId: userId },
      ],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  public async getPendingLoanApplicationsByUserId(userId: string): Promise<LoanApplication[]> {
    return this.repository.find({
      where: {
        borrowerId: userId,
        status: LoanApplicationStates.Pending,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
