import { Module } from '@nestjs/common';
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
import { LoanPaymentFactory } from './loan-payment.factory';
import { DataModule } from '@payment/data/data.module';

/**
 * Module for handling loan payment operations
 */
@Module({
  imports: [DataModule],
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
