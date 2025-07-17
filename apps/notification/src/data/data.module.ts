import { DbSchemaCodes, TypeOrmModuleConfiguration } from '@library/shared/common/data/dbcommon.config';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationDefinition } from '../domain/entity/notification.definition.entity';
import { CustomNotificationRepositories } from '../infrastructure/repositories';
import { NotificationDataService } from './data.service';

export const NotificationEntities = [
  NotificationDefinition,
];

/**
 * Data module for the Notification service
 * Provides the database connection and repository services
 */
@Module({
  imports: [
    // schema: notifications
    TypeOrmModule.forRootAsync(TypeOrmModuleConfiguration({
      entities: [...NotificationEntities],
      schema: DbSchemaCodes.Notification,
    })),

  ],
  providers: [
    NotificationDataService, 
    ...registerCustomRepositoryProviders(NotificationEntities), ...CustomNotificationRepositories,
  ],
  exports: [NotificationDataService],
})
export class DataModule {}
