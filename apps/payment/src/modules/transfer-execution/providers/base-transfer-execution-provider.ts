import { PaymentAccountProvider, TransferStateCodes } from '@library/entity/enum';
import { TransferErrorDetails, TransferErrorPayload, TransferUpdateDetails, TransferUpdatePayload } from '@library/shared/type/lending';
import { Injectable, Logger } from '@nestjs/common';
import { IDomainServices } from '@payment/modules/domain';
import { ITransferExecutionProvider } from '../interface';

@Injectable()
export abstract class BaseTransferExecutionProvider implements ITransferExecutionProvider {
  protected readonly logger: Logger;
  protected readonly paymentProvider: PaymentAccountProvider;

  constructor(protected readonly domainServices: IDomainServices, protected readonly provider: PaymentAccountProvider) {
    this.logger = new Logger(this.constructor.name);
    this.paymentProvider = provider;
  }
  
  public async initiateTransfer(transferId: string): Promise<boolean | null> {
    this.logger.debug(`Initiating transfer for ${transferId} with provider ${this.paymentProvider}`);
    const executionResult = await this.executeTransfer(transferId);
    if (executionResult === null) {
      this.logger.error(`Transfer execution for ${transferId} returned null, indicating error happened.`);
      return null; // Transfer failed
    } else if (executionResult === false) {
      this.logger.error(`Transfer execution for ${transferId} return falsy result.`);
      return false; // Transfer failed
    }
    this.logger.debug(`Transfer execution for ${transferId} succeeded.`);
    return this.domainServices.paymentServices.updateTransferState(
      transferId,
      TransferStateCodes.Created,
      TransferStateCodes.Pending,
      this.paymentProvider
    ); // Transfer succeeded
  }

  public async completeTransfer(transferId: string): Promise<boolean | null> {
    this.logger.debug(`Completing transfer ${transferId}`);
    return this.domainServices.paymentServices.completeTransfer(transferId, this.paymentProvider);
  }

  public async failTransfer(transferId: string, error: TransferErrorPayload): Promise<boolean | null> {
    this.logger.debug(`Failing transfer ${transferId} with error`, error);
    const parsedError = this.parseTransferError(error);
    return this.domainServices.paymentServices.failTransfer(transferId, parsedError, this.paymentProvider);
  }

  public async applyTransferUpdate(transferId: string, update: TransferUpdateDetails): Promise<boolean | null> {
    this.logger.debug(`Processing transfer update for ${transferId}`, update);
    const { error, updates } = update;

    // Doublecheck that updates do not contain an error
    // Previously it is already checked on service level
    if (error) {
      this.logger.error(`Transfer update for ${transferId} contains error`, error);
      return this.failTransfer(transferId, error);
    }

    return this.domainServices.paymentServices.processTransferUpdate(transferId, updates);
  }

  /**
   * Function to parse the transfer error payload into a structured error details object.
   * This method should be implemented by subclasses to handle specific error parsing logic.
   * @param error Raw error payload from the transfer execution.
   * @returns Parsed error details.
   */
  protected abstract parseTransferError(error: TransferErrorPayload): TransferErrorDetails;

  protected abstract executeTransfer(transferId: string): Promise<boolean | null>;

  /**
   * Function to parse the transfer update payload into a structured update details object.
   * This method should be implemented by subclasses to handle specific update parsing logic.
   * @param update Raw update payload from the transfer execution.
   * @returns Parsed transfer update details.
   */
  abstract parseTransferUpdate(update: TransferUpdatePayload): TransferUpdateDetails | null;
}
