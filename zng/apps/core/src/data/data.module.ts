import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { IDataService } from './idata.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configuration, LoanRepository, UserRepository } from './repository/postgresql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { repositoryProviders } from './repository/repository.providers';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ 
      imports: [ConfigModule], 
      inject:[ConfigService], 
      useFactory: (configService: ConfigService) => configuration(configService),
      // TypeORM Transactional DataSource initiation 
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('No options provided');
        }
        return addTransactionalDataSource(new DataSource(options))
      }})
  ],
  providers: [
    { provide: IDataService, useClass: DataService },
    ...repositoryProviders,
    UserRepository,
    LoanRepository
  ],
  exports: [IDataService],
})
export class DataModule {
  constructor(private dataSource: DataSource) {}
}
