import { BillerTypeCodes } from '@library/entity/enum';
import { generateCRC32FromStream } from '@library/shared/common/helper/crc32.helpers';
import { IFileStorageProvider } from '@library/shared/common/providers/ifile-storage.provider';
import { BillerAddress } from '@library/shared/domain/entity/biller-address.entity';
import { BillerMask } from '@library/shared/domain/entity/biller-mask.entity';
import { BillerName } from '@library/shared/domain/entity/biller-name.entity';
import { Biller } from '@library/shared/domain/entity/biller.entity';
import { Logger } from '@nestjs/common';
import { RppsFileProcessor } from '@payment/modules/billers/processors';
import { BillerDomainService, BillerWithRelatedEntities } from '@payment/modules/domain/services/biller.domain.service';
import { Readable } from 'stream';
import { ProcessBillersResult } from '../interfaces/billers-provider.interface';
import { RppsBillerSplitter } from '../processors/rpps-biller-splitter';
import { BaseBillerProvider } from './base-biller-provider';

interface BillerJsonData {
  billerName?: string;
  billerType?: string;
  liveDate?: string;
  billerKey?: string;
  billerClass?: string;
  lineOfBusiness?: string;
  territoryCode?: string;
  akas?: Array<{
    akaName?: string;
    akaKey?: string;
    recordEffectiveDate?: string;
  }>;
  masks?: Array<{
    mask?: string;
    maskLength?: string;
    maskKey?: string;
    recordEffectiveDate?: string;
  }>;
  addresses?: Array<{
    addressKey?: string;
    recordEffectiveDate?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    stateProvinceCode?: string;
    countryCode?: string;
    postalCode?: string;
  }>;
}

/**
 * RppsBillerProvider orchestrates the full RPPS biller processing workflow.
 */
export class RppsBillerProvider extends BaseBillerProvider {
  protected readonly logger: Logger = new Logger(RppsBillerProvider.name);

  // Performance and processing constants
  private static readonly DEFAULT_BATCH_SIZE = 10;

  // Security constants
  private static readonly PATH_TRAVERSAL_PATTERNS = ['..', '//'];

  // Validation constants
  private static readonly REQUIRED_BILLER_FIELDS = ['billerName', 'billerType', 'liveDate'];
  private static readonly REQUIRED_NAME_FIELDS = ['akaName', 'akaKey', 'recordEffectiveDate'];
  private static readonly REQUIRED_MASK_FIELDS = ['mask', 'maskLength', 'maskKey', 'recordEffectiveDate'];
  private static readonly REQUIRED_ADDRESS_FIELDS = ['addressKey', 'recordEffectiveDate', 'addressLine1', 'city', 'stateProvinceCode', 'countryCode', 'postalCode'];

  constructor(
    private readonly fileStorage: IFileStorageProvider,
    private readonly rppsFileProcessor: RppsFileProcessor,
    private readonly rppsBillerSplitter: RppsBillerSplitter,
    private readonly billerDatabaseService: BillerDomainService,
  ) {
    super();
  }

