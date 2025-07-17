import { SharedModule } from '@library/shared';
import { HealthModule } from '@library/shared/common/health/health.module';
import { EventModule } from '@library/shared/modules/events/event.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { BillersModule } from './modules/billers';
import { DomainModule, ManagementModule } from './modules/domain';
import { LoanPaymentStepModule } from './modules/loan-payment-steps';
import { LoanPaymentModule } from './modules/loan-payments';
import { ServicesModule } from './modules/services';
import { TransferExecutionModule } from './modules/transfer-execution';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({ 
  imports: [
    CqrsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GracefulShutdownModule.forRoot(),
    // Bring in Shared stuff like pino Logger properly configured, more to follow
    SharedModule.forRoot([PaymentController]),
    EventModule.forRoot('payment', '<url to payment event handler endpoint>'),
    HealthModule,
    DomainModule,
    ManagementModule,
    ServicesModule,
    LoanPaymentModule,
    LoanPaymentStepModule,
    TransferExecutionModule,
    BillersModule,
  ], 
  controllers: [PaymentController], 
  providers: [PaymentService, Logger], 
})
export class PaymentModule {}
