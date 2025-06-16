import { Injectable } from '@nestjs/common';
import { BaseTransferExecutionProvider } from './base-transfer-execution-provider';
import { PaymentDomainService } from '@payment/domain/services';

@Injectable()
export class MockTransferExecutionProvider extends BaseTransferExecutionProvider {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService);
  }

  public async executeTransfer(transferId: string): Promise<boolean | null> {
    // Simulate a successful transfer execution
    this.logger.debug(`Mock transfer executed for ID: ${transferId}`);
    return true; // Indicating success
  }
}
