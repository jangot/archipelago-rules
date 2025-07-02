import { LoanPayment } from '@library/shared/domain/entity';
import { LoanPaymentRelation } from '@library/shared/domain/entity/relation';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { ILoanPaymentRepository } from '@payment/shared/interfaces/repositories';
import { ILoanPayment } from '@library/entity/entity-interface';

@Injectable()
export class LoanPaymentRepository extends RepositoryBase<LoanPayment> implements ILoanPaymentRepository {
  private readonly logger: Logger = new Logger(LoanPaymentRepository.name);

  constructor(@InjectRepository(LoanPayment) protected readonly repository: Repository<LoanPayment>) {
    super(repository, LoanPayment);
  }

  public async getPaymentById(id: string, relations?: LoanPaymentRelation[]): Promise<LoanPayment | null> {
    return this.repository.findOne({ where: { id }, relations });
  }

  public async getPaymentsByIds(paymentIds: string[], relations: LoanPaymentRelation[] | undefined): Promise<ILoanPayment[] | null> {
    return this.repository.find({ where: { id: In(paymentIds) }, relations });
  }

  public async updatePayment(id: string, updates: DeepPartial<LoanPayment>): Promise<boolean | null> {
    const result = await this.repository.update(id, updates);
    if (!result) return null;
    return this.actionResult(result);
  }

  public async createPayment(input: DeepPartial<LoanPayment>): Promise<LoanPayment | null> {
    return this.insert(input, true);
  }

  public async createPayments(payments: DeepPartial<LoanPayment>[]): Promise<LoanPayment[] | null> {
    return this.repository.create(payments);
  }
}