  /**
   * Processes billers for the RPPS network.
   * @param resource The resource identifier (file path, S3 key, etc)
   * @param outputBasePath The base path for output files
   * @returns ProcessBillersResult
   */
  public async processBillers(
    resource: string,
    outputBasePath: string
  ): Promise<ProcessBillersResult> {
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    let fileStream: Readable | null = null;
    let jsonFilePath: string | null = null;
    let billerFilesFolder: string | null = null;

    try {
      // Essential security validation - minimal but critical
      if (!resource || typeof resource !== 'string') {
        this.logger.error('Invalid resource parameter');
        return { processedCount: 0, errors: ['Invalid resource parameter'] };
      }

      // Path traversal protection - critical security
      if (RppsBillerProvider.PATH_TRAVERSAL_PATTERNS.some(pattern => resource.includes(pattern))) {
        this.logger.error('Invalid resource path: contains path traversal characters');
        return { processedCount: 0, errors: ['Invalid resource path'] };
      }

      if (!(await this.fileStorage.exists(resource))) {
        this.logger.error(`${resource} does not exist`);
        return { processedCount: processed, errors };
      }
      this.logger.log(`Starting biller processing for resource: ${resource}`);
      
      // Step 1: Read the input file stream
      fileStream = await this.fileStorage.readStream(resource);
      
      // Step 2: Parse TXT to JSON
      jsonFilePath = await this.rppsFileProcessor.parseBillersFile(fileStream, outputBasePath, this.fileStorage);
      this.logger.log(`Successfully parsed TXT to JSON: ${jsonFilePath}`);
      
      // Step 3: Split JSON file into per-biller files
      billerFilesFolder = await this.rppsBillerSplitter.splitJsonFileByBiller(jsonFilePath, outputBasePath, this.fileStorage);
      this.logger.log(`Successfully split JSON into biller files: ${billerFilesFolder}`);
      
      // Step 4: For each biller file, calculate CRC32 and update DB if needed
      const result = await this.processBillerFiles(billerFilesFolder);
      processed = result.processed;
      updated = result.updated;
      skipped = result.skipped;
      errors.push(...result.errors);
      
      this.logger.log(`Biller processing completed successfully. Processed: ${processed}, Updated: ${updated}, Skipped: ${skipped}`);
      return { processedCount: processed, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const fullErrorMessage = `Biller processing failed: ${errorMessage}`;
      errors.push(fullErrorMessage);
      
      this.logger.error('Biller processing failed', {
        resource,
        outputBasePath,
        jsonFilePath,
        billerFilesFolder,
        error: error instanceof Error ? error.stack : error,
      });
      
      return { processedCount: processed, errors };
    } finally {
      // Clean up resources
      if (fileStream) {
        fileStream.destroy();
        this.logger.debug('File stream destroyed');
      }
      
      // Optionally clean up temporary files if processing failed
      if (errors.length > 0) {
        try {
          if (jsonFilePath && await this.fileStorage.exists(jsonFilePath)) {
            // In a production we might want to keep temporary files for debugging. If not needed just remove it.
            // await this.fileStorage.delete(jsonFilePath);
            this.logger.debug(`Temporary JSON file preserved for debugging: ${jsonFilePath}`);
          }
        } catch (cleanupError) {
          this.logger.warn('Failed to cleanup temporary files', { error: cleanupError });
        }
      }
    }
  }

  /**
   * Processes all biller JSON files in the specified folder.
   * @param billerFilesFolder The folder containing individual biller JSON files
   * @returns Processing statistics
   */
  private async processBillerFiles(billerFilesFolder: string): Promise<{ processed: number; updated: number; skipped: number; errors: string[] }> {
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      // Get all JSON files in the biller files folder
      const files = await this.fileStorage.listFiles(billerFilesFolder, '.json');
      this.logger.log(`Found ${files.length} biller files to process`);

      if (files.length === 0) {
        this.logger.warn('No JSON files found in biller files folder');
        return { processed, updated, skipped, errors };
      }

      // Fetch all existing billers with their CRC32 for efficient comparison
      const existingBillerMap = await this.billerDatabaseService.getExistingBillersMap();

      // Process files in batches for better performance
      const batchSize = RppsBillerProvider.DEFAULT_BATCH_SIZE;
      let totalProcessed = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        // Process files with batch size
        const batchPromises = batch.map(async (fileName) => {
          try {
            const fullPath = `${billerFilesFolder}/${fileName}`;
            const externalId = this.extractExternalIdFromFileName(fileName);
            if (!externalId) {
              this.logger.warn(`Could not extract external ID from filename: ${fileName}`);
              return { processed: 0, updated: 0, skipped: 1, errors: [] };
            }

            // Read file as stream for memory-efficient processing
            const fileStream = await this.fileStorage.readStream(fullPath);
            
            // Calculate CRC32 from stream
            const calculatedCrc32 = await generateCRC32FromStream(fileStream);
            
            // Check if biller exists and if CRC32 is different
            const existingBiller = existingBillerMap.get(externalId);
            
            if (existingBiller && existingBiller.crc32 === calculatedCrc32) {
              // CRC32 matches, skip this biller
              return { processed: 0, updated: 0, skipped: 1, errors: [] };
            }

            // Read file content for JSON parsing (needed for biller data)
            const fileContent = await this.fileStorage.read(fullPath);
            const billerData: BillerJsonData = JSON.parse(fileContent);

            // Create or update biller entity
            const billerWithRelatedEntities = this.createBillerWithRelatedEntities(billerData, externalId, calculatedCrc32);
            
            // If validation failed, skip this biller
            if (!billerWithRelatedEntities) {
              return { processed: 0, updated: 0, skipped: 1, errors: [] };
            }
            
            // If biller exists, set the ID for update
            if (existingBiller) {
              billerWithRelatedEntities.biller.id = existingBiller.id;
            }

            return { processed: 1, updated: existingBiller ? 1 : 0, skipped: 0, errors: [], billerWithRelatedEntities };
          } catch (error) {
            const errorMessage = `Failed to process file ${fileName}: ${error instanceof Error ? error.message : String(error)}`;
            this.logger.error(errorMessage, { error });
            return { processed: 0, updated: 0, skipped: 0, errors: [errorMessage] };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        
        // Collect billers to upsert for this batch
        const billersToUpsert: BillerWithRelatedEntities[] = [];
        let batchProcessed = 0;
        let batchUpdated = 0;
        let batchSkipped = 0;
        
        batchResults.forEach(result => {
          if (result.billerWithRelatedEntities) {
            billersToUpsert.push(result.billerWithRelatedEntities);
          }
          batchProcessed += result.processed;
          batchUpdated += result.updated;
          batchSkipped += result.skipped;
          errors.push(...result.errors);
        });

        // Process billers for this batch
        if (billersToUpsert.length > 0) {
          // Use bulk processing for better performance
          const bulkResults = await this.billerDatabaseService.processBillersInBulk(
            billersToUpsert,
            existingBillerMap
          );
          
          // Process results
          bulkResults.forEach(result => {
            if (!result.success) {
              errors.push(result.error || 'Unknown error in bulk processing');
            }
          });
        }

        // Update totals
        totalProcessed += batchProcessed;
        totalUpdated += batchUpdated;
        totalSkipped += batchSkipped;
      }

      // Update final statistics
      processed = totalProcessed;
      updated = totalUpdated;
      skipped = totalSkipped;

    } catch (error) {
      const errorMessage = `Failed to process biller files: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMessage, { error });
      errors.push(errorMessage);
    }

    return { processed, updated, skipped, errors };
  }

  /**
   * Extracts the external ID from the JSON filename.
   * @param filePath The path to the JSON file
   * @returns The external ID or null if not found
   */
  private extractExternalIdFromFileName(filePath: string): string | null {
    const fileName = filePath.split('/').pop() || '';
    const match = fileName.match(/^(.+)\.json$/);
    return match ? match[1] : null;
  }

  /**
   * Creates a Biller entity with all related entities from JSON data.
   * @param billerData The parsed JSON data for the biller
   * @param externalId The external ID of the biller
   * @param crc32 The calculated CRC32 value
   * @returns A populated Biller entity with related entities or null if validation fails
   */
  private createBillerWithRelatedEntities(billerData: BillerJsonData, externalId: string, crc32: number): BillerWithRelatedEntities | null {
    const errors: string[] = [];

    // Validate required Biller fields
    RppsBillerProvider.REQUIRED_BILLER_FIELDS.forEach(field => {
      if (!billerData[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate required fields for BillerName entities (akas) - only if akas array exists and is not empty
    if (billerData.akas && Array.isArray(billerData.akas) && billerData.akas.length > 0) {
      billerData.akas.forEach((akaData: any, index: number) => {
        RppsBillerProvider.REQUIRED_NAME_FIELDS.forEach(field => {
          if (!akaData[field]) {
            errors.push(`Missing required field: akas[${index}].${field}`);
          }
        });
      });
    }

    // Validate required fields for BillerMask entities - only if masks array exists and is not empty
    if (billerData.masks && Array.isArray(billerData.masks) && billerData.masks.length > 0) {
      billerData.masks.forEach((maskData: any, index: number) => {
        RppsBillerProvider.REQUIRED_MASK_FIELDS.forEach(field => {
          if (!maskData[field]) {
            errors.push(`Missing required field: masks[${index}].${field}`);
          }
        });
      });
    }

    // Validate required fields for BillerAddress entities
    if (billerData.addresses && Array.isArray(billerData.addresses)) {
      billerData.addresses.forEach((addressData: any, index: number) => {
        RppsBillerProvider.REQUIRED_ADDRESS_FIELDS.forEach(field => {
          if (!addressData[field]) {
            errors.push(`Missing required field: addresses[${index}].${field}`);
          }
        });
      });
    }

    // If there are validation errors, log them and return null
    if (errors.length > 0) {
      this.logger.error(`Validation failed for biller ${externalId}:`, { errors });
      return null;
    }

    const biller = new Biller();
    
    // Set biller properties (only required fields are validated above)
    biller.name = billerData.billerName!;
    biller.type = BillerTypeCodes.Network;
    biller.externalBillerId = externalId;
    biller.externalBillerKey = billerData.billerKey || externalId;
    biller.liveDate = new Date(billerData.liveDate!);
    biller.billerClass = billerData.billerClass || null;
    biller.billerType = billerData.billerType || null;
    biller.lineOfBusiness = billerData.lineOfBusiness || null;
    biller.territoryCode = billerData.territoryCode || null;
    biller.crc32 = crc32;

    // Create related entities (only if they exist and are valid)
    const billerWithRelatedEntities: BillerWithRelatedEntities = {
      biller,
      names: (billerData.akas || []).map((akaData: any) => {
        const billerName = new BillerName();
        billerName.name = akaData.akaName;
        billerName.externalKey = akaData.akaKey;
        billerName.liveDate = new Date(akaData.recordEffectiveDate);
        return billerName;
      }),
      masks: (billerData.masks || []).map((maskData: any) => {
        const billerMask = new BillerMask();
        billerMask.mask = maskData.mask;
        billerMask.maskLength = parseInt(maskData.maskLength, 10);
        billerMask.externalKey = maskData.maskKey;
        billerMask.liveDate = new Date(maskData.recordEffectiveDate);
        return billerMask;
      }),
      addresses: (billerData.addresses || []).map((addressData: any) => {
        const billerAddress = new BillerAddress();
        billerAddress.externalKey = addressData.addressKey;
        billerAddress.liveDate = new Date(addressData.recordEffectiveDate);
        billerAddress.addressLine1 = addressData.addressLine1;
        billerAddress.addressLine2 = addressData.addressLine2 || '';
        billerAddress.city = addressData.city;
        billerAddress.stateProvinceCode = addressData.stateProvinceCode;
        billerAddress.countryCode = addressData.countryCode;
        billerAddress.postalCode = addressData.postalCode;
        return billerAddress;
      }),
    };

    return billerWithRelatedEntities;
  }
}
