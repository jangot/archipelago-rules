import { PaymentAccountProvider } from '@library/entity/enum';
import { TransferErrorPayload } from '@library/shared/type/lending';
import { Injectable, Logger } from '@nestjs/common';
import { ManagementDomainService } from '@payment/domain/services';

/**
 * Service responsible for executing and monitoring transfers for loan payment steps
 */
@Injectable()
export class TransferExecutionService {
  private readonly logger: Logger = new Logger(TransferExecutionService.name);

  constructor(private readonly managementDomainService: ManagementDomainService) {}

  /**
   * Executes a transfer by its ID, optionally specifying the provider type.
   * If no provider type is specified, the method will determine the appropriate provider based on the transfer's details.
   * 
   * @param transferId - The unique identifier of the transfer to execute
   * @param providerType - Optional provider type to use for the transfer execution
   * @returns A boolean indicating success (true) or null if the operation failed (e.g., transfer not found, invalid state)
   */
  public async executeTransfer(transferId: string): Promise<boolean | null>;
  public async executeTransfer(transferId: string, providerType: PaymentAccountProvider): Promise<boolean | null>;
  public async executeTransfer(transferId: string, providerType?: PaymentAccountProvider): Promise<boolean | null> {
    this.logger.debug(`Executing transfer ${transferId} ${providerType ? `with provider ${providerType}` : ''}`);
    return this.managementDomainService.executeTransfer(transferId, providerType);
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
    return this.managementDomainService.completeTransfer(transferId, providerType);
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
    return this.managementDomainService.failTransfer(transferId, error, providerType);
  }

}
