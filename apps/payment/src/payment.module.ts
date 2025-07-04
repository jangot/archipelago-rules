import { SharedModule } from '@library/shared';
import { HealthModule } from '@library/shared/common/health/health.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { DomainModule } from './modules/domain/domain.module';
import { ManagementModule } from './modules/domain/management.module';
import { LoanPaymentStepModule } from './modules/loan-payment-steps/loan-payment-step.module';
import { LoanPaymentModule } from './modules/loan-payments/loan-payment.module';
import { ServicesModule } from './modules/services/services.module';
import { TransferExecutionModule } from './modules/transfer-execution/transfer-execution.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

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
