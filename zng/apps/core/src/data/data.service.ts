import { Inject, Injectable } from '@nestjs/common';
import { IDataService } from './idata.service';
import { IUserRepository, ILoanRepository, IAuthSecretRepository } from './repository/interfaces';

@Injectable()
export class DataService implements IDataService {
  readonly users: IUserRepository;
  readonly loans: ILoanRepository;
  readonly authSecrets: IAuthSecretRepository;

  constructor(
    @Inject(IUserRepository)
    protected readonly userRepository: IUserRepository,
    @Inject(ILoanRepository)
    protected readonly loanRepository: ILoanRepository,
    @Inject(IAuthSecretRepository)
    protected readonly authSecretRepository: IAuthSecretRepository
  ) {
    this.users = userRepository;
    this.loans = loanRepository;
    this.authSecrets = authSecretRepository;
  }

  // Additional methods for IDataService can be implemented here
}
