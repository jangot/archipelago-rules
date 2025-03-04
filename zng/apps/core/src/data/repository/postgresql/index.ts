import { ILoginRepository, ILoanRepository, IUserRepository } from '../interfaces';
import { UserRepository } from './user.repository';
import { LoanRepository } from './loan.repository';
import { LoginRepository } from './login.repository';

export * from './user.repository';
export * from './loan.repository';
export * from './login.repository';

export const CustomCoreRepositories = [
  { provide: IUserRepository, useClass: UserRepository },
  { provide: ILoanRepository, useClass: LoanRepository },
  { provide: ILoginRepository, useClass: LoginRepository },
];
