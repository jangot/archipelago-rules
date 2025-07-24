import { Module } from '@nestjs/common';
import { BillersController } from './billers.controler';
import { BillerProviderFactory } from './billers.factory';
import { BillersService } from './billers.service';
import { FileSourceFactory } from './file-sources/file-source.factory';
import { LocalFileSource } from './file-sources/local-file-source';
import { S3FileSource } from './file-sources/s3-file-source';

/**
 * BillersModule is the root module for all biller-related ingestion, transformation, and persistence logic.
 */
@Module({
  controllers: [BillersController],
  providers: [
    BillersService,
    BillerProviderFactory,
    LocalFileSource,
    S3FileSource,
    FileSourceFactory,
  ],
})
export class BillersModule {} 
