import { Inject, Injectable } from '@nestjs/common';
import { IDataService } from './idata.service';
import { IUserRepository, ILoanRepository, ILoginRepository } from './repository/interfaces';

@Injectable()
export class DataService implements IDataService {
  constructor(
    @Inject(IUserRepository) public readonly users: IUserRepository,
    @Inject(ILoanRepository) public readonly loans: ILoanRepository,
    @Inject(IAuthSecretRepository) public readonly logins: ILoginRepository
  ) {}

  // Additional methods for IDataService can be implemented here
}
