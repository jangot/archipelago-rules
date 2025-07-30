import { BillerTypeCodes } from '@library/entity/enum';
import { generateCRC32 } from '@library/shared/common/helper/crc32.helpers';
import { IFileStorageProvider } from '@library/shared/common/providers/ifile-storage.provider';
import { BillerAddress } from '@library/shared/domain/entity/biller-address.entity';
import { BillerMask } from '@library/shared/domain/entity/biller-mask.entity';
import { BillerName } from '@library/shared/domain/entity/biller-name.entity';
import { Biller } from '@library/shared/domain/entity/biller.entity';
import { Logger } from '@nestjs/common';
import { RppsFileProcessor } from '@payment/modules/billers/processors';
import { Readable } from 'stream';
import { ProcessBillersResult } from '../interfaces/billers-provider.interface';
import { RppsBillerSplitter } from '../processors/rpps-biller-splitter';
import { BillerAddressRepository } from '../repositories/biller-address.repository';
import { BillerMaskRepository } from '../repositories/biller-mask.repository';
import { BillerNameRepository } from '../repositories/biller-name.repository';
import { BillerRepository } from '../repositories/biller.repository';
import { BaseBillerProvider } from './base-biller-provider';

/**
 * RppsBillerProvider orchestrates the full RPPS biller processing workflow.
 */
export class RppsBillerProvider extends BaseBillerProvider {
  protected readonly logger: Logger = new Logger(RppsBillerProvider.name);

