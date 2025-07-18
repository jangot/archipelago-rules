import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { PaymentAccount } from '@library/shared/domain/entity/payment.account.entity';
import { PaymentAccountRelation } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentAccountRepository extends RepositoryBase<PaymentAccount> {
  private readonly logger: Logger = new Logger(PaymentAccountRepository.name);

  constructor(
    @InjectRepository(PaymentAccount)
    protected readonly repository: Repository<PaymentAccount>
  ) {
    super(repository, PaymentAccount);
  }

  public async createPaymentAccount(input: Partial<PaymentAccount>): Promise<PaymentAccount | null> {
    return this.insert(input, true);
  }

  public getPaymentAccountById(paymentAccountId: string, relations?: PaymentAccountRelation[]): Promise<PaymentAccount | null> {
    return this.repository.findOne({ where: { id: paymentAccountId }, relations });
  }
}
