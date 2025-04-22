import { IUserRepository, ILoanRepository, ILoginRepository, IUserRegistrationRepository, IBillerRepository } from '../../shared/interfaces/repositories';
import { BillerRepository } from './biller.repository';
import { LoanRepository } from './loan.repository';
import { LoginRepository } from './login.repository';
import { UserRegistrationRepository } from './user.registration.repository';
import { UserRepository } from './user.repository';

export * from './user.repository';
export * from './loan.repository';
export * from './login.repository';
export * from './user.registration.repository';
export * from './biller.repository';

export const CustomCoreRepositories = [
  { provide: IUserRepository, useClass: UserRepository },
  { provide: ILoanRepository, useClass: LoanRepository },
  { provide: ILoginRepository, useClass: LoginRepository },
  { provide: IUserRegistrationRepository, useClass: UserRegistrationRepository },
  { provide: IBillerRepository, useClass: BillerRepository },
];
