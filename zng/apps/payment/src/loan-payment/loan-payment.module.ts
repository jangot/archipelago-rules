import { Module } from '@nestjs/common';
import { 
  FundingPaymentManager, 
  DisbursementPaymentManager, 
  RepaymentPaymentManager, 
  FeePaymentManager, 
  RefundPaymentManager, 
} from './managers';
import { 
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
    LoanPaymentService,
    PaymentRouteService,
    TransferExecutionService,
  ],
  exports: [
    LoanPaymentFactory,
    LoanPaymentService,
    PaymentRouteService,
    TransferExecutionService,
  ],
})
export class LoanPaymentModule {}
