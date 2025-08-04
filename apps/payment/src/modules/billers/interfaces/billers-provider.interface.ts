export interface ProcessBillersResult {
  processedCount: number;
  errors?: string[];
}

export interface IBillerProvider {
  /**
   * Processes billers for a specific network type
   * @param resource The resource identifier (file path, S3 key, etc)
   * @param outputBasePath The base path for output files
   * @returns Promise<ProcessBillersResult>
   */
  processBillers(
    resource: string,
    outputBasePath: string
  ): Promise<ProcessBillersResult>;
}
