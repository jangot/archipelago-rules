import { LoanPaymentStepRepository } from '@payment/modules/loan-payment-steps/repositories';
import { LoanPaymentRepository, PaymentsRouteRepository, PaymentsRouteStepRepository } from '@payment/modules/loan-payments/repositories';
import { TransferErrorRepository, TransferRepository } from '@payment/modules/transfer-execution/repositories';
import { ILoanPaymentRepository, ILoanPaymentStepRepository, IPaymentsRouteRepository, IPaymentsRouteStepRepository, ITransferErrorRepository, ITransferRepository } from '@payment/shared/interfaces/repositories';

export const CustomPaymentRepositories = [
  { provide: ILoanPaymentRepository, useClass: LoanPaymentRepository },
  { provide: IPaymentsRouteRepository, useClass: PaymentsRouteRepository },
  { provide: IPaymentsRouteStepRepository, useClass: PaymentsRouteStepRepository },
  { provide: ILoanPaymentStepRepository, useClass: LoanPaymentStepRepository },
  { provide: ITransferRepository, useClass: TransferRepository },
  { provide: ITransferErrorRepository, useClass: TransferErrorRepository },
];
