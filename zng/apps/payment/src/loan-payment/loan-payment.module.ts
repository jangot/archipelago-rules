import { Module } from '@nestjs/common';
import { 
  FundingPaymentManager, 
  DisbursementPaymentManager, 
  RepaymentPaymentManager, 
  FeePaymentManager, 
  RefundPaymentManager, 
} from './managers';
import { LoanPaymentFactory } from './loan-payment.factory';
import { DataModule } from '@payment/data/data.module';
import { DomainModule } from '../domain/domain.module';

/**
 * Module for handling loan payment operations
 */
@Module({
  imports: [DataModule, DomainModule],
  providers: [
    LoanPaymentFactory,
    FundingPaymentManager,
    DisbursementPaymentManager,
    RepaymentPaymentManager,
    FeePaymentManager,
    RefundPaymentManager,
  ],
  exports: [
    LoanPaymentFactory,
  ],
})
export class LoanPaymentModule {}
