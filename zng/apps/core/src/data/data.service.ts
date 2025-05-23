import { Inject, Injectable } from '@nestjs/common';
import { IBillerRepository, ILoanInviteeRepository, ILoanPaymentRepository, ILoanRepository, ILoginRepository, IPaymentAccountRepository, IPaymentsRouteRepository, IPaymentsRouteStepRepository, ITransferRepository, IUserRegistrationRepository, IUserRepository } from '../shared/interfaces/repositories';
import { IDataService } from '@library/shared/common/data/idata.service';

@Injectable()
export class CoreDataService extends IDataService {
  // eslint-disable-next-line max-params
  constructor(
    @Inject(IUserRepository) public readonly users: IUserRepository,
    @Inject(ILoanRepository) public readonly loans: ILoanRepository,
    @Inject(ILoginRepository) public readonly logins: ILoginRepository,
    @Inject(IUserRegistrationRepository) public readonly userRegistrations: IUserRegistrationRepository,
    @Inject(IBillerRepository) public readonly billers: IBillerRepository,
    @Inject(IPaymentAccountRepository) public readonly paymentAccounts: IPaymentAccountRepository,
    @Inject(ITransferRepository) public readonly transfers: ITransferRepository,
    @Inject(ILoanPaymentRepository) public readonly loanPayments: ILoanPaymentRepository,
    @Inject(ILoanInviteeRepository) public readonly loanInvitees: ILoanInviteeRepository,
    @Inject(IPaymentsRouteStepRepository) public readonly paymentsRouteSteps: IPaymentsRouteStepRepository,
    @Inject(IPaymentsRouteRepository) public readonly paymentsRoute: IPaymentsRouteStepRepository,
  ) {
    super();
  } 
}
