import { Logger, Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { ConfigModule } from '@nestjs/config';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { SharedModule } from '@library/shared';
import { HealthModule } from '@library/shared/common/health/health.module';
import { NotificationModules } from './index.modules';

/**
 * Main notification module that provides endpoints for notification management
 * and notification definition management
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GracefulShutdownModule.forRoot(),
    SharedModule.forRoot([NotificationController]),
    HealthModule,
    ...NotificationModules,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    Logger,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
