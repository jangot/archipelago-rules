import { LoanPaymentStepRepository } from '@payment/modules/loan-payment-steps/repositories';
import { LoanPaymentRepository } from '@payment/modules/loan-payments/repositories';
import { PaymentsRouteRepository } from '@payment/modules/loan-payments/repositories';
import { PaymentsRouteStepRepository } from '@payment/modules/loan-payments/repositories';
import { TransferErrorRepository } from '@payment/modules/transfer-execution/repositories';
import { TransferRepository } from '@payment/modules/transfer-execution/repositories';

export * from '../../loan-payment-steps/repositories/loan.payment.step.repository';
export * from '../../loan-payments/repositories/loan.payment.repository';
export * from '../../loan-payments/repositories/payments.route.repository';
export * from '../../loan-payments/repositories/payments.route.step.repository';
export * from '../../transfer-execution/repositories/transfer.error.repository';
export * from '../../transfer-execution/repositories/transfer.repository';

export const CustomPaymentRepositories = [
  LoanPaymentRepository,
  PaymentsRouteRepository,
  PaymentsRouteStepRepository,
  LoanPaymentStepRepository,
  TransferRepository,
  TransferErrorRepository,
];
