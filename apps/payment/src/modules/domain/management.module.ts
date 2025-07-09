import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ManagementDomainService } from './services';
import { LoanPaymentModule } from '../loan-payments/loan-payment.module';
import { LoanPaymentStepModule } from '../loan-payment-steps/loan-payment-step.module';
import { TransferExecutionModule } from '../transfer-execution/transfer-execution.module';

/**
 * Module for management domain services that depend on factory modules
 * This module is separate from DomainModule to avoid circular dependencies
 */
@Module({
  imports: [
    ConfigModule,
    LoanPaymentModule,
    LoanPaymentStepModule,
    TransferExecutionModule,
  ],
  providers: [ManagementDomainService],
  exports: [ManagementDomainService],
})
export class ManagementModule {}
