import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { IDataService } from './idata.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configuration } from './repository/postgresql';

@Module({
  imports: [TypeOrmModule.forRootAsync({useFactory: () => (configuration)})],
  providers: [{ provide: IDataService, useClass: DataService }],
  exports: [IDataService],
})
export class DataModule {}
