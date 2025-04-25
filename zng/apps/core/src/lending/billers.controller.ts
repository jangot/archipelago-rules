import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { BillersService } from './billers.service';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUIDParam } from '@library/shared/common/pipes/uuidparam';
import { JwtAuthGuard } from '@core/auth/guards';
import { IRequest } from '@library/shared/types';
import { BillerCreateCustomRequestDto, BillerResponseDto } from '@core/dto';

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

  @Get('/custom')
  @ApiOperation({ summary: 'Get custom billers created by User', description: 'Get custom billers created by User' })
  @ApiOkResponse({ description: 'Get custom billers', type: Array<BillerResponseDto> })
  public async getCustom(@Req() request: IRequest): Promise<BillerResponseDto[] | null> {
    const userId = request.user?.id;
    if (!userId) {
      throw new HttpException('User is not authenticated', HttpStatus.UNAUTHORIZED);
    }
    this.logger.debug('Getting custom billers');
    const result = await this.billersService.getCustomBillers(userId);
    return result;
  }

  // to get certain Biller details
  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific biller', description: 'Get details of a specific biller' })
  public async getBiller(@UUIDParam('id') id: string): Promise<unknown> {
    this.logger.debug(`Getting biller with ID: ${id}`);
    return;
  }

  // to create not-in-network Biller for DBP Loans
  @Post('/custom')
  @ApiOperation({ summary: 'Create a custom biller for DBP Loans', description: 'Create a custom biller for DBP Loans' })
  @ApiCreatedResponse({ description: 'Custom biller created successfully', type: BillerResponseDto })
  public async createCustom(@Req() request: IRequest, @Body() input: BillerCreateCustomRequestDto): Promise<BillerResponseDto | null> {
    const userId = request.user?.id;
    if (!userId) {
      throw new HttpException('User is not authenticated', HttpStatus.UNAUTHORIZED);
    }
    this.logger.debug('Creating custom biller', { input });
    return this.billersService.createCustomBiller(userId, input.name);
  }
}
