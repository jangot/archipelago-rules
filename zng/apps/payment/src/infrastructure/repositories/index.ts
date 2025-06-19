import { ILoanPaymentRepository, ILoanPaymentStepRepository, IPaymentsRouteRepository, IPaymentsRouteStepRepository, ITransferErrorRepository, ITransferRepository } from '@payment/shared/interfaces/repositories';
import { TransferRepository } from './transfer.repository';
import { LoanPaymentRepository } from './loan.payment.repository';
import { LoanPaymentStepRepository } from './loan.payment.step.repository';
import { PaymentsRouteStepRepository } from './payments.route.step.repository';
import { PaymentsRouteRepository } from './payments.route.repository';
import { TransferErrorRepository } from './transfer.error.repository';

export * from './loan.payment.repository';
export * from './loan.payment.step.repository';
export * from './transfer.repository';
export * from './payments.route.step.repository';
export * from './payments.route.repository';
export * from './transfer.error.repository';

export const CustomPaymentRepositories = [
  { provide: ITransferRepository, useClass: TransferRepository },
  { provide: ILoanPaymentRepository, useClass: LoanPaymentRepository },
  { provide: ILoanPaymentStepRepository, useClass: LoanPaymentStepRepository },
  { provide: IPaymentsRouteStepRepository, useClass: PaymentsRouteStepRepository },
  { provide: IPaymentsRouteRepository, useClass: PaymentsRouteRepository },
  { provide: ITransferErrorRepository, useClass: TransferErrorRepository },
];
