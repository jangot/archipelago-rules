import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { IDataService } from './idata.service';

@Module({
  controllers: [],
  providers: [{ provide: IDataService, useClass: DataService }],
  exports: [IDataService],
})
export class DataModule {}
