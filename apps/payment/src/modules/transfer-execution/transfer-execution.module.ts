import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransferExecutionFactory } from './transfer-execution.factory';
import { ITransferExecutionFactory } from './interface';
import { 
  CheckbookTransferExecutionProvider, 
  FiservTransferExecutionProvider, 
  MockTransferExecutionProvider, 
  TabapayTransferExecutionProvider, 
} from './providers';
import { DataModule } from '../data/data.module';
import { PaymentDomainService } from '../domain/services';

/**
 * Module for handling transfer execution operations
 */
@Module({
  imports: [ConfigModule, DataModule],
  providers: [
    PaymentDomainService,
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
