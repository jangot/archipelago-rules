import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { IDataService } from './idata.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configuration, LoanRepository, UserRepository } from './repository/postgresql';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ imports: [ConfigModule], inject:[ConfigService], useFactory: (configService: ConfigService) => configuration(configService)})
  ],
  providers: [
    { provide: IDataService, useClass: DataService },
    UserRepository,
    LoanRepository
  ],
  exports: [IDataService],
})
export class DataModule {}
