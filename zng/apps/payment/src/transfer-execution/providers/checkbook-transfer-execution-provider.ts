import { Injectable } from '@nestjs/common';
import { BaseTransferExecutionProvider } from './base-transfer-execution-provider';
import { IDomainServices } from '@payment/domain/idomain.services';

@Injectable()
export class CheckbookTransferExecutionProvider extends BaseTransferExecutionProvider {
  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices);
  }

  public async executeTransfer(transferId: string): Promise<boolean | null> {
    // Simulate a successful transfer execution
    this.logger.debug(`Checkbook transfer executed for ID: ${transferId}`);
    return true; // Indicating success
  }
}
