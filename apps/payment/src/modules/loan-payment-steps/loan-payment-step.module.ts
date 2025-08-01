import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from '../data/data.module';
import { DomainModule } from '../domain';
import { ILoanPaymentStepFactory } from './interfaces';
import { LoanPaymentStepFactory } from './loan-payment-step.factory';
import {
  CompletedStepManager,
  CreatedStepManager,
  FailedStepManager,
  PendingStepManager,
} from './managers';

/**
 * Module for handling loan payment step operations
 */
@Module({
  imports: [ConfigModule, DataModule, DomainModule],
  providers: [
    LoanPaymentStepFactory,
    { provide: ILoanPaymentStepFactory, useClass: LoanPaymentStepFactory },
    CreatedStepManager,
    PendingStepManager,
    FailedStepManager,
    CompletedStepManager,
  ],
  exports: [
    LoanPaymentStepFactory,
    ILoanPaymentStepFactory,
  ],
})
export class LoanPaymentStepModule {}
