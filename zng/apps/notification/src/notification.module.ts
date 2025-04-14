import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationDefinitionService } from './domain/services/notification.definition.service';
import { NotificationDefinition } from './domain/entities/notification.definition.entity';
import { NotificationDefinitionRepository } from './infrastructure/repositories/notification.definition.repository';
import { INotificationDefinitionRepository } from './shared/interfaces/repositories/inotification.definition.repository';

/**
 * Main notification module that provides endpoints for notification management
 * and notification definition management
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationDefinition]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationDefinitionService,
    {
      provide: INotificationDefinitionRepository,
      useClass: NotificationDefinitionRepository,
    },
  ],
  exports: [NotificationDefinitionService],
})
export class NotificationModule {}
