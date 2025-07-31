import { PaymentAccountState } from '@library/entity/enum';
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

  public async getPaymentAccountById(paymentAccountId: string, relations?: PaymentAccountRelation[]): Promise<PaymentAccount | null> {
    return this.repository.findOne({ where: { id: paymentAccountId }, relations });
  }

  public async getPaymentAccountsByUserId(userId: string, relations?: PaymentAccountRelation[]): Promise<PaymentAccount[]> {
    return this.repository.find({ where: { userId }, relations });
  }

  public async setPaymentAccountVerificationState(paymentAccountId: string, state: PaymentAccountState): Promise<boolean | null> {
    const result = await this.repository.update({ id: paymentAccountId }, { state });
    return this.actionResult(result);
  }
}
