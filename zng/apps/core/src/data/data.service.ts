import { Inject, Injectable, Scope } from '@nestjs/common';
import { IDataService } from './idata.service';
import { IUserRepository, ILoanRepository } from './repository/interfaces';

@Injectable()
export class DataService implements IDataService {
  readonly users: IUserRepository;
  readonly loans: ILoanRepository;

  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
    @Inject(ILoanRepository)
    private readonly loanRepository: ILoanRepository,
  ) {
    this.users = userRepository;
    this.loans = loanRepository;
  }

  // Additional methods for IDataService can be implemented here
}
