import { IPaymentAccountRepository } from '@library/shared/interfaces/repositories';
import { PaymentAccountRepository } from './payment.account.repository';

export * from './payment.account.repository';

export const SharedCoreRepositories = [
  { provide: IPaymentAccountRepository, useClass: PaymentAccountRepository },
];
