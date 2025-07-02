import { PaymentAccount } from '@library/shared/domain/entity/payment.account.entity';
import { PaymentAccountRelation } from '@library/shared/domain/entity/relation';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { IPaymentAccountRepository } from '../interface';

@Injectable()
export class PaymentAccountRepository extends RepositoryBase<PaymentAccount> implements IPaymentAccountRepository {
  private readonly logger: Logger = new Logger(PaymentAccountRepository.name);

  constructor(@InjectRepository(PaymentAccount) protected readonly repository: Repository<PaymentAccount>) {
    super(repository, PaymentAccount);
  }

  public async createPaymentAccount(input: DeepPartial<PaymentAccount>): Promise<PaymentAccount | null> {
    return this.insert(input, true);
  }

  public getPaymentAccountById(paymentAccountId: string, relations?: PaymentAccountRelation[]): Promise<PaymentAccount | null> {
    return this.repository.findOne({ where: { id: paymentAccountId }, relations });
  }
}
