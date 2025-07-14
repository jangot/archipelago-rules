
import { PaymentAccountRepository } from './payment.account.repository';
import { LoanRepository } from './loan.repository';
import { ILoanRepository, IPaymentAccountRepository } from '../interface';
import { ILoanApplicationRepository } from '@library/shared/infrastructure/interface/iloan.application.repository';
import { LoanApplicationRepository } from '@library/shared/infrastructure/repository/loan.application.repository';


export * from './payment.account.repository';
export * from './loan.repository';

export const SharedCoreRepositories = [
  { provide: IPaymentAccountRepository, useClass: PaymentAccountRepository },
  { provide: ILoanRepository, useClass: LoanRepository },
  { provide: ILoanApplicationRepository, useClass: LoanApplicationRepository },
];
