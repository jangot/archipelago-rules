import { Module } from '@nestjs/common';
import { BillersController } from './billers.controler';
import { BillersFactory } from './billers.factory';
import { RppsFileProcessor } from './processors/rpps-file.processor';
import { RppsBillerProvider } from './providers/rpps-biller-provider';

/**
 * BillersModule is the root module for all biller-related ingestion, transformation, and persistence logic.
 */
@Module({
  imports: [],
  controllers: [BillersController],
  providers: [BillersFactory, RppsBillerProvider, RppsFileProcessor],
  exports: [],
})
export class BillersModule {} 
