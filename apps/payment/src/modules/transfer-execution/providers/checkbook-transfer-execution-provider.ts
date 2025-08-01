import { PaymentAccountProviderCodes } from '@library/entity/enum';
import { TransferErrorDetails, TransferErrorPayload, TransferUpdateDetails, TransferUpdatePayload } from '@library/shared/type/lending';
import { Injectable } from '@nestjs/common';
import { IDomainServices } from '@payment/modules/domain';
import { BaseTransferExecutionProvider } from './base-transfer-execution-provider';

@Injectable()
export class CheckbookTransferExecutionProvider extends BaseTransferExecutionProvider {

  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, PaymentAccountProviderCodes.Checkbook);
  }

  public async executeTransfer(transferId: string): Promise<boolean | null> {
    // Simulate a successful transfer execution
    this.logger.debug(`Checkbook transfer executed for ID: ${transferId}`);
    return true; // Indicating success
  }
  
  public parseTransferUpdate(update: TransferUpdatePayload): TransferUpdateDetails | null {
    throw new Error('Method not implemented.');
  }

  protected parseTransferError(error: TransferErrorPayload): TransferErrorDetails {
    throw new Error('Method not implemented.');
  }

}
