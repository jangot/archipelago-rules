import { LoanPayment } from '@library/shared/domain/entities';
import { LoanPaymentRelation } from '@library/shared/domain/entities/relations';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ILoanPaymentRepository } from '@payment/shared/interfaces/repositories';

@Injectable()
export class LoanPaymentRepository extends RepositoryBase<LoanPayment> implements ILoanPaymentRepository {
  private readonly logger: Logger = new Logger(LoanPaymentRepository.name);

  constructor(@InjectRepository(LoanPayment) protected readonly repository: Repository<LoanPayment>) {
    super(repository, LoanPayment);
  }

  public async getPaymentById(id: string, relations?: LoanPaymentRelation[]): Promise<LoanPayment | null> {
    return this.repository.findOne({ where: { id }, relations });
  }

  public async updatePayment(id: string, updates: DeepPartial<LoanPayment>): Promise<boolean | null> {
    const result = await this.repository.update(id, updates);
    if (!result) return null;
    return this.actionResult(result);
  }
}
