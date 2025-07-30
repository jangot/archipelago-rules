import { LocalFileStorageProvider } from '@library/shared/common/providers/local-file-storage.provider';
import { BillerAddress } from '@library/shared/domain/entity/biller-address.entity';
import { BillerMask } from '@library/shared/domain/entity/biller-mask.entity';
import { BillerName } from '@library/shared/domain/entity/biller-name.entity';
import { Biller } from '@library/shared/domain/entity/biller.entity';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RppsFileProcessor } from '@payment/modules/billers/processors';
import { DomainModule } from '@payment/modules/domain/domain.module';
import { BillersController } from './billers.controler';
import { BillerProviderFactory } from './billers.factory';
import { BillersService } from './billers.service';
import { FileStorageFactory } from './factories/file-storage.factory';
import { RppsBillerSplitter } from './processors/rpps-biller-splitter';
import { BillerAddressRepository } from './repositories/biller-address.repository';
import { BillerMaskRepository } from './repositories/biller-mask.repository';
import { BillerNameRepository } from './repositories/biller-name.repository';
import { BillerRepository } from './repositories/biller.repository';

/**
 * BillersModule is the root module for all biller-related ingestion, transformation, and persistence logic.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Biller, BillerName, BillerMask, BillerAddress]),
    forwardRef(() => DomainModule),
  ],
  controllers: [BillersController],
  providers: [
    BillersService,
    BillerProviderFactory,
    FileStorageFactory,
    RppsFileProcessor,
    RppsBillerSplitter,
    BillerRepository,
    BillerNameRepository,
    BillerMaskRepository,
    BillerAddressRepository,
    LocalFileStorageProvider,
  ],
  exports: [BillerProviderFactory, BillerRepository],
})
export class BillersModule {} 
