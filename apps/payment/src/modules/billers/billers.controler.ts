import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { BillersService } from './billers.service';
import { UpsertBillersRequestDto } from './dto/request/upsert-billers.request.dto';
import { ProcessBillersResult } from './interfaces/billers-provider.interface';

/**
 * BillersController handles biller file ingestion endpoints.
 */
@Controller('billers')
export class BillersController {
  constructor(private readonly billersService: BillersService) {}

  /**
   * Endpoint to upsert billers by processing a biller file
   */
  @Post()
  @ApiOperation({ description: 'Upsert billers by processing a biller resource', summary: 'Upsert billers by processing a biller resource' })
    
  public async upsertBillers(@Body() body: UpsertBillersRequestDto): Promise<ProcessBillersResult> {
    return this.billersService.upsertBillers(body);
  }
}
