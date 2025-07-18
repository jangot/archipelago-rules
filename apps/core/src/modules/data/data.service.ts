import { IDataService } from '@library/shared/common/data/idata.service';
import { Injectable } from '@nestjs/common';
import { LoanRepository, PaymentAccountRepository } from '../../../../../libs/shared/src/infrastructure/repository';
import { LoginRepository } from '../auth/repositories/login.repository';
import { UserRegistrationRepository } from '../auth/repositories/user.registration.repository';
import { BillerRepository } from '../lending/repositories/biller.repository';
import { LoanApplicationRepository } from '../lending/repositories/loan-application.repository';
import { UserRepository } from '../users/repositories/user.repository';


@Injectable()
export class CoreDataService extends IDataService {
   
  constructor(
    public readonly users: UserRepository,
    public readonly loans: LoanRepository,
    public readonly logins: LoginRepository,
    public readonly userRegistrations: UserRegistrationRepository,
    public readonly billers: BillerRepository,
    public readonly paymentAccounts: PaymentAccountRepository,
    public readonly loanApplications: LoanApplicationRepository
  ) {
    super();
  } 
}
