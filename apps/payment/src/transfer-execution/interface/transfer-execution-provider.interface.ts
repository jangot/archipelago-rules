import { TransferErrorPayload } from '@library/shared/type/lending';

export interface ITransferExecutionProvider {
  /**
     * Executes a transfer based on the provided transfer ID.
     * @param transferId The ID of the transfer to execute.
     * @returns A promise that resolves to a boolean indicating success or failure, or null if the execution failed.
     */
  executeTransfer(transferId: string): Promise<boolean | null>;
  
  /**
   * Completes a transfer based on the provided transfer ID.
   * @param transferId The ID of the transfer to complete.
   * @returns A promise that resolves to a boolean indicating success or failure, or null if the completion failed.
   */
  completeTransfer(transferId: string): Promise<boolean | null>;
  
  /**
   * Fails a transfer based on the provided transfer ID and error payload.
   * @param transferId The ID of the transfer to fail.
   * @param error The error payload containing details about the failure.
   * @returns A promise that resolves to a boolean indicating success or failure, or null if the operation failed.
   */
  failTransfer(transferId: string, error: TransferErrorPayload): Promise<boolean | null>;
}
