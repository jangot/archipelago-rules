import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { DbConfiguration } from '@library/shared/common/data/dbcommon.config';
import { NotificationDataService } from './data.service';
import { NotificationDefinition } from '../domain/entities/notification.definition.entity';
import { NotificationDefinitionRepository } from '../infrastructure/repositories/notification.definition.repository';
import { INotificationDefinitionRepository } from '../shared/interfaces/repositories/inotification.definition.repository';

/**
 * Data module for the Notification service
 * Provides the database connection and repository services
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => 
        DbConfiguration({ 
          configService, 
          entities: [NotificationDefinition], 
          schema: 'notification', 
        }),
      // TypeORM Transactional DataSource initialization
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('No Datasource options for TypeOrmModule provided');
        }

        return addTransactionalDataSource(new DataSource(options));
      },
    }),
  ],
  providers: [
    NotificationDataService, 
    ...registerCustomRepositoryProviders([NotificationDefinition]),
    {
      provide: INotificationDefinitionRepository,
      useClass: NotificationDefinitionRepository,
    },
  ],
  exports: [NotificationDataService],
})
export class DataModule {}
