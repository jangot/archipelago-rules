import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from '../../../../../libs/shared/src/domain/entities/loan.entity';
import { LoanPayment } from '../../../../../libs/shared/src/domain/entities/loan.payment.entity';
import { LoanPaymentStep } from '../../../../../libs/shared/src/domain/entities/loan.payment.step.entity';
import { Transfer } from '../../../../../libs/shared/src/domain/entities/transfer.entity';
import { PaymentAccount } from '../../../../../libs/shared/src/domain/entities/payment.account.entity';
import { LoanPaymentFactory } from './loan-payment.factory';
import { 
  FundingPaymentManager, 
  DisbursementPaymentManager, 
  RepaymentPaymentManager, 
  FeePaymentManager, 
  RefundPaymentManager, 
} from './managers';
import { 
  LoanPaymentStepManager, 
  LoanPaymentService, 
  PaymentRouteService,
  TransferExecutionService, 
} from './services';

/**
 * Module for handling loan payment operations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Loan, 
      LoanPayment, 
      LoanPaymentStep, 
      Transfer, 
      PaymentAccount,
    ]),
  ],
  providers: [
    LoanPaymentFactory,
    FundingPaymentManager,
    DisbursementPaymentManager,
    RepaymentPaymentManager,
    FeePaymentManager,
    RefundPaymentManager,
    LoanPaymentStepManager,
    LoanPaymentService,
    PaymentRouteService,
    TransferExecutionService,
  ],
  exports: [
    LoanPaymentFactory,
    LoanPaymentStepManager,
    LoanPaymentService,
    PaymentRouteService,
    TransferExecutionService,
  ],
})
export class LoanPaymentModule {}
