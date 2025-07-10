import { BillerNetworkType } from '@library/entity/enum/biller-network.type';
import { Body, Controller, Post } from '@nestjs/common';
import { BillerProviderFactory } from './billers.factory';
import { IngestBillerFileRequestDto } from './dto/request/ingest-biller-file.request.dto';

/**
 * BillersController handles biller file ingestion endpoints.
 */
@Controller('billers')
export class BillersController {
  constructor(private readonly billerProviderFactory: BillerProviderFactory) {}

  /**
   * Endpoint to trigger biller file ingestion (simulated S3 event)
   */
  @Post('ingest')
  public async ingestBillerFile(@Body() body: IngestBillerFileRequestDto): Promise<{ success: boolean }> {
    const { billerNetworkType, filePath } = body;
    const billerProvider = this.billerProviderFactory.create(billerNetworkType as BillerNetworkType);
    await billerProvider.processBillerFile(billerNetworkType as BillerNetworkType, filePath);
    return { success: true };
  }
}
