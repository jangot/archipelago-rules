import { Module } from '@nestjs/common';
import { ManagementModule } from '../domain/management.module';
import { LoanPaymentStepService } from './loan-payment-step.service';
import { LoanPaymentService } from './loan-payment.service';
import { PaymentRouteService } from './payment-route.service';
import { TransferExecutionService } from './transfer-execution.service';

/**
 * Module for application services that use ManagementDomainService
 */
@Module({
  imports: [ManagementModule],
  providers: [
    LoanPaymentService,
    LoanPaymentStepService,
    TransferExecutionService,
    PaymentRouteService,
  ],
  exports: [
    LoanPaymentService,
    LoanPaymentStepService,
    TransferExecutionService,
    PaymentRouteService,
  ],
})
export class ServicesModule {}
