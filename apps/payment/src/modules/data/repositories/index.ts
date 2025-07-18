import { LoanPaymentStepRepository } from '../../loan-payment-steps/repositories/loan.payment.step.repository';
import { LoanPaymentRepository } from '../../loan-payments/repositories/loan.payment.repository';
import { PaymentsRouteRepository } from '../../loan-payments/repositories/payments.route.repository';
import { PaymentsRouteStepRepository } from '../../loan-payments/repositories/payments.route.step.repository';
import { TransferErrorRepository } from '../../transfer-execution/repositories/transfer.error.repository';
import { TransferRepository } from '../../transfer-execution/repositories/transfer.repository';

export * from '../../loan-payment-steps/repositories/loan.payment.step.repository';
export * from '../../loan-payments/repositories/loan.payment.repository';
export * from '../../loan-payments/repositories/payments.route.repository';
export * from '../../loan-payments/repositories/payments.route.step.repository';
export * from '../../transfer-execution/repositories/transfer.error.repository';
export * from '../../transfer-execution/repositories/transfer.repository';

export const CustomPaymentRepositories = [
  { provide: LoanPaymentRepository, useClass: LoanPaymentRepository },
  { provide: PaymentsRouteRepository, useClass: PaymentsRouteRepository },
  { provide: PaymentsRouteStepRepository, useClass: PaymentsRouteStepRepository },
  { provide: LoanPaymentStepRepository, useClass: LoanPaymentStepRepository },
  { provide: TransferRepository, useClass: TransferRepository },
  { provide: TransferErrorRepository, useClass: TransferErrorRepository },
];
