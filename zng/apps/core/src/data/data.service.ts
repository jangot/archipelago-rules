import { Injectable, Scope } from '@nestjs/common';
import { IDataService } from './idata.service';
import { IUserRepository, ILoanRepository } from './repository/interfaces';
import { LoanRepository, UserRepository } from './repository/postgresql';
import { IApplicationUser, ILoan } from '@library/entity/interface';

@Injectable({ scope: Scope.DEFAULT})
export class DataService implements IDataService {
  readonly users: IUserRepository<IApplicationUser>;
  readonly loans: ILoanRepository<ILoan>;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly loanRepository: LoanRepository,
  ) {
    this.users = userRepository;
    this.loans = loanRepository;
  }

  // Additional methods for IDataService can be implemented here
}
