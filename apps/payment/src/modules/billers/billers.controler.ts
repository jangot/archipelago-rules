import { BillerNetworkType } from '@library/entity/enum/biller-network.type';
import { Body, Controller, Post } from '@nestjs/common';
import { BillersFactory } from './billers.factory';

/**
 * BillersController handles biller file ingestion endpoints.
 */
@Controller('billers')
export class BillersController {
  constructor(private readonly billersFactory: BillersFactory) {}

  /**
   * Endpoint to trigger biller file ingestion (simulated S3 event)
   */
  @Post('ingest')
  public async ingestBillerFile(@Body() body: { billerNetworkType: string; filePath: string }): Promise<{ success: boolean }> {
    const { billerNetworkType, filePath } = body;
    const billerProvider = this.billersFactory.getFactory(billerNetworkType as BillerNetworkType);
    await billerProvider.moveFileToLocalBucket(filePath);
    return { success: true };
  }
}
