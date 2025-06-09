import { LoanPaymentStep } from '@library/shared/domain/entities';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ILoanPaymentStepRepository } from '@payment/shared/interfaces/repositories';
import { ILoanPaymentStep } from '@library/entity/interface';
import { LoanPaymentStepRelation } from '@library/shared/domain/entities/relations';

@Injectable()
export class LoanPaymentStepRepository extends RepositoryBase<LoanPaymentStep> implements ILoanPaymentStepRepository {
  private readonly logger: Logger = new Logger(LoanPaymentStepRepository.name);

  constructor(@InjectRepository(LoanPaymentStep) protected readonly repository: Repository<LoanPaymentStep>) {
    super(repository, LoanPaymentStep);
  }

  public async createPaymentSteps(steps: DeepPartial<LoanPaymentStep>[]): Promise<LoanPaymentStep[] | null> {
    return this.repository.create(steps);
  }

  public async getStepById(stepId: string, relations?: LoanPaymentStepRelation[]): Promise<ILoanPaymentStep | null> {
    return this.repository.findOne({ where: { id: stepId }, relations });
  }
}
