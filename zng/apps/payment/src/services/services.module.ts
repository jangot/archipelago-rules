import { Module } from '@nestjs/common';
import { ManagementModule } from '@payment/domain/management.module';
import { LoanPaymentService } from './loan-payment.service';
import { LoanPaymentStepService } from './loan-payment-step.service';
import { TransferExecutionService } from './transfer-execution.service';
import { PaymentRouteService } from './payment-route.service';

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
