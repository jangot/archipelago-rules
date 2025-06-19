export interface ITransferExecutionProvider {
  /**
     * Executes a transfer based on the provided transfer ID.
     * @param transferId The ID of the transfer to execute.
     * @returns A promise that resolves to a boolean indicating success or failure, or null if the execution failed.
     */
  executeTransfer(transferId: string): Promise<boolean | null>;
}
