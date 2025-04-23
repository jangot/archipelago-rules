import { PaymentAccount } from '@core/domain/entities/payment.account.entity';
import { IPaymentAccountRepository } from '@core/shared/interfaces/repositories';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class PaymentAccountRepository extends RepositoryBase<PaymentAccount> implements IPaymentAccountRepository {
  private readonly logger: Logger = new Logger(PaymentAccountRepository.name);

  constructor(@InjectRepository(PaymentAccount) protected readonly repository: Repository<PaymentAccount>) {
    super(repository, PaymentAccount);
  }
}
