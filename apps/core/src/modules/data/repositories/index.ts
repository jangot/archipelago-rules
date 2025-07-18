import { LoginRepository } from '../../auth/repositories/login.repository';
import { UserRegistrationRepository } from '../../auth/repositories/user.registration.repository';
import { BillerRepository } from '../../lending/repositories/biller.repository';
import { UserRepository } from '../../users/repositories/user.repository';

export * from '../../auth/repositories/login.repository';
export * from '../../auth/repositories/user.registration.repository';
export * from '../../lending/repositories/biller.repository';
export * from '../../users/repositories/user.repository';

export const CustomCoreRepositories = [
  UserRepository,
  LoginRepository,
  UserRegistrationRepository,
  BillerRepository,
];
