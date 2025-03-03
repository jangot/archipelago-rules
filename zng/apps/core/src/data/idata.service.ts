import {
  IAuthSecretRepository,
  ILoanRepository,
  IRegistrationRepository,
  IUserRepository,
} from './repository/interfaces';

export abstract class IDataService {
  readonly users: IUserRepository;
  readonly loans: ILoanRepository;
  readonly authSecrets: IAuthSecretRepository;
  readonly registrations: IRegistrationRepository;
}
