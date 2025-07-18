import { PaymentStepState } from '@library/entity/enum';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { LoanPaymentStep } from '@library/shared/domain/entity';
import { LoanPaymentStepRelation } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LoanPaymentStepRepository extends RepositoryBase<LoanPaymentStep> {
  private readonly logger: Logger = new Logger(LoanPaymentStepRepository.name);
  
  constructor(@InjectRepository(LoanPaymentStep) protected readonly repository: Repository<LoanPaymentStep>) {
    super(repository, LoanPaymentStep);
  }

  public async createPaymentSteps(steps: Partial<LoanPaymentStep>[]): Promise<LoanPaymentStep[] | null> {
    return this.insertMany(steps, true);
  }

  public async getStepById(stepId: string, relations?: LoanPaymentStepRelation[]): Promise<LoanPaymentStep | null> {
    return this.repository.findOne({ where: { id: stepId }, relations });
  }

  public async updateStepState(stepId: string, state: PaymentStepState): Promise<boolean | null> {
    const result = await this.repository.update({ id: stepId }, { state });
    return this.actionResult(result);
  }
}
