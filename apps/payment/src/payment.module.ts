import { SharedModule } from '@library/shared';
import { HealthModule } from '@library/shared/common/health/health.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventModule, getEventModuleConfiguration } from 'libs/shared/src/modules/event';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { BillersModule } from './modules/billers';
import { DomainModule } from './modules/domain';
import { LoanPaymentStepModule } from './modules/loan-payment-steps';
import { LoanPaymentModule } from './modules/loan-payments';
import { TransferExecutionModule } from './modules/transfer-execution';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PAYMENT_EVENT_HANDLERS } from './shared/event-handlers';

@Module({
  imports: [
    CqrsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GracefulShutdownModule.forRoot(),
    // Bring in Shared stuff like pino Logger properly configured, more to follow
    SharedModule.forRoot([PaymentController]),
    EventModule.forRootAsync({
      isGlobal: true,
      useFactory: getEventModuleConfiguration,
      inject: [ConfigService],
    }),
    HealthModule,
    DomainModule,
    LoanPaymentModule,
    LoanPaymentStepModule,
    TransferExecutionModule,
    BillersModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    Logger,
    // EventHandlers
    ...PAYMENT_EVENT_HANDLERS,
  ],
})
export class PaymentModule {}
