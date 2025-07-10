import { Module } from '@nestjs/common';
import { BillersController } from './billers.controler';
import { BillerProviderFactory } from './billers.factory';

/**
 * BillersModule is the root module for all biller-related ingestion, transformation, and persistence logic.
 */
@Module({
  imports: [],
  controllers: [BillersController],
  providers: [BillerProviderFactory],
  exports: [],
})
export class BillersModule {} 
