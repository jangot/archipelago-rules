import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoanPaymentStepFactory } from './loan-payment-step.factory';
import { ILoanPaymentStepFactory } from './interfaces';
import { 
  CreatedStepManager,
  PendingStepManager,
  FailedStepManager,
  CompletedStepManager,
} from './managers';
import { DataModule } from '../data/data.module';
import { PaymentDomainService } from '../domain/services';

/**
 * Module for handling loan payment step operations
 */
@Module({
  imports: [ConfigModule, DataModule],
  providers: [
    PaymentDomainService,
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
