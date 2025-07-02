import { IBillerRepository, ILoanInviteeRepository, ILoginRepository, IUserRegistrationRepository, IUserRepository } from '@core/shared/interfaces/repositories';
import { BillerRepository } from '../../lending/repositories/biller.repository';
import { LoginRepository } from '../../auth/repositories/login.repository';
import { UserRegistrationRepository } from '../../auth/repositories/user.registration.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { LoanInviteeRepository } from '../../lending/repositories/loan.invitee.repository';

export * from '../../users/repositories/user.repository';
export * from '../../auth/repositories/login.repository';
export * from '../../auth/repositories/user.registration.repository';
export * from '../../lending/repositories/biller.repository';
export * from '../../lending/repositories/loan.invitee.repository';

export const CustomCoreRepositories = [
  { provide: IUserRepository, useClass: UserRepository },
  { provide: ILoginRepository, useClass: LoginRepository },
  { provide: IUserRegistrationRepository, useClass: UserRegistrationRepository },
  { provide: IBillerRepository, useClass: BillerRepository },
  { provide: ILoanInviteeRepository, useClass: LoanInviteeRepository },
];
