import { SharedModule } from '@library/shared';
import { HealthModule } from '@library/shared/common/health/health.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventModule, getEventModuleConfiguration } from 'libs/shared/src/modules/event';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { NOTIFICATION_EVENT_HANDLERS } from './event-handlers';
import { NotificationModules } from './index.modules';
import { NotificationDefinitionItemController } from './controllers/notification-definition-item.controller';
import { NotificationDefinitionItemService } from './services/notification-definition-item.service';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';

/**
 * Main notification module that provides endpoints for notification management
 * and notification definition management
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventModule.forRootAsync({
      isGlobal: true,
      useFactory: getEventModuleConfiguration,
      inject: [ConfigService],
    }),
    GracefulShutdownModule.forRoot(),
    SharedModule.forRoot([NotificationController, NotificationDefinitionItemController]),
    HealthModule,
    ...NotificationModules,
  ],
  controllers: [NotificationController, NotificationDefinitionItemController],
  providers: [
    NotificationService,
    NotificationDefinitionItemService,
    Logger,
    ...NOTIFICATION_EVENT_HANDLERS,
  ],
  exports: [NotificationService, NotificationDefinitionItemService],
})
export class NotificationModule {}
