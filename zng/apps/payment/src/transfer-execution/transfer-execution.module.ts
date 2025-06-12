import { Module } from '@nestjs/common';
import { TransferExecutionFactory } from './transfer-execution.factory';
import { 
  CheckbookTransferExecutionProvider, 
  FiservTransferExecutionProvider, 
  MockTransferExecutionProvider, 
  TabapayTransferExecutionProvider, 
} from './providers';
import { DataModule } from '../data/data.module';
import { DomainModule } from '../domain/domain.module';

/**
 * Module for handling transfer execution operations
 */
@Module({
  imports: [DataModule, DomainModule],
  providers: [
    TransferExecutionFactory,
    MockTransferExecutionProvider,
    CheckbookTransferExecutionProvider,
    FiservTransferExecutionProvider,
    TabapayTransferExecutionProvider,
  ],
  exports: [
    TransferExecutionFactory,
  ],
})
export class TransferExecutionModule {}
