import { Module } from '@nestjs/common';
import { CoreDataService } from './data.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { DbConfiguration } from '@library/shared/common/data/dbcommon.config';
import { CoreEntities } from '../domain/entities';
import { CustomCoreRepositories } from '../infrastructure/repositories';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => DbConfiguration({ configService, entities: CoreEntities, schema: 'core' }),
      // TypeORM Transactional DataSource initialization
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('No Datasource options for TypeOrmModule provided');
        }

        return addTransactionalDataSource(new DataSource(options));
      },
    }),
  ],
  providers: [CoreDataService, ...registerCustomRepositoryProviders(CoreEntities), ...CustomCoreRepositories],
  exports: [CoreDataService],
})
export class DataModule {}
