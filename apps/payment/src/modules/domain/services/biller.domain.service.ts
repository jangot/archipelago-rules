import { BillerAddress } from '@library/shared/domain/entity/biller-address.entity';
import { BillerMask } from '@library/shared/domain/entity/biller-mask.entity';
import { BillerName } from '@library/shared/domain/entity/biller-name.entity';
import { Biller } from '@library/shared/domain/entity/biller.entity';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BillerRepository } from '../../billers/repositories/biller.repository';

export interface BillerWithRelatedEntities {
  biller: Biller;
  names: BillerName[];
  masks: BillerMask[];
  addresses: BillerAddress[];
}

export interface BillerProcessingResult {
  success: boolean;
  billerId?: string;
  error?: string;
}

export interface ExistingBillerInfo {
  externalId: string;
  id: string;
  crc32: number;
}

/**
 * BillerDomainService handles all database operations for biller processing.
 * Separates database concerns from file processing logic and provides
 * transaction-based operations for data integrity.
 */
@Injectable()
export class BillerDomainService {
  protected readonly logger = new Logger(BillerDomainService.name);

  // Performance constants
  private static readonly STREAMING_PAGE_SIZE = 1000; // Load billers in pages of 1000

  constructor(
    @Inject(forwardRef(() => BillerRepository))
    protected readonly billerRepository: BillerRepository,
    protected readonly dataSource: DataSource,
  ) {}

  // #region Biller Data Retrieval

  /**
   * Fetches existing billers with streaming/pagination for memory efficiency.
   * This method loads billers in pages to avoid memory issues with large datasets.
   * 
   * @returns AsyncGenerator yielding existing biller info for efficient processing
   */
  public async *getExistingBillersStream(): AsyncGenerator<ExistingBillerInfo> {
    let offset = 0;
    let totalLoaded = 0;
    
    while (true) {
      const billers = await this.billerRepository.getBillersWithPagination(
        offset, 
        BillerDomainService.STREAMING_PAGE_SIZE
      );
      
      if (billers.length === 0) {
        break;
      }
      
      for (const biller of billers) {
        if (biller.externalBillerId) {
          yield {
            externalId: biller.externalBillerId,
            id: biller.id,
            crc32: biller.crc32,
          };
        }
      }
      
      totalLoaded += billers.length;
      offset += BillerDomainService.STREAMING_PAGE_SIZE;
    }
    
    this.logger.log(`Completed streaming load of ${totalLoaded} existing billers`);
  }

  /**
   * Fetches all existing billers with their CRC32 values for efficient comparison.
   * This method loads all billers into memory for fast CRC32 comparison during processing.
   * 
   * @returns Map of externalBillerId to { id, crc32 } for efficient lookups
   */
  public async getExistingBillersMap(): Promise<Map<string, { id: string; crc32: number }>> {
    this.logger.debug('Loading existing billers for CRC32 comparison');
    
    const existingBillerMap = new Map<string, { id: string; crc32: number }>();
    
    // Use streaming approach for memory efficiency
    for await (const billerInfo of this.getExistingBillersStream()) {
      existingBillerMap.set(billerInfo.externalId, { 
        id: billerInfo.id, 
        crc32: billerInfo.crc32, 
      });
    }

    this.logger.log(`Loaded ${existingBillerMap.size} existing billers from database`);
    return existingBillerMap;
  }

  // #endregion

  // #region Bulk Biller Processing

  /**
   * Processes multiple billers with all related entities in bulk transactions.
   * Used chunk-based processing to avoid transaction timeouts and improve performance.
   * 
   * @param billersData Array of biller data with related entities
   * @param existingBillerMap Map of existing billers for CRC32 comparison
   * @returns Array of processing results
   */
  public async processBillersInBulk(
    billersData: BillerWithRelatedEntities[],
    existingBillerMap: Map<string, { id: string; crc32: number }>
  ): Promise<BillerProcessingResult[]> {
    const results: BillerProcessingResult[] = [];
    
    // Process each biller in its own transaction to prevent one failure from aborting others
    for (const billerData of billersData) {
      try {
        await this.dataSource.transaction(async (entityManager) => {
          const existingBiller = existingBillerMap.get(billerData.biller.externalBillerId || '');
          
          let savedBiller: Biller;
          
          if (existingBiller) {
            // Update existing biller
            const updatedBiller = await entityManager.save(Biller, {
              id: existingBiller.id,
              name: billerData.biller.name,
              type: billerData.biller.type,
              externalBillerKey: billerData.biller.externalBillerKey,
              liveDate: billerData.biller.liveDate,
              billerClass: billerData.biller.billerClass,
              billerType: billerData.biller.billerType,
              lineOfBusiness: billerData.biller.lineOfBusiness,
              territoryCode: billerData.biller.territoryCode,
              crc32: billerData.biller.crc32,
            });
            
            savedBiller = updatedBiller;
          } else {
            // Create new biller
            savedBiller = await entityManager.save(Biller, billerData.biller);
          }
          
          // Bulk save related entities with the correct biller_id
          if (billerData.names && billerData.names.length > 0) {
            const validNames = billerData.names.filter(name => 
              name.name && name.externalKey && name.liveDate
            );
            
            if (validNames.length > 0) {
              validNames.forEach(name => {
                name.billerId = savedBiller.id;
              });
              
              await entityManager.save(BillerName, validNames);
            }
          }
          
          if (billerData.masks && billerData.masks.length > 0) {
            const validMasks = billerData.masks.filter(mask => 
              mask.mask && mask.maskLength && mask.externalKey && mask.liveDate
            );
            
            if (validMasks.length > 0) {
              validMasks.forEach(mask => {
                mask.billerId = savedBiller.id;
              });
              
              await entityManager.save(BillerMask, validMasks);
            }
          }
          
          if (billerData.addresses && billerData.addresses.length > 0) {
            const validAddresses = billerData.addresses.filter(address => 
              address.addressLine1 && address.city && address.stateProvinceCode && 
              address.countryCode && address.postalCode && address.externalKey && address.liveDate
            );
            
            if (validAddresses.length > 0) {
              validAddresses.forEach(address => {
                address.billerId = savedBiller.id;
              });
              
              await entityManager.save(BillerAddress, validAddresses);
            }
          }
        });
        
        results.push({
          success: true,
          billerId: billerData.biller.externalBillerId || undefined,
        });
      } catch (error) {
        const errorMessage = `Failed to process biller ${billerData.biller.externalBillerId}: ${error instanceof Error ? error.message : String(error)}`;
        this.logger.error(errorMessage, { 
          error, 
          billerId: billerData.biller.externalBillerId,
          billerData: {
            hasNames: billerData.names?.length || 0,
            hasMasks: billerData.masks?.length || 0,
            hasAddresses: billerData.addresses?.length || 0,
            billerFields: {
              name: !!billerData.biller.name,
              type: !!billerData.biller.type,
              externalBillerKey: !!billerData.biller.externalBillerKey,
              liveDate: !!billerData.biller.liveDate,
              crc32: !!billerData.biller.crc32,
            },
          },
        });
        
        results.push({
          success: false,
          billerId: billerData.biller.externalBillerId || undefined,
          error: errorMessage,
        });
      }
    }
    
    return results;
  }

  // #endregion
} 
