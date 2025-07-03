import { Injectable, Logger } from '@nestjs/common';
import { ITransferExecutionProvider } from '../interface';
import { PaymentDomainService } from '@payment/domain/services';
import { TransferErrorDetails, TransferErrorPayload } from '@library/shared/types/lending';

@Injectable()
export abstract class BaseTransferExecutionProvider implements ITransferExecutionProvider {
  protected readonly logger: Logger;
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    this.logger = new Logger(this.constructor.name);
  }
  
  public abstract executeTransfer(transferId: string): Promise<boolean | null>;

  public async completeTransfer(transferId: string): Promise<boolean | null> {
    this.logger.debug(`Completing transfer ${transferId}`);
    return this.paymentDomainService.completeTransfer(transferId);
  }

  public async failTransfer(transferId: string, error: TransferErrorPayload): Promise<boolean | null> {
    this.logger.debug(`Failing transfer ${transferId} with error`, error);
    const parsedError = this.parseTransferError(error);
    return this.paymentDomainService.failTransfer(transferId, parsedError);
  }

  /**
   * Function to parse the transfer error payload into a structured error details object.
   * This method should be implemented by subclasses to handle specific error parsing logic.
   * @param error Raw error payload from the transfer execution.
   * @returns Parsed error details.
   */
  protected abstract parseTransferError(error: TransferErrorPayload): TransferErrorDetails;
}
