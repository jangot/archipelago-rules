import { LocalFileStorageProvider } from '@library/shared/common/providers/local-file-storage.provider';
import { Biller } from '@library/shared/domain/entity/biller.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillersController } from './billers.controler';
import { BillerProviderFactory } from './billers.factory';
import { BillersService } from './billers.service';
import { FileStorageFactory } from './factories/file-storage.factory';
import { RppsBillerSplitter } from './processors/rpps-biller-splitter';
import { RppsFileProcessor } from '@payment/modules/billers/processors';
import { BillerRepository } from './repositories/biller.repository';

/**
 * BillersModule is the root module for all biller-related ingestion, transformation, and persistence logic.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Biller]),
  ],
  controllers: [BillersController],
  providers: [
    BillersService,
    BillerProviderFactory,
    FileStorageFactory,
    RppsFileProcessor,
    RppsBillerSplitter,
    BillerRepository,
    LocalFileStorageProvider,
  ],
})
export class BillersModule {} 
