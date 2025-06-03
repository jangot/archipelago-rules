import { Logger, Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { SharedModule } from '@library/shared';
import { HealthModule } from '@library/shared/common/health/health.module';

@Module({ 
  imports: [
    CqrsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GracefulShutdownModule.forRoot(),
    // Bring in Shared stuff like EventBus, pino Logger properly configured, more to follow
    SharedModule.forRoot([PaymentController]),
    HealthModule], 
  controllers: [PaymentController], 
  providers: [PaymentService, Logger], 
})
export class PaymentModule {}
