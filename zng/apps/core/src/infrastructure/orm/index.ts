import {
  IUserRepository,
  ILoanRepository,
  ILoginRepository,
  IUserRegistrationRepository,
} from '../../shared/interfaces/repositories';
import { LoanRepository } from './loan.repository';
import { LoginRepository } from './login.repository';
import { UserRegistrationRepository } from './user.registration.repository';
import { UserRepository } from './user.repository';

export * from './user.repository';
export * from './loan.repository';
export * from './login.repository';
export * from './user.registration.repository';

export const CustomCoreRepositories = [
  { provide: IUserRepository, useClass: UserRepository },
  { provide: ILoanRepository, useClass: LoanRepository },
  { provide: ILoginRepository, useClass: LoginRepository },
  { provide: IUserRegistrationRepository, useClass: UserRegistrationRepository },
];
