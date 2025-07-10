
export interface IBillerProvider {
  /**
   * Acquires a biller for a specific network type
   * @param billerNetworkType The type of biller network
   * @param filePath The path to the file to be used for the biller
   * @returns Promise<void>
   */
  
  moveFileToLocalBucket(sourcePath: string): Promise<string>;
}
