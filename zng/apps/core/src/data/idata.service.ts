import {
  ILoginRepository,
  ILoanRepository,
  IUserRepository,
  IUserRegistrationRepository,
} from './repository/interfaces';

export abstract class IDataService {
  readonly users: IUserRepository;
  readonly loans: ILoanRepository;
  readonly logins: ILoginRepository;
  readonly userRegistrations: IUserRegistrationRepository;
}
