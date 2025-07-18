import { IDataService } from '@library/shared/common/data/idata.service';
import { LoanRepository, PaymentAccountRepository } from '@library/shared/infrastructure/repository';
import { Injectable } from '@nestjs/common';
import { LoanPaymentRepository, PaymentsRouteRepository, PaymentsRouteStepRepository } from '@payment/modules/loan-payments/repositories';
import { LoanPaymentStepRepository, TransferErrorRepository, TransferRepository } from './repositories';

@Injectable()
export class PaymentDataService extends IDataService {
  constructor(
    public readonly transfers: TransferRepository,
    public readonly loanPayments: LoanPaymentRepository,
    public readonly loanPaymentSteps: LoanPaymentStepRepository,
    public readonly paymentsRouteSteps: PaymentsRouteStepRepository,
    public readonly paymentsRoute: PaymentsRouteRepository,
    public readonly transferErrors: TransferErrorRepository,
    public readonly paymentAccounts: PaymentAccountRepository,
    public readonly loans: LoanRepository
  ) {
    super();
  }
}
