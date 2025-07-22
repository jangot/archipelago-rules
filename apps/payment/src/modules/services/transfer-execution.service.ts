import { PaymentAccountProvider } from '@library/entity/enum';
import { EventManager } from '@library/shared/common/event/event-manager';
import { TransferCompletedEvent, TransferExecutedEvent, TransferFailedEvent } from '@library/shared/events';
import { TransferErrorPayload } from '@library/shared/type/lending';
import { Injectable, Logger } from '@nestjs/common';
import { ManagementDomainService } from '../domain/services';

/**
 * Service responsible for executing and monitoring transfers for loan payment steps
 */
@Injectable()
export class TransferExecutionService {
  private readonly logger: Logger = new Logger(TransferExecutionService.name);

  constructor(private readonly managementDomainService: ManagementDomainService, private readonly eventManager: EventManager) {}

  /**
   * Executes a transfer by its ID, optionally specifying the provider type.
   * If no provider type is specified, the method will determine the appropriate provider based on the transfer's details.
   * 
   * IMPORTANT: Payment provider implementation should move Transfer to `pending` state on successfull execution.
   * To be more precise - it should move Transfer to `pending` state right when taken it for execution, to prevent double execution.
   * 
   * @param transferId - The unique identifier of the transfer to execute
   * @param providerType - Optional provider type to use for the transfer execution
   * @returns A boolean indicating success (true) or null if the operation failed (e.g., transfer not found, invalid state)
   */
  public async executeTransfer(transferId: string): Promise<boolean | null>;
  public async executeTransfer(transferId: string, providerType: PaymentAccountProvider): Promise<boolean | null>;
  public async executeTransfer(transferId: string, providerType?: PaymentAccountProvider): Promise<boolean | null> {
    this.logger.debug(`Executing transfer ${transferId} ${providerType ? `with provider ${providerType}` : ''}`);
    const executionResult = await this.managementDomainService.executeTransfer(transferId, providerType);

    // Based on how transfer execution goes - we either send certain events or log about execution failure
    if (executionResult === null) {
      // If executionResult is null, it indicates that the transfer was not found or could not be executed
      this.logger.error(`Transfer execution failed for transferId: ${transferId} with provider: ${providerType}`);
    } else if (executionResult === false) {
      // If executionResult is false, it indicates that the transfer was executed but resulted in a negative outcome
      this.logger.debug(`Transfer executed but with negative result for transferId: ${transferId}`);
    } else {
      // If executionResult is true, it indicates that the transfer was successfully executed
      this.logger.debug(`Transfer executed successfully for transferId: ${transferId}`);
      // TODO: Reaction on event execution?
      await this.eventManager.publish<Promise<boolean | null>>(new TransferExecutedEvent(transferId, providerType));
    }
    return executionResult;
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
    const completionResult = await this.managementDomainService.completeTransfer(transferId, providerType);

    // If completionResult is null, it indicates that the transfer was not found or could not be completed
    if (completionResult === null) {
      this.logger.error(`Transfer completion failed for transferId: ${transferId} with provider: ${providerType}`);
    } else if (completionResult === false) {
      // If completionResult is false, it indicates that the transfer was completed but resulted in a negative outcome
      this.logger.debug(`Transfer completed but with negative result for transferId: ${transferId}`);
    } else {
      // If completionResult is true, it indicates that the transfer was successfully completed
      this.logger.debug(`Transfer completed successfully for transferId: ${transferId}`);
      // TODO: Reaction on event execution?
      await this.eventManager.publish<Promise<boolean | null>>(new TransferCompletedEvent(transferId, providerType));
    }
    return completionResult;
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
    this.logger.debug(`Failing transfer ${transferId}`, { error });
    const failingResult = await this.managementDomainService.failTransfer(transferId, error, providerType);

    // If failingResult is null, it indicates that the transfer was not found or could not be failed
    if (failingResult === null) {
      this.logger.error(`Transfer failure failed for transferId: ${transferId} with provider: ${providerType}`, { error });
    } else if (failingResult === false) {
      // If failingResult is false, it indicates that the transfer was failed but resulted in a negative outcome
      this.logger.debug(`Transfer failed but with negative result for transferId: ${transferId}`, { error });
    } else {
      // If failingResult is true, it indicates that the transfer was successfully marked as failed
      this.logger.debug(`Transfer failed successfully for transferId: ${transferId}`, { error });
      await this.eventManager.publish<Promise<boolean | null>>(new TransferFailedEvent(transferId, providerType));
    }

    return failingResult;
  }
}
