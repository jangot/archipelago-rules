import { SharedModule } from '@library/shared';
import { HealthModule } from '@library/shared/common/health/health.module';
import { EventsModule, getModuleConfiguration } from 'libs/shared/src/modules/events';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { NotificationModules } from './index.modules';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

/**
 * Main notification module that provides endpoints for notification management
 * and notification definition management
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // EventModule.forRoot('notification', '<url to notification event handler endpoint>'),
    EventsModule.forRootAsync({
      isGlobal: true,
      useFactory: getModuleConfiguration,
      inject: [ConfigService],
    }),
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