  constructor(
    private readonly fileStorage: IFileStorageProvider,
    private readonly rppsFileProcessor: RppsFileProcessor,
    private readonly rppsBillerSplitter: RppsBillerSplitter,
    private readonly billerRepository: BillerRepository,
    private readonly billerNameRepository: BillerNameRepository,
    private readonly billerMaskRepository: BillerMaskRepository,
    private readonly billerAddressRepository: BillerAddressRepository,
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
      if (resource.includes('..') || resource.includes('//')) {
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
      const existingBillers = await this.billerRepository.getAll();
      const existingBillerMap = new Map<string, { id: string; crc32: number }>();
      
      existingBillers.forEach(biller => {
        if (biller.externalBillerId) {
          existingBillerMap.set(biller.externalBillerId, { id: biller.id, crc32: biller.crc32 });
        }
      });

      this.logger.log(`Loaded ${existingBillerMap.size} existing billers from database`);

      // Process files in batches for better performance
      const batchSize = 10; // Default batch size
      let totalProcessed = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        // Check if any files in this batch are large (> 1MB)
        const batchFileSizes = await Promise.all(
          batch.map(async (fileName) => {
            try {
              const fullPath = `${billerFilesFolder}/${fileName}`;
              const fileContent = await this.fileStorage.read(fullPath);
              return { fileName, fullPath, size: fileContent.length };
            } catch (error) {
              this.logger.warn(`Could not read file size for ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
              return { fileName, fullPath: `${billerFilesFolder}/${fileName}`, size: 0 };
            }
          })
        );

        // Adjust batch size based on file sizes
        const hasLargeFiles = batchFileSizes.some(file => file.size > 1000000); // 1MB threshold
        const adjustedBatchSize = hasLargeFiles ? 3 : batchSize; // Reduce to 3 for large files
        
        if (hasLargeFiles) {
          // Removed verbose logging for 25k dataset
        }

        // Process files with adjusted batch size
        const batchPromises = batch.map(async (fileName) => {
          try {
            const fullPath = `${billerFilesFolder}/${fileName}`;
            const externalId = this.extractExternalIdFromFileName(fileName);
            if (!externalId) {
              this.logger.warn(`Could not extract external ID from filename: ${fileName}`);
              return { processed: 0, updated: 0, skipped: 1, errors: [] };
            }

            // Read and parse the JSON file
            const fileContent = await this.fileStorage.read(fullPath);
            const billerData = JSON.parse(fileContent);
            
            // Calculate CRC32 of the JSON content
            const calculatedCrc32 = generateCRC32(fileContent);
            
            // Check if biller exists and if CRC32 is different
            const existingBiller = existingBillerMap.get(externalId);
            
            if (existingBiller && existingBiller.crc32 === calculatedCrc32) {
              // CRC32 matches, skip this biller
              return { processed: 0, updated: 0, skipped: 1, errors: [] };
            }

            // Create or update biller entity
            const biller = this.createBillerEntity(billerData, externalId, calculatedCrc32);
            
            // If validation failed, skip this biller
            if (!biller) {
              return { processed: 0, updated: 0, skipped: 1, errors: [] };
            }
            
            // If biller exists, set the ID for update
            if (existingBiller) {
              biller.id = existingBiller.id;
            }

            return { processed: 1, updated: existingBiller ? 1 : 0, skipped: 0, errors: [], biller };
          } catch (error) {
            const errorMessage = `Failed to process file ${fileName}: ${error instanceof Error ? error.message : String(error)}`;
            this.logger.error(errorMessage, { error });
            return { processed: 0, updated: 0, skipped: 0, errors: [errorMessage] };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        
        // Collect billers to upsert for this batch
        const billersToUpsert: Biller[] = [];
        let batchProcessed = 0;
        let batchUpdated = 0;
        let batchSkipped = 0;
        
        batchResults.forEach(result => {
          if (result.biller) {
            billersToUpsert.push(result.biller);
          }
          batchProcessed += result.processed;
          batchUpdated += result.updated;
          batchSkipped += result.skipped;
          errors.push(...result.errors);
        });

        // Process billers for this batch
        if (billersToUpsert.length > 0) {
          // Process each biller with proper cascade handling
          for (const biller of billersToUpsert) {
            try {
              // Check if biller exists to determine whether to create or update
              const existingBiller = existingBillerMap.get(biller.externalBillerId || '');
              
              let savedBiller: Biller;
              
              if (existingBiller) {
                // Update existing biller - save biller first, then related entities
                const updatedBiller = await this.billerRepository.updateWithResult(existingBiller.id, {
                  name: biller.name,
                  type: biller.type,
                  externalBillerKey: biller.externalBillerKey,
                  liveDate: biller.liveDate,
                  billerClass: biller.billerClass,
                  billerType: biller.billerType,
                  lineOfBusiness: biller.lineOfBusiness,
                  territoryCode: biller.territoryCode,
                  crc32: biller.crc32,
                });
                
                if (!updatedBiller) {
                  throw new Error(`Failed to update biller ${biller.externalBillerId}`);
                }
                
                savedBiller = updatedBiller;
              } else {
                // Create new biller - save biller first, then related entities
                const newBiller = new Biller();
                newBiller.name = biller.name;
                newBiller.type = biller.type;
                newBiller.externalBillerId = biller.externalBillerId;
                newBiller.externalBillerKey = biller.externalBillerKey;
                newBiller.liveDate = biller.liveDate;
                newBiller.billerClass = biller.billerClass;
                newBiller.billerType = biller.billerType;
                newBiller.lineOfBusiness = biller.lineOfBusiness;
                newBiller.territoryCode = biller.territoryCode;
                newBiller.crc32 = biller.crc32;
                
                const insertResult = await this.billerRepository.insert(newBiller, true);
                if (!insertResult) {
                  throw new Error(`Failed to insert biller ${biller.externalBillerId}`);
                }
                savedBiller = insertResult;
              }
              
              // Save related entities with the correct biller_id
              if (biller.names && biller.names.length > 0) {
                biller.names.forEach(name => {
                  name.billerId = savedBiller.id;
                });
                for (const name of biller.names) {
                  await this.billerNameRepository.create(name);
                }
              }
              
              if (biller.masks && biller.masks.length > 0) {
                biller.masks.forEach(mask => {
                  mask.billerId = savedBiller.id;
                });
                for (const mask of biller.masks) {
                  await this.billerMaskRepository.create(mask);
                }
              }
              
              if (biller.addresses && biller.addresses.length > 0) {
                biller.addresses.forEach(address => {
                  address.billerId = savedBiller.id;
                });
                for (const address of biller.addresses) {
                  await this.billerAddressRepository.create(address);
                }
              }
            } catch (error) {
              const errorMessage = `Failed to process biller ${biller.externalBillerId}: ${error instanceof Error ? error.message : String(error)}`;
              this.logger.error(errorMessage, { 
                error, 
                billerId: biller.externalBillerId,
              });
              errors.push(errorMessage);
            }
          }
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
  private createBillerEntity(billerData: any, externalId: string, crc32: number): Biller | null {
    const errors: string[] = [];

    // Validate required Biller fields
    if (!billerData.billerName) {
      errors.push('Missing required field: billerName');
    }
    if (!billerData.billerType) {
      errors.push('Missing required field: billerType');
    }
    if (!billerData.liveDate) {
      errors.push('Missing required field: liveDate');
    }

    // Validate required fields for BillerName entities (akas) - only if akas array exists and is not empty
    if (billerData.akas && Array.isArray(billerData.akas) && billerData.akas.length > 0) {
      billerData.akas.forEach((akaData: any, index: number) => {
        if (!akaData.akaName) {
          errors.push(`Missing required field: akas[${index}].akaName`);
        }
        if (!akaData.akaKey) {
          errors.push(`Missing required field: akas[${index}].akaKey`);
        }
        if (!akaData.recordEffectiveDate) {
          errors.push(`Missing required field: akas[${index}].recordEffectiveDate`);
        }
      });
    }

    // Validate required fields for BillerMask entities - only if masks array exists and is not empty
    if (billerData.masks && Array.isArray(billerData.masks) && billerData.masks.length > 0) {
      billerData.masks.forEach((maskData: any, index: number) => {
        if (!maskData.mask) {
          errors.push(`Missing required field: masks[${index}].mask`);
        }
        if (!maskData.maskLength) {
          errors.push(`Missing required field: masks[${index}].maskLength`);
        }
        // Note: We don't validate maskLength range here - let the safe parsing handle it
        if (!maskData.maskKey) {
          errors.push(`Missing required field: masks[${index}].maskKey`);
        }
        if (!maskData.recordEffectiveDate) {
          errors.push(`Missing required field: masks[${index}].recordEffectiveDate`);
        }
      });
    }

    // Validate required fields for BillerAddress entities
    if (billerData.addresses && Array.isArray(billerData.addresses)) {
      billerData.addresses.forEach((addressData: any, index: number) => {
        if (!addressData.addressKey) {
          errors.push(`Missing required field: addresses[${index}].addressKey`);
        }
        if (!addressData.recordEffectiveDate) {
          errors.push(`Missing required field: addresses[${index}].recordEffectiveDate`);
        }
        if (!addressData.addressLine1) {
          errors.push(`Missing required field: addresses[${index}].addressLine1`);
        }
        if (!addressData.city) {
          errors.push(`Missing required field: addresses[${index}].city`);
        }
        if (!addressData.stateProvinceCode) {
          errors.push(`Missing required field: addresses[${index}].stateProvinceCode`);
        }
        if (!addressData.countryCode) {
          errors.push(`Missing required field: addresses[${index}].countryCode`);
        }
        if (!addressData.postalCode) {
          errors.push(`Missing required field: addresses[${index}].postalCode`);
        }
      });
    }

    // If there are validation errors, log them and return null
    if (errors.length > 0) {
      this.logger.error(`Validation failed for biller ${externalId}:`, { errors });
      return null;
    }

    const biller = new Biller();
    
    // Set biller properties (only required fields are validated above)
    biller.name = billerData.billerName;
    biller.type = BillerTypeCodes.Network;
    biller.externalBillerId = externalId;
    biller.externalBillerKey = billerData.billerKey || externalId;
    biller.liveDate = new Date(billerData.liveDate);
    biller.billerClass = billerData.billerClass || null;
    biller.billerType = billerData.billerType || null;
    biller.lineOfBusiness = billerData.lineOfBusiness || null;
    biller.territoryCode = billerData.territoryCode || null;
    biller.crc32 = crc32;

    // Create related entities (only if they exist and are valid)
    biller.masks = (billerData.masks || []).map((maskData: any) => {
      const billerMask = new BillerMask();
      billerMask.mask = maskData.mask;
      billerMask.maskLength = parseInt(maskData.maskLength, 10);
      billerMask.externalKey = maskData.maskKey;
      billerMask.liveDate = new Date(maskData.recordEffectiveDate);
      return billerMask;
    });

    biller.addresses = (billerData.addresses || []).map((addressData: any) => {
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
    });

    biller.names = (billerData.akas || []).map((akaData: any) => {
      const billerName = new BillerName();
      billerName.name = akaData.akaName;
      billerName.externalKey = akaData.akaKey;
      billerName.liveDate = new Date(akaData.recordEffectiveDate);
      return billerName;
    });

    return biller;
  }
}
