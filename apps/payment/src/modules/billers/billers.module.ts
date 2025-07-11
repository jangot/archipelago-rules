import { Module } from '@nestjs/common';
import { BillersController } from './billers.controler';
import { BillerProviderFactory } from './billers.factory';
import { BillersService } from './billers.service';

/**
 * BillersModule is the root module for all biller-related ingestion, transformation, and persistence logic.
 */
@Module({
  controllers: [BillersController],
  providers: [BillersService, BillerProviderFactory],
})
export class BillersModule {} 
