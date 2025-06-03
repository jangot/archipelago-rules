import { IBillerRepository, ILoanInviteeRepository, ILoginRepository, IUserRegistrationRepository, IUserRepository } from '@core/shared/interfaces/repositories';
import { BillerRepository } from './biller.repository';
import { LoginRepository } from './login.repository';
import { UserRegistrationRepository } from './user.registration.repository';
import { UserRepository } from './user.repository';
import { LoanInviteeRepository } from './loan.invitee.repository';

export * from './user.repository';
export * from './login.repository';
export * from './user.registration.repository';
export * from './biller.repository';
export * from './loan.invitee.repository';

export const CustomCoreRepositories = [
  { provide: IUserRepository, useClass: UserRepository },
  { provide: ILoginRepository, useClass: LoginRepository },
  { provide: IUserRegistrationRepository, useClass: UserRegistrationRepository },
  { provide: IBillerRepository, useClass: BillerRepository },
  { provide: ILoanInviteeRepository, useClass: LoanInviteeRepository },
];
