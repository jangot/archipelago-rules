import { Injectable, Logger } from '@nestjs/common';
import { BillerProviderFactory } from './billers.factory';
import { UpsertBillersRequestDto } from './dto/request/upsert-billers.request.dto';
import { ProcessBillersResult } from './interfaces/billers-provider.interface';

/**
 * BillersService handles the business logic for upserting billers from files.
 */
@Injectable()
export class BillersService {
  private readonly logger: Logger = new Logger(BillersService.name);

  constructor(private readonly billerProviderFactory: BillerProviderFactory) {}

  /**
   * Upserts billers by processing a biller file.
   * @param input The request DTO containing biller network type, file origin, and resource
   */
  public async upsertBillers(input: UpsertBillersRequestDto): Promise<ProcessBillersResult> {
    const { billerNetworkType, fileOrigin, resource } = input;
    const billerProvider = this.billerProviderFactory.create(billerNetworkType, fileOrigin);
    return billerProvider.processBillers(billerNetworkType, resource, fileOrigin);
  }
} 
