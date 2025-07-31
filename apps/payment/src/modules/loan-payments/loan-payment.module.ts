import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from '../data';
import { ILoanPaymentFactory } from './interfaces';
import { LoanPaymentFactory } from './loan-payment.factory';
import {
  DisbursementPaymentManager,
  FeePaymentManager,
  FundingPaymentManager,
  RefundPaymentManager,
  RepaymentPaymentManager,
} from './managers';
import { DomainModule } from '@payment/modules/domain';

/**
 * Module for handling loan payment operations
 */
@Module({
  imports: [ConfigModule, DataModule, DomainModule],
  providers: [
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
