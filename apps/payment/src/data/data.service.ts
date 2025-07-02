import { IDataService } from '@library/shared/common/data/idata.service';
import { ILoanRepository, IPaymentAccountRepository } from '@library/shared/infrastructure/interface';
import { Inject, Injectable } from '@nestjs/common';
import { ILoanPaymentRepository, ILoanPaymentStepRepository, IPaymentsRouteRepository, IPaymentsRouteStepRepository, ITransferErrorRepository, ITransferRepository } from '@payment/shared/interfaces/repositories';

@Injectable()
export class PaymentDataService extends IDataService {
  constructor(
    @Inject(ITransferRepository) public readonly transfers: ITransferRepository,
    @Inject(ILoanPaymentRepository) public readonly loanPayments: ILoanPaymentRepository,
    @Inject(ILoanPaymentStepRepository) public readonly loanPaymentSteps: ILoanPaymentStepRepository,
    @Inject(IPaymentsRouteStepRepository) public readonly paymentsRouteSteps: IPaymentsRouteStepRepository,
    @Inject(IPaymentsRouteRepository) public readonly paymentsRoute: IPaymentsRouteRepository,
    @Inject(ITransferErrorRepository) public readonly transferErrors: ITransferErrorRepository,
    @Inject(IPaymentAccountRepository) public readonly paymentAccounts: IPaymentAccountRepository,
    @Inject(ILoanRepository) public readonly loans: ILoanRepository,
  ) {
    super();
  }
}
