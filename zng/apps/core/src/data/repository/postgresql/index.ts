import { IAuthSecretRepository, ILoanRepository, IRegistrationRepository, IUserRepository } from '../interfaces';
import { UserRepository } from './user.repository';
import { LoanRepository } from './loan.repository';
import { AuthSecretRepository } from './auth-secret.repository';
import { RegistrationRepository } from './registration.repository';

export * from './user.repository';
export * from './loan.repository';
export * from './auth-secret.repository';
export * from './registration.repository';

export const CustomCoreRepositories = [
  { provide: IUserRepository, useClass: UserRepository },
  { provide: ILoanRepository, useClass: LoanRepository },
  { provide: IAuthSecretRepository, useClass: AuthSecretRepository },
  { provide: IRegistrationRepository, useClass: RegistrationRepository },
];
