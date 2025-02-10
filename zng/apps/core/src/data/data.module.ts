import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { IDataService } from './idata.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomCoreRepositories } from './repository/postgresql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { CoreEntities } from './entity';
import { DbConfiguration } from '@library/shared/common/data/dbcommon.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ 
      imports: [ConfigModule], 
      inject:[ConfigService], 
      useFactory: (configService: ConfigService) => DbConfiguration({ configService, entities: CoreEntities, schema: 'core' }),
      // TypeORM Transactional DataSource initialization
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('No Datasource options for TypeOrmModule provided');
        }

        return addTransactionalDataSource(new DataSource(options))
      }})
  ],
  providers: [
    { provide: IDataService, useClass: DataService },
    ...registerCustomRepositoryProviders(CoreEntities),
    ...CustomCoreRepositories
  ],
  exports: [IDataService],
})

export class DataModule {}
