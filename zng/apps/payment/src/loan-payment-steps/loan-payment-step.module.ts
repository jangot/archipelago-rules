import { Module } from '@nestjs/common';
import { LoanPaymentStepFactory } from './loan-payment-step.factory';
import { 
  CreatedStepManager,
  PendingStepManager,
  FailedStepManager,
  CompletedStepManager,
} from './managers';
import { DataModule } from '../data/data.module';
import { DomainModule } from '../domain/domain.module';

/**
 * Module for handling loan payment step operations
 */
@Module({
  imports: [DataModule, DomainModule],
  providers: [
    LoanPaymentStepFactory,
    CreatedStepManager,
    PendingStepManager,
    FailedStepManager,
    CompletedStepManager,
  ],
  exports: [
    LoanPaymentStepFactory,
  ],
})
export class LoanPaymentStepModule {}
