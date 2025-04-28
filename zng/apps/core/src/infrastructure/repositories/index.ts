import { IUserRepository, ILoanRepository, ILoginRepository, IUserRegistrationRepository, IBillerRepository, IPaymentAccountRepository, ITransferRepository, ILoanPaymentRepository } from '../../shared/interfaces/repositories';
import { BillerRepository } from './biller.repository';
import { LoanRepository } from './loan.repository';
import { LoginRepository } from './login.repository';
import { PaymentAccountRepository } from './payment.account.repository';
import { UserRegistrationRepository } from './user.registration.repository';
import { UserRepository } from './user.repository';
import { TransferRepository } from './transfer.repository';
import { LoanPaymentRepository } from './loan.payment.repository';

export * from './user.repository';
export * from './loan.repository';
export * from './login.repository';
export * from './user.registration.repository';
export * from './biller.repository';
export * from './payment.account.repository';
export * from './transfer.repository';
export * from './loan.payment.repository';

export const CustomCoreRepositories = [
  { provide: IUserRepository, useClass: UserRepository },
  { provide: ILoanRepository, useClass: LoanRepository },
  { provide: ILoginRepository, useClass: LoginRepository },
  { provide: IUserRegistrationRepository, useClass: UserRegistrationRepository },
  { provide: IBillerRepository, useClass: BillerRepository },
  { provide: IPaymentAccountRepository, useClass: PaymentAccountRepository },
  { provide: ITransferRepository, useClass: TransferRepository },
  { provide: ILoanPaymentRepository, useClass: LoanPaymentRepository },
];
