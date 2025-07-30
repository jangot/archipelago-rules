
import { LoanApplicationRepository } from '@core/modules/lending/repositories/loan-application.repository';
import { LoanRepository } from './loan.repository';
import { NotificationDefinitionRepository } from './notification.definition.repository';
import { PaymentAccountRepository } from './payment.account.repository';

export * from './loan.repository';
export * from './notification.definition.repository';
export * from './payment.account.repository';

export const SharedRepositories = [
  PaymentAccountRepository,
  LoanRepository,
  LoanApplicationRepository,
  NotificationDefinitionRepository,
];
