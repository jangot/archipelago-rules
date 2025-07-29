import { SharedDataService } from '@library/shared/common/domainservice/shared.service';
import { BillersRepository } from '@library/shared/modules/billers/billers.repository';
import { Module } from '@nestjs/common';
import { BillersDomainService } from './billers.domain.service';

/**
 * BillersModule is the root module for all biller-related ingestion, transformation, and persistence logic.
 */
@Module({
  controllers: [],
  providers: [BillersDomainService, BillersRepository, SharedDataService ],
  exports: [BillersDomainService, BillersRepository, SharedDataService ],
})
export class BillersModule {} 
