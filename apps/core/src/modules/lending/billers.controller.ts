import { BillersService } from '@core/modules/lending/billers.service';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BillerResponseDto } from './dto/response';

@Controller('billers')
@ApiTags('billers')
export class BillersController {
  private readonly logger: Logger = new Logger(BillersController.name);

  constructor(private readonly billersService: BillersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Billers that match the search criteria of name and postalCode', description: 'Get all Billers that match the search criteria of name and postalCode' })
  public async getAllBillers(
    @Query('billerName') billerName: string,
    @Query('billerPostalCode') billerPostalCode: string,
    @Query('limit') limit: number = 10
  ): Promise<BillerResponseDto[]> {
    this.logger.debug(`Getting all billers that match name ${billerName} and postalCode ${billerPostalCode} up to ${limit} results`);

    return this.billersService.getBillers(billerName, billerPostalCode, limit);
  }
}
