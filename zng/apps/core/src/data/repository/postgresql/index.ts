import { ILoanRepository, IUserRepository } from '../interfaces';
import { UserRepository } from './user.repository';
import { LoanRepository } from './loan.repository';

export * from './user.repository';
export * from './loan.repository';

export * from './config';

export const CustomCoreRepositories = [
  { provide: IUserRepository, useClass: UserRepository },
  { provide: ILoanRepository, useClass: LoanRepository}
];