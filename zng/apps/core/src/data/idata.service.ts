import { IApplicationUser, ILoan } from '@library/entity/interface';
import { ILoanRepository, IUserRepository } from './repository/interfaces';

export abstract class IDataService {
  readonly users: IUserRepository<IApplicationUser>;
  readonly loans: ILoanRepository<ILoan>;
}
