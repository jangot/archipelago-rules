import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from '../data/data.module';
import { DomainModule } from '../domain';
import { ITransferExecutionFactory } from './interface';
import {
  CheckbookTransferExecutionProvider,
  FiservTransferExecutionProvider,
  MockTransferExecutionProvider,
  TabapayTransferExecutionProvider,
} from './providers';
import { TransferExecutionFactory } from './transfer-execution.factory';

/**
 * Module for handling transfer execution operations
 */
@Module({
  imports: [ConfigModule, DataModule, DomainModule],
  providers: [
    TransferExecutionFactory,
    { provide: ITransferExecutionFactory, useClass: TransferExecutionFactory },
    MockTransferExecutionProvider,
    CheckbookTransferExecutionProvider,
    FiservTransferExecutionProvider,
    TabapayTransferExecutionProvider,
  ],
  exports: [
    TransferExecutionFactory,
    ITransferExecutionFactory,
  ],
})
export class TransferExecutionModule {}
