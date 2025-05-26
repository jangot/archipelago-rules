import { IUserRepository, ILoanRepository, ILoginRepository, IUserRegistrationRepository, IBillerRepository, IPaymentAccountRepository, ITransferRepository, ILoanPaymentRepository, ILoanInviteeRepository, IPaymentsRouteStepRepository, IPaymentsRouteRepository, ITransferErrorRepository, ILoanPaymentStepRepository } from '../../shared/interfaces/repositories';
import { BillerRepository } from './biller.repository';
import { LoanRepository } from './loan.repository';
import { LoginRepository } from './login.repository';
import { PaymentAccountRepository } from './payment.account.repository';
import { UserRegistrationRepository } from './user.registration.repository';
import { UserRepository } from './user.repository';
import { TransferRepository } from './transfer.repository';
import { LoanPaymentRepository } from './loan.payment.repository';
import { LoanInviteeRepository } from './loan.invitee.repository';
import { PaymentsRouteStepRepository } from './payments.route.step.repository';
import { PaymentsRouteRepository } from './payments.route.repository';
import { TransferErrorRepository } from './transfer.error.repository';
import { LoanPaymentStepRepository } from './loan.payment.step.repository';

export * from './user.repository';
export * from './loan.repository';
export * from './login.repository';
export * from './user.registration.repository';
export * from './biller.repository';
export * from './payment.account.repository';
export * from './transfer.repository';
export * from './loan.payment.repository';
export * from './loan.payment.step.repository';
export * from './loan.invitee.repository';
export * from './payments.route.step.repository';
export * from './payments.route.repository';
export * from './transfer.error.repository';

export const CustomCoreRepositories = [
  { provide: IUserRepository, useClass: UserRepository },
  { provide: ILoanRepository, useClass: LoanRepository },
  { provide: ILoginRepository, useClass: LoginRepository },
  { provide: IUserRegistrationRepository, useClass: UserRegistrationRepository },
  { provide: IBillerRepository, useClass: BillerRepository },
  { provide: IPaymentAccountRepository, useClass: PaymentAccountRepository },
  { provide: ITransferRepository, useClass: TransferRepository },
  { provide: ILoanPaymentRepository, useClass: LoanPaymentRepository },
  { provide: ILoanPaymentStepRepository, useClass: LoanPaymentStepRepository },
  { provide: ILoanInviteeRepository, useClass: LoanInviteeRepository },
  { provide: IPaymentsRouteStepRepository, useClass: PaymentsRouteStepRepository },
  { provide: IPaymentsRouteRepository, useClass: PaymentsRouteRepository },
  { provide: ITransferErrorRepository, useClass: TransferErrorRepository },
];
