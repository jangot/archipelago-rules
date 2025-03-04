import { ILoginRepository, ILoanRepository, IUserRepository } from './repository/interfaces';

export abstract class IDataService {
  readonly users: IUserRepository;
  readonly loans: ILoanRepository;
  readonly authSecrets: ILoginRepository;
}
