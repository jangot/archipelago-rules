import { Injectable } from '@nestjs/common';
import { BaseTransferExecutionProvider } from './base-transfer-execution-provider';
import { PaymentDomainService } from '@payment/domain/services';
import { TransferErrorDetails, TransferErrorPayload } from '@library/shared/type/lending';

@Injectable()
export class FiservTransferExecutionProvider extends BaseTransferExecutionProvider {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService);
  }

  public async executeTransfer(transferId: string): Promise<boolean | null> {
    // Simulate a successful transfer execution
    this.logger.debug(`Fiserv transfer executed for ID: ${transferId}`);
    return true; // Indicating success
  }

  protected parseTransferError(error: TransferErrorPayload): TransferErrorDetails {
    throw new Error('Method not implemented.');
  }
}
