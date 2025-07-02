
import { PaymentAccountRepository } from './payment.account.repository';
import { LoanRepository } from './loan.repository';
import { ILoanRepository, IPaymentAccountRepository } from '../interface';

export * from './payment.account.repository';
export * from './loan.repository';

export const SharedCoreRepositories = [
  { provide: IPaymentAccountRepository, useClass: PaymentAccountRepository },
  { provide: ILoanRepository, useClass: LoanRepository },
];
