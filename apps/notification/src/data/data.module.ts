import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { DbSchemaCodes, TypeOrmModuleConfiguration } from '@library/shared/common/data/dbcommon.config';
import { NotificationDataService } from './data.service';
import { NotificationDefinition } from '../domain/entities/notification.definition.entity';
import { NotificationEntities } from '../domain/entities';
import { CustomNotificationRepositories } from '../infrastructure/repositories';

/**
 * Data module for the Notification service
 * Provides the database connection and repository services
 */
@Module({
  imports: [
    // schema: notifications
    TypeOrmModule.forRootAsync(TypeOrmModuleConfiguration({ entities: [NotificationDefinition], schema: DbSchemaCodes.Notification })),

  ],
  providers: [
    NotificationDataService, 
    ...registerCustomRepositoryProviders(NotificationEntities), ...CustomNotificationRepositories,
  ],
  exports: [NotificationDataService],
})
export class DataModule {}
