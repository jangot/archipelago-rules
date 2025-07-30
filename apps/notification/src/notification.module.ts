import { SharedModule } from '@library/shared';
import { HealthModule } from '@library/shared/common/health/health.module';
import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';

import { EventModule, getEventModuleConfiguration } from '@library/shared/modules/event';
import { NotificationDefinitionItemController } from '@notification/controllers/notification-definition-item.controller';
import { NotificationController } from '@notification/controllers/notification.controller';
import { NOTIFICATION_EVENT_HANDLERS } from '@notification/event-handlers';
import { NotificationModules } from '@notification/index.modules';
import { NOTIFICATION_PROVIDERS } from '@notification/providers';
import { NotificationProviderFactory } from '@notification/providers/notification-provider-factory';
import { EmailMapperService } from '@notification/services/email-mapper.service';
import { NotificationDefinitionItemService } from '@notification/services/notification-definition-item.service';
import { NotificationService } from '@notification/services/notification.service';
import { NotificationHealthController } from '@notification/controllers/notification-health.controller';

/**
 * Main notification module that provides endpoints for notification management
 * and notification definition management
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    HttpModule,
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
  controllers: [NotificationHealthController, NotificationController, NotificationDefinitionItemController],
  providers: [
    NotificationService,
    NotificationDefinitionItemService,
    Logger,
    EmailMapperService,
    ...NOTIFICATION_PROVIDERS,
    NotificationProviderFactory,
    ...NOTIFICATION_EVENT_HANDLERS,
  ],
  exports: [NotificationService, NotificationDefinitionItemService],
})
export class NotificationModule {}
