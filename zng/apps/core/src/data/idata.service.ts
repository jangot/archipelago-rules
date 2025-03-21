import { IUserRepository, ILoanRepository, ILoginRepository, IUserRegistrationRepository } from '../shared/interfaces/repositories';

export abstract class IDataService {
  readonly users: IUserRepository;
  readonly loans: ILoanRepository;
  readonly logins: ILoginRepository;
  readonly userRegistrations: IUserRegistrationRepository;
}
