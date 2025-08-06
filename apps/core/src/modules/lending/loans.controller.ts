import { UUIDParam } from '@library/shared/common/pipe/uuidparam';
import { IRequest } from '@library/shared/type';
import { Body, Controller, Delete, Get, Logger, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { LoansService } from './loans.service';

@Controller('loans')
@ApiTags('loans')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
export class LoansController {
  private readonly logger: Logger = new Logger(LoansController.name);

  constructor(private readonly loansService: LoansService) {}

  // to search for loans
  // TODO: guard for loans search - only for certain roles
  // TODO likely @Post() instead of @Get
  @Get('/search/:query')
  @ApiOperation({ summary: 'Search for loans', description: 'Search for loans' })
  public async search(@Param('query') query: string): Promise<Array<unknown>> {
    this.logger.debug(`Searching for loans with query: ${query}`);
    return [];
  }

  // list of all user loans
  // TODO: paging / infinite scroll
  @Get('/all')
  @ApiOperation({ summary: 'List all user loans', description: 'List all user loans' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getAllUserLoans(@Req() request: IRequest): Promise<Array<unknown>> {
    this.logger.debug('Getting all user loans');
    return [];
  }

  // certain loan details
  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific loan', description: 'Get details of a specific loan' })
  public async getLoanDetails(@UUIDParam('id') id: string): Promise<unknown> {
    this.logger.debug(`Getting loan details with ID: ${id}`);
    return;
  }

  // Close loan and provide details required (closure reason, etc.)
  @Patch('close/:id')
  @ApiOperation({ summary: 'Close a loan and provide required details (e.g. closure reason)', description: 'Close a loan and provide required details (e.g. closure reason)' })
  public async closeLoan(@UUIDParam('id') id: string, @Body() input: string): Promise<unknown> {
    this.logger.debug(`Closing loan with ID: ${id}`, { input });
    return;
  }

  // TODO: is there real need of generic 'update' endpoint?

  // TODO: 'preview' endpoint for not registered target user

  // Delete Loan if not in action (Created, Offered?, Requested?)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a loan if it is not in action (e.g. Created, Offered, Requested)', description: 'Delete a loan if it is not in action (e.g. Created, Offered, Requested)' })
  public async deleteLoan(@UUIDParam('id') id: string): Promise<unknown> {
    this.logger.debug(`Deleting loan with ID: ${id}`);
    return;
  }
}
