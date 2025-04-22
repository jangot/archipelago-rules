import { Body, Controller, Get, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { BillersService } from './billers.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUIDParam } from '@library/shared/common/pipes/uuidparam';
import { JwtAuthGuard } from '@core/auth/guards';

@Controller('billers')
@ApiTags('billers')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
export class BillersController {
  private readonly logger: Logger = new Logger(BillersController.name);

  constructor(private readonly billersService: BillersService) {}

  // for Billers search bar
  // TODO: paging / infinite scroll
  // TODO likely @Post() instead of @Get
  @Get('/search/:query')
  @ApiOperation({ summary: 'Search for billers using the search bar', description: 'Search for billers using the search bar' })
  public async search(@Param('query') query: string): Promise<unknown> {
    this.logger.debug(`Searching for billers with query: ${query}`);
    return;
  }

  // to get certain Biller details
  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific biller', description: 'Get details of a specific biller' })
  public async getBiller(@UUIDParam('id') id: string): Promise<unknown> {
    this.logger.debug(`Getting biller with ID: ${id}`);
    return;
  }

  // to create not-in-network Biller for DBP Loans
  @Post()
  @ApiOperation({ summary: 'Create a custom biller for DBP Loans', description: 'Create a custom biller for DBP Loans' })
  public async createCustom(@Body() input: unknown): Promise<unknown> {
    this.logger.debug('Creating custom biller', { input });
    return;
  }
}
