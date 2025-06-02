import { Inject, Injectable } from '@nestjs/common';
import { IBillerRepository, ILoanInviteeRepository, ILoanRepository, ILoginRepository, IUserRegistrationRepository, IUserRepository } from '../shared/interfaces/repositories';
import { IDataService } from '@library/shared/common/data/idata.service';
import { IPaymentAccountRepository } from '@library/shared/interfaces/repositories';

@Injectable()
export class CoreDataService extends IDataService {
   
  constructor(
    @Inject(IUserRepository) public readonly users: IUserRepository,
    @Inject(ILoanRepository) public readonly loans: ILoanRepository,
    @Inject(ILoginRepository) public readonly logins: ILoginRepository,
    @Inject(IUserRegistrationRepository) public readonly userRegistrations: IUserRegistrationRepository,
    @Inject(IBillerRepository) public readonly billers: IBillerRepository,
    @Inject(IPaymentAccountRepository) public readonly paymentAccounts: IPaymentAccountRepository,
    @Inject(ILoanInviteeRepository) public readonly loanInvitees: ILoanInviteeRepository,
  ) {
    super();
  } 
}
