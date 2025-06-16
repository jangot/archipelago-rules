import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { 
  FundingPaymentManager, 
  DisbursementPaymentManager, 
  RepaymentPaymentManager, 
  FeePaymentManager, 
  RefundPaymentManager, 
} from './managers';
import { LoanPaymentFactory } from './loan-payment.factory';
import { ILoanPaymentFactory } from './interfaces';
import { DataModule } from '@payment/data/data.module';
import { PaymentDomainService } from '@payment/domain/services';

/**
 * Module for handling loan payment operations
 */
@Module({
  imports: [ConfigModule, DataModule],
  providers: [
    PaymentDomainService,
    LoanPaymentFactory,
    { provide: ILoanPaymentFactory, useClass: LoanPaymentFactory },
    FundingPaymentManager,
    DisbursementPaymentManager,
    RepaymentPaymentManager,
    FeePaymentManager,
    RefundPaymentManager,
  ],
  exports: [
    LoanPaymentFactory,
    ILoanPaymentFactory,
  ],
})
export class LoanPaymentModule {}
