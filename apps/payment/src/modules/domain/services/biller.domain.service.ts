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

/**
 * BillerDomainService handles all database operations for biller processing.
 * Separates database concerns from file processing logic and provides
 * transaction-based operations for data integrity.
 */
@Injectable()
export class BillerDomainService {
  protected readonly logger = new Logger(BillerDomainService.name);

  // Performance constants
  private static readonly BULK_CHUNK_SIZE = 50; // Process 50 billers per transaction
  private static readonly MAX_TRANSACTION_RETRIES = 3;

  constructor(
    @Inject(forwardRef(() => BillerRepository))
    protected readonly billerRepository: BillerRepository,
    protected readonly dataSource: DataSource,
  ) {}

  // #region Biller Data Retrieval

  /**
   * Fetches all existing billers with their CRC32 values for efficient comparison.
   * This method loads all billers into memory for fast CRC32 comparison during processing.
   * 
   * @returns Map of externalBillerId to { id, crc32 } for efficient lookups
   */
  public async getExistingBillersMap(): Promise<Map<string, { id: string; crc32: number }>> {
    this.logger.debug('Loading existing billers for CRC32 comparison');
    
    const existingBillers = await this.billerRepository.getAll();
    const existingBillerMap = new Map<string, { id: string; crc32: number }>();
    
    existingBillers.forEach(biller => {
      if (biller.externalBillerId) {
        existingBillerMap.set(biller.externalBillerId, { id: biller.id, crc32: biller.crc32 });
      }
    });

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
    
    // Process billers in smaller chunks to avoid transaction timeouts
    const chunkSize = BillerDomainService.BULK_CHUNK_SIZE;
    
    for (let i = 0; i < billersData.length; i += chunkSize) {
      const chunk = billersData.slice(i, i + chunkSize);
      
      try {
        await this.dataSource.transaction(async (entityManager) => {
          for (const billerData of chunk) {
            try {
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
                billerData.names.forEach(name => {
                  name.billerId = savedBiller.id;
                });
                await entityManager.save(BillerName, billerData.names);
              }
              
              if (billerData.masks && billerData.masks.length > 0) {
                billerData.masks.forEach(mask => {
                  mask.billerId = savedBiller.id;
                });
                await entityManager.save(BillerMask, billerData.masks);
              }
              
              if (billerData.addresses && billerData.addresses.length > 0) {
                billerData.addresses.forEach(address => {
                  address.billerId = savedBiller.id;
                });
                await entityManager.save(BillerAddress, billerData.addresses);
              }
              
              results.push({
                success: true,
                billerId: billerData.biller.externalBillerId || undefined,
              });
            } catch (error) {
              const errorMessage = `Failed to process biller ${billerData.biller.externalBillerId}: ${error instanceof Error ? error.message : String(error)}`;
              this.logger.error(errorMessage, { 
                error, 
                billerId: billerData.biller.externalBillerId,
              });
              
              results.push({
                success: false,
                billerId: billerData.biller.externalBillerId || undefined,
                error: errorMessage,
              });
            }
          }
        });
      } catch (error) {
        // If the entire chunk transaction fails, mark all as failed
        const errorMessage = `Bulk transaction failed for chunk ${i}-${i + chunkSize}: ${error instanceof Error ? error.message : String(error)}`;
        this.logger.error(errorMessage, { error });
        
        chunk.forEach(billerData => {
          results.push({
            success: false,
            billerId: billerData.biller.externalBillerId || undefined,
            error: errorMessage,
          });
        });
      }
    }
    
    return results;
  }

  // #endregion
} 
