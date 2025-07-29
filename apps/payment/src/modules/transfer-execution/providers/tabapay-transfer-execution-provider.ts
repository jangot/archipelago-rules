import { TransferErrorDetails, TransferErrorPayload, TransferUpdateDetails, TransferUpdatePayload } from '@library/shared/type/lending';
import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { BaseTransferExecutionProvider } from './base-transfer-execution-provider';

@Injectable()
export class TabapayTransferExecutionProvider extends BaseTransferExecutionProvider {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService);
  }

  public async executeTransfer(transferId: string): Promise<boolean | null> {
    // Simulate a successful transfer execution
    this.logger.debug(`Tabapay transfer executed for ID: ${transferId}`);
    return true; // Indicating success
  }

  public parseTransferUpdate(update: TransferUpdatePayload): TransferUpdateDetails | null {
    throw new Error('Method not implemented.');
  }

  protected parseTransferError(error: TransferErrorPayload): TransferErrorDetails {
    throw new Error('Method not implemented.');
  }
}
