import { Inject, Injectable } from '@nestjs/common';
import { IBillerRepository, ILoanRepository, ILoginRepository, IUserRegistrationRepository, IUserRepository } from '../shared/interfaces/repositories';
import { IDataService } from '@library/shared/common/data/idata.service';

@Injectable()
export class CoreDataService extends IDataService {
  constructor(
    @Inject(IUserRepository) public readonly users: IUserRepository,
    @Inject(ILoanRepository) public readonly loans: ILoanRepository,
    @Inject(ILoginRepository) public readonly logins: ILoginRepository,
    @Inject(IUserRegistrationRepository) public readonly userRegistrations: IUserRegistrationRepository,
    @Inject(IBillerRepository) public readonly billers: IBillerRepository
  ) {
    super();
  } 
}
