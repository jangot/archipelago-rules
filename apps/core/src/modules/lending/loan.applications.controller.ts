import { UUIDParam } from '@library/shared/common/pipe/uuidparam';
import { IRequest } from '@library/shared/type';
import { Body, Controller, Get, HttpException, HttpStatus, Logger, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { LoanApplicationUpdateDto, LoanApplicationRequestDto } from './dto/request';
import { LoanApplicationResponseDto } from './dto/response';

@Controller('loan-applications')
@ApiTags('loan-applications')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
export class LoanApplicationsController {
  private readonly logger: Logger = new Logger(LoanApplicationsController.name);

  constructor() {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a loan application by ID ', description: 'Get a loan application by ID' })
  public async getLoanApplicationById(@UUIDParam('id') id: string): Promise<LoanApplicationResponseDto> {
    this.logger.debug(`Getting loan application details with ID: ${id}`);
    // TODO - Replace with actual service call to fetch loan application details. This method will have to extract
    //  the request.user.id to perform some validation to make sure that the user is either the borrower or the lender.
    return {
      id: id,
      status: 'created',
      billerName: 'Internet Co.',
      billerId: '1e2f3a4b-2222-2222-2222-222222222222',
      billerPostalCode: '10001',
      billAccount: '987654321',
      billAmount: 89.99,
      lenderFirstName: 'Alice',
      lenderLastName: 'Smith',
      lenderEmail: 'alice@example.com',
      lenderRelationship: 'Colleague',
      lenderNote: 'For internet',
      lenderAccountId: '1e2f3a4b-2222-2222-2222-333333333333',
      borrowerAccountId: '1e2f3a4b-3333-3333-3333-333333333333',
      loanType: 'dbp',
      loanPayments: 6,
      loanServiceFee: 15.50,
    };
  }
  
  @Post()
  @ApiOperation({ summary: 'Create a new loan application', description: 'Create a new loan application' })
  @ApiCreatedResponse({ description: 'Loan application created', type: LoanApplicationResponseDto })
  public async create(@Req() request: IRequest, @Body() input: LoanApplicationRequestDto): Promise<LoanApplicationResponseDto | null> {
    const userId = request.user?.id;
    if (!userId) {
      throw new HttpException('User is not authenticated', HttpStatus.UNAUTHORIZED);
    }
    this.logger.debug('Creating loan', { input });
    // TODO - Replace with actual service call to create loan application

    return {
      ...input,
      id: 'mock-id-1234',
      status: 'created',
      loanServiceFee: 15.00,
    };
  }



  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a loan application', description: 'Partially update a loan application' })
  @ApiBody({ type: LoanApplicationUpdateDto })
  public async updateLoanApplication(
    @UUIDParam('id') id: string,
    @Body() updates: LoanApplicationUpdateDto,
  ): Promise<boolean> {
    this.logger.debug(`Updating loan application ${id} with data:`, updates);
    return true;
  }
}
