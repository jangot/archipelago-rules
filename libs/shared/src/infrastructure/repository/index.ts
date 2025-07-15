
import { PaymentAccountRepository } from './payment.account.repository';
import { LoanRepository } from './loan.repository';
import { ILoanRepository, IPaymentAccountRepository } from '../interface';
import { ILoanApplicationRepository } from '@core/shared/interfaces/repositories/iloan-application.repository';
import { LoanApplicationRepository } from '@core/modules/lending/repositories/loan-application.repository';


export * from './payment.account.repository';
export * from './loan.repository';

export const SharedCoreRepositories = [
  { provide: IPaymentAccountRepository, useClass: PaymentAccountRepository },
  { provide: ILoanRepository, useClass: LoanRepository },
  { provide: ILoanApplicationRepository, useClass: LoanApplicationRepository },
];
