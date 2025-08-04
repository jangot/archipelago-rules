import { IDataService } from '@library/shared/common/data/idata.service';
import { LoanRepository, PaymentAccountRepository } from '@library/shared/infrastructure/repository';
import { Injectable } from '@nestjs/common';
import { LoanApplicationRepository } from '../../../../../libs/shared/src/infrastructure/repository/loan-application.repository';
import { LoginRepository } from '../auth/repositories/login.repository';
import { UserRegistrationRepository } from '../auth/repositories/user.registration.repository';
import { UserRepository } from '../users/repositories/user.repository';


@Injectable()
export class CoreDataService extends IDataService {
   
  constructor(
    public readonly users: UserRepository,
    public readonly loans: LoanRepository,
    public readonly logins: LoginRepository,
    public readonly userRegistrations: UserRegistrationRepository,
    public readonly paymentAccounts: PaymentAccountRepository,
    public readonly loanApplications: LoanApplicationRepository,
  ) {
    super();
  } 
}
