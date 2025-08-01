import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DomainModule } from '@payment/modules/domain';
import { DataModule } from '../data';
import { LoanPaymentStepModule } from '../loan-payment-steps';
import { ILoanPaymentFactory } from './interfaces';
import { LoanPaymentFactory } from './loan-payment.factory';
import { LoanPaymentService } from './loan-payment.service';
import {
  DisbursementPaymentManager,
  FeePaymentManager,
  FundingPaymentManager,
  RefundPaymentManager,
  RepaymentPaymentManager,
} from './managers';

/**
 * Module for handling loan payment operations
 */
@Module({
  imports: [ConfigModule, DataModule, DomainModule, LoanPaymentStepModule],
  providers: [
    LoanPaymentFactory,
    { provide: ILoanPaymentFactory, useClass: LoanPaymentFactory },
    FundingPaymentManager,
    DisbursementPaymentManager,
    RepaymentPaymentManager,
    FeePaymentManager,
    RefundPaymentManager,
    LoanPaymentService,
  ],
  exports: [LoanPaymentService],
})
export class LoanPaymentModule {}
