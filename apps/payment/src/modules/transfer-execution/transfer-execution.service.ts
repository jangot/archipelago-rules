import { PaymentAccountProvider } from '@library/entity/enum';
import { TransferErrorPayload, TransferUpdateDetails, TransferUpdatePayload } from '@library/shared/type/lending';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ITransferExecutionFactory } from './interface';

/**
 * Service responsible for executing and monitoring transfers for loan payment steps
 */
@Injectable()
export class TransferExecutionService {
  private readonly logger: Logger = new Logger(TransferExecutionService.name);

  constructor(@Inject(ITransferExecutionFactory) private readonly transferExecutionFactory: ITransferExecutionFactory) {}

  /**
   * Executes a transfer by its ID, optionally specifying the provider type.
   * If no provider type is specified, the method will determine the appropriate provider based on the transfer's details.
   *
   * @param transferId - The unique identifier of the transfer to execute
   * @param providerType - Optional provider type to use for the transfer execution
   * @returns A boolean indicating success (true) or null if the operation failed (e.g., transfer not found, invalid state)
   */
  public async initiateTransfer(transferId: string): Promise<boolean | null>;
  public async initiateTransfer(transferId: string, providerType: PaymentAccountProvider): Promise<boolean | null>;
  public async initiateTransfer(transferId: string, providerType?: PaymentAccountProvider): Promise<boolean | null> {
    this.logger.debug(`Executing transfer ${transferId} with provider ${providerType}`);
    
    const transferExecutionProvider = await this.transferExecutionFactory.getProvider(transferId, providerType);
    return transferExecutionProvider.initiateTransfer(transferId);
  }

  /**
   * Completes a transfer by its ID, marking it as successfully processed.
   * This method updates the transfer status to completed and performs any necessary post-processing operations.
   *
   * @param transferId - The unique identifier of the transfer to complete
   * @param providerType - Optional provider type to use for the transfer completion
   * @returns A boolean indicating success (true) or null if the operation failed (e.g., transfer not found, invalid state)
   */
  public async completeTransfer(transferId: string): Promise<boolean | null>;
  public async completeTransfer(transferId: string, providerType: PaymentAccountProvider): Promise<boolean | null>;
  public async completeTransfer(transferId: string, providerType?: PaymentAccountProvider): Promise<boolean | null> {
    this.logger.debug(`Completing transfer ${transferId}`);

    const transferExecutionProvider = await this.transferExecutionFactory.getProvider(transferId, providerType);
    return transferExecutionProvider.completeTransfer(transferId);
  }

  /**
   * Marks a transfer as failed with the provided error details.
   * This method updates the transfer status to failed and records the error information for troubleshooting and audit purposes.
   *
   * @param transferId - The unique identifier of the transfer to mark as failed
   * @param error - The error payload containing details about the failure
   * @param providerType - Optional provider type to use for the transfer failure handling
   * @returns A boolean indicating success (true) or null if the operation failed (e.g., transfer not found, invalid state)
   */
  public async failTransfer(transferId: string, error: TransferErrorPayload): Promise<boolean | null>;
  public async failTransfer(transferId: string, error: TransferErrorPayload, providerType: PaymentAccountProvider): Promise<boolean | null>;
  public async failTransfer(transferId: string, error: TransferErrorPayload, providerType?: PaymentAccountProvider): Promise<boolean | null> {
    this.logger.debug(`Failing transfer ${transferId}`);

    const transferExecutionProvider = await this.transferExecutionFactory.getProvider(transferId, providerType);
    return transferExecutionProvider.failTransfer(transferId, error);
  }

  public async processTransferUpdates(transferId: string, update: TransferUpdatePayload): Promise<boolean | null>;
  public async processTransferUpdates(
    transferId: string,
    update: TransferUpdatePayload,
    providerType: PaymentAccountProvider
  ): Promise<boolean | null>;

  public async processTransferUpdates(
    transferId: string,
    update: TransferUpdatePayload,
    providerType?: PaymentAccountProvider
  ): Promise<boolean | null> {
    this.logger.debug(`Processing transfer update for ${transferId}`, { update });
    const parsedUpdate = await this.parseTransferUpdate(transferId, update, providerType);
    if (parsedUpdate === null) {
      this.logger.error(`Transfer update parsing failed for transferId: ${transferId} with provider: ${providerType}`, { update });
      return null; // If parsing fails, we cannot proceed with processing
    }

    // If parsedUpdate contains an error, we should handle it accordingly
    const { error } = parsedUpdate;
    if (error) {
      return providerType ? this.failTransfer(transferId, error, providerType) : this.failTransfer(transferId, error);
    }

    const applyResult = await this.applyTransferUpdate(transferId, parsedUpdate, providerType);

    // If applyResult is null, it indicates that the transfer was not found or could not be processed
    if (applyResult === null) {
      this.logger.error(`Transfer update processing failed for transferId: ${transferId} with provider: ${providerType}`, { update });
    } else if (applyResult === false) {
      // If applyResult is false, it indicates that the transfer update was processed but resulted in a negative outcome
      this.logger.debug(`Transfer update processed but with negative result for transferId: ${transferId}`, { update });
    } else {
      // If processResult is true, it indicates that the transfer update was successfully processed
      this.logger.debug(`Transfer update processed successfully for transferId: ${transferId}`, { update });
    }

    return applyResult;
  }

  private async parseTransferUpdate(
    transferId: string,
    update: TransferUpdatePayload,
    providerType?: PaymentAccountProvider
  ): Promise<TransferUpdateDetails | null> {
    this.logger.debug(`Parsing transfer update for ${transferId}`);
    const transferExecutionProvider = await this.transferExecutionFactory.getProvider(transferId, providerType);
    return transferExecutionProvider.parseTransferUpdate(update);
  }

  private async applyTransferUpdate(
    transferId: string,
    update: TransferUpdateDetails,
    providerType?: PaymentAccountProvider
  ): Promise<boolean | null> {
    this.logger.debug(`Processing transfer update for ${transferId}`);
    const transferExecutionProvider = await this.transferExecutionFactory.getProvider(transferId, providerType);
    return transferExecutionProvider.applyTransferUpdate(transferId, update);
  }
}
