import { DbSchemaCodes, TypeOrmModuleConfiguration } from '@library/shared/common/data/dbcommon.config';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { AllEntities } from '@library/shared/domain/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationDataService } from '@notification/data/data.service';
import { CustomNotificationRepositories } from '@notification/infrastructure/repositories';
import { SharedDataService } from '@library/shared/common/domainservice/shared.service';
import { SharedRepositories } from '@library/shared/infrastructure/repository';

/**
 * Data module for the Notification service
 * Provides the database connection and repository services
 */
@Module({
  imports: [
    // schema: notifications
    TypeOrmModule.forRootAsync(TypeOrmModuleConfiguration({
      entities: [...AllEntities],
      schema: DbSchemaCodes.Notification,
    })),
  ],
  providers: [
    SharedDataService,
    NotificationDataService,
    ...registerCustomRepositoryProviders(AllEntities), ...CustomNotificationRepositories, ...SharedRepositories,
  ],
  exports: [NotificationDataService, SharedDataService],
})
export class DataModule {}
