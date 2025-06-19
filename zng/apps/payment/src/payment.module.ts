import { Logger, Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { SharedModule } from '@library/shared';
import { HealthModule } from '@library/shared/common/health/health.module';
import { DomainModule } from './domain/domain.module';
import { ManagementModule } from './domain/management.module';
import { ServicesModule } from './services/services.module';
import { LoanPaymentModule } from './loan-payments/loan-payment.module';
import { LoanPaymentStepModule } from './loan-payment-steps/loan-payment-step.module';
import { TransferExecutionModule } from './transfer-execution/transfer-execution.module';

@Module({ 
  imports: [
    CqrsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GracefulShutdownModule.forRoot(),
    // Bring in Shared stuff like EventBus, pino Logger properly configured, more to follow
    SharedModule.forRoot([PaymentController]),
    HealthModule,
    DomainModule,
    ManagementModule,
    ServicesModule,
    LoanPaymentModule,
    LoanPaymentStepModule,
    TransferExecutionModule,
  ], 
  controllers: [PaymentController], 
  providers: [PaymentService, Logger], 
})
export class PaymentModule {}
