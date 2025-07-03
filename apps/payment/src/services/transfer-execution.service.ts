import { PaymentAccountProvider } from '@library/entity/enum';
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

  // TODO
  public async completeTransfer(transferId: string): Promise<boolean | null> {
    this.logger.debug(`Completing transfer ${transferId}`);
    return null; // Placeholder for actual implementation
  }

  // TODO
  public async failTransfer(transferId: string): Promise<boolean | null> {
    this.logger.debug(`Failing transfer ${transferId}`);
    return null; // Placeholder for actual implementation
  }

}
