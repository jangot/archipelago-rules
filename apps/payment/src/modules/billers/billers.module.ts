import { LocalFileStorageProvider } from '@library/shared/common/providers/local-file-storage.provider';
import { BillersDomainService } from '@library/shared/domain/service/billers.domain.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RppsFileProcessor } from '@payment/modules/billers/processors';
import { DataModule } from '../data/data.module';
import { BillersController } from './billers.controller';
import { BillerProviderFactory } from './billers.factory';
import { BillersService } from './billers.service';
import { FileStorageFactory } from './factories/file-storage.factory';
import { RppsBillerSplitter } from './processors/rpps-biller-splitter';

/**
 * BillersModule is the root module for all biller-related ingestion, transformation, and persistence logic.
 */
@Module({
  imports: [ConfigModule, DataModule],
  controllers: [BillersController],
  providers: [
    BillersDomainService,
    BillersService,
    BillerProviderFactory,
    FileStorageFactory,
    RppsFileProcessor,
    RppsBillerSplitter,
    LocalFileStorageProvider,
  ],
  exports: [BillerProviderFactory],
})
export class BillersModule {} 
