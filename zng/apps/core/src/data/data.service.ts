import { Inject, Injectable } from '@nestjs/common';
import { IDataService } from './idata.service';
import { ILoanRepository, ILoginRepository, IUserRegistrationRepository, IUserRepository } from '../shared/interfaces/repositories';

@Injectable()
export class DataService implements IDataService {
  constructor(
    @Inject(IUserRepository) public readonly users: IUserRepository,
    @Inject(ILoanRepository) public readonly loans: ILoanRepository,
    @Inject(ILoginRepository) public readonly logins: ILoginRepository,
    @Inject(IUserRegistrationRepository) public readonly userRegistrations: IUserRegistrationRepository
  ) {}

  // Additional methods for IDataService can be implemented here
}
