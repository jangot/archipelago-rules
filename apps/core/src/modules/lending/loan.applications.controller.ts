import { UUIDParam } from '@library/shared/common/pipe/uuidparam';
import { IRequest } from '@library/shared/type';
import { Body, Controller, Get, HttpException, HttpStatus, Logger, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { PartialLoanApplicationUpdateDto, LoanApplicationRequestDto } from './dto/request';
import { LoanApplicationResponseDto } from './dto/response';

@Controller('loan-applications')
@ApiTags('loan-applications')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
export class LoanApplicationsController {
  private readonly logger: Logger = new Logger(LoanApplicationsController.name);

  constructor() {}

  @Get('/all')
  @ApiOperation({ summary: 'List all user loan applications', description: 'List all user loan applications' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getAllUserLoans(@Req() request: IRequest): Promise<Array<unknown>> {
    this.logger.debug('Getting all user loans');
    // TODO - Replace with actual service call to fetch user loans
    return [
      {
        loanApplicationId: '1e2f3a4b-0000-0000-0000-000000000001',
        loanApplicationState: 'created',
        billerName: 'Electric Company',
        billerId: '1e2f3a4b-1111-1111-1111-111111111111',
        billerPostalCode: '90210',
        billAccount: '123456789',
        billAmount: 150.75,
        lenderFirstName: 'John',
        lenderLastName: 'Doe',
        lenderEmail: 'john@example.com',
        lenderRelationship: 'Friend',
        lenderNote: 'Helping with bill',
        loanType: 'DirectBillPay',
        loanPayments: 12,
        loanServiceFee: 25.00,
      },
    ];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a loan application by ID ', description: 'Get a loan application by ID' })
  public async getLoanDetails(@UUIDParam('id') id: string): Promise<LoanApplicationResponseDto> {
    this.logger.debug(`Getting loan application details with ID: ${id}`);
    // TODO - Replace with actual service call to fetch loan application details
    return {
      loanApplicationId: id,
      loanApplicationState: 'created',
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
      loanApplicationId: 'mock-id-1234',
      loanApplicationState: 'created',
      loanServiceFee: 15.00,
    };
  }



  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a loan application', description: 'Partially update a loan application' })
  @ApiBody({ type: PartialLoanApplicationUpdateDto })
  public async updateLoanApplicationPartially(
    @UUIDParam('id') id: string,
    @Body() updates: PartialLoanApplicationUpdateDto,
  ): Promise<boolean> {
    this.logger.debug(`Updating loan application ${id} with data:`, updates);
    return true;
  }
}
