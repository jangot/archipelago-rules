import { Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards';
import { IRequest } from '@library/shared/types';
import { UUIDParam } from '@library/shared/common/pipes/uuidparam';
import { LoanAcceptRequestDto, LoanCreateRequestDto, LoanProposeRequestDto, LoanResponseDto } from '@core/dto';

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

  // create new loan
  // from type selection until KYC
  @Post()
  @ApiOperation({ summary: 'Create a new loan (from type selection until KYC)', description: 'Create a new loan (from type selection until KYC)' })
  @ApiCreatedResponse({ description: 'Loan created successfully', type: LoanResponseDto })
  public async create(@Req() request: IRequest, @Body() input: LoanCreateRequestDto): Promise<LoanResponseDto | null> {
    // TODO: make a validation stuff here
    const userId = request.user?.id;
    if (!userId) {
      throw new HttpException('User is not authenticated', HttpStatus.UNAUTHORIZED);
    }
    this.logger.debug('Creating loan', { input });
    return this.loansService.createLoan(userId, input);
  }

  // Accept loan and provide details required (target payment method, etc.)
  @Patch('accept/:id')
  @ApiOperation({ summary: 'Accept a loan and provide required details (e.g. target payment method)', description: 'Accept a loan and provide required details (e.g. target payment method)' })
  public async acceptLoan(@UUIDParam('id') id: string, @Req() request: IRequest, @Body() input: LoanAcceptRequestDto): Promise<unknown> {
    const userId = request.user?.id;
    if (!userId) {
      throw new HttpException('User is not authenticated', HttpStatus.UNAUTHORIZED);
    }
    this.logger.debug(`Accepting loan with ID: ${id}`, { input });
    return this.loansService.acceptLoan(userId, id, input.paymentAccountId);
  }

  // Close loan and provide details required (closure reason, etc.)
  @Patch('close/:id')
  @ApiOperation({ summary: 'Close a loan and provide required details (e.g. closure reason)', description: 'Close a loan and provide required details (e.g. closure reason)' })
  public async clsoeLoan(@UUIDParam('id') id: string, @Body() input: string): Promise<unknown> {
    this.logger.debug(`Closing loan with ID: ${id}`, { input });
    return;
  }

  // Connect bank account to loan and send to target for acceptance
  @Patch(':id')
  @ApiOperation({ summary: 'Connect a bank account to the loan and send it to the target for acceptance', description: 'Connect a bank account to the loan and send it to the target for acceptance' })
  public async connectAndSend(@Req() request: IRequest, @UUIDParam('id') id: string, @Body() input: LoanProposeRequestDto): Promise<unknown> {
    const userId = request.user?.id;
    if (!userId) {
      throw new HttpException('User is not authenticated', HttpStatus.UNAUTHORIZED);
    }
    if (!id) {
      throw new HttpException('Loan Id is required', HttpStatus.BAD_REQUEST);
    }
    if (!input || !input.sourcePaymentAccountId) {
      throw new HttpException('Missing Payment Account Id', HttpStatus.BAD_REQUEST);
    }
    this.logger.debug('Connecting and sending loan', { id, input });
    return this.loansService.proposeLoan(userId, id, input.sourcePaymentAccountId);
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
