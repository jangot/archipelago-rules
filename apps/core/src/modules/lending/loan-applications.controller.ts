import { Public } from '@library/shared/common/decorators/public.decorator';
import { UUIDParam } from '@library/shared/common/pipe/uuidparam';
import { IRequest } from '@library/shared/type';
import { Body, Controller, Get, Logger, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse, ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation, ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { LoanApplicationRequestDto, LoanApplicationUpdateDto } from './dto/request';
import { LoanApplicationResponseDto, PublicLoanApplicationResponseDto } from './dto/response';
import { LoanApplicationsService } from './loan-applications.service';

@Controller('loan-applications')
@ApiTags('loan-applications')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
export class LoanApplicationsController {
  private readonly logger: Logger = new Logger(LoanApplicationsController.name);

  constructor(private readonly loanApplicationService: LoanApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all loan applications', description: 'Get all loan applications' })
  public async getAllLoanApplications(@Req() request: IRequest): Promise<LoanApplicationResponseDto[]> {
    const userId = request.user!.id;
    this.logger.debug(`Getting all loan applications for user ID: ${userId}`);

    return this.loanApplicationService.getAllLoanApplicationsByUserId(userId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending loan applications', description: 'Get pending loan applications' })
  public async getPendingLoanApplications(@Req() request: IRequest): Promise<LoanApplicationResponseDto[]> {
    const userId = request.user!.id;
    this.logger.debug(`Getting pending loan applications for user ID: ${userId}`);

    return this.loanApplicationService.getPendingLoanApplicationsByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a loan application by ID ', description: 'Get a loan application by ID' })
  @ApiOkResponse({ description: 'Loan application', type: LoanApplicationResponseDto, isArray: false })
  @ApiNotFoundResponse({ description: 'No Loan application found', isArray: false })
  @ApiParam({ name: 'id', required: true, description: 'Loan application id' })
  public async getLoanApplicationById(@Req() request: IRequest, @UUIDParam('id') id: string): Promise<LoanApplicationResponseDto | null> {
    this.logger.debug(`Getting loan application details with ID: ${id}`);
    const userId = request.user!.id; 
    
    return this.loanApplicationService.getLoanApplicationById(id, userId);
  }
  
  @Public()
  @Get(':id/public')
  @ApiOperation({ summary: 'Get the public details of a loan application by ID ', description: 'Get the public details of a loan application by ID' })
  @ApiOkResponse({ description: 'Loan application', type: PublicLoanApplicationResponseDto, isArray: false })
  @ApiNotFoundResponse({ description: 'No Loan application found', isArray: false })
  @ApiParam({ name: 'id', required: true, description: 'Loan application id' })
  public async getPublicLoanApplicationById(@UUIDParam('id') id: string): Promise<PublicLoanApplicationResponseDto | null> {
    this.logger.debug(`Getting loan application details with ID: ${id}`);

    return this.loanApplicationService.getPublicLoanApplicationById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new loan application', description: 'Create a new loan application' })
  @ApiCreatedResponse({ description: 'Loan application created', type: LoanApplicationResponseDto })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  public async create(@Req() request: IRequest, @Body() input: LoanApplicationRequestDto): Promise<LoanApplicationResponseDto | null> {
    const userId = request.user!.id;  
    this.logger.debug('Creating loan application', { input });

    return this.loanApplicationService.createLoanApplication(userId, input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a loan application', description: 'Partially update a loan application' })
  @ApiParam({ name: 'id', required: true, description: 'Loan application id' })
  @ApiBody({ type: LoanApplicationUpdateDto })
  @ApiOkResponse({ description: 'Loan application updated', type: Boolean, isArray: false })
  @ApiNotFoundResponse({ description: 'No Loan application found', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  public async updateLoanApplication(
    @UUIDParam('id') id: string,
    @Req() request: IRequest,
    @Body() updates: LoanApplicationUpdateDto,
  ): Promise<LoanApplicationResponseDto | null> {
    const userId = request.user!.id;
    this.logger.debug(`Updating loan application ${id} with data:`, updates);

    return this.loanApplicationService.updateLoanApplication(userId, id, updates);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a loan application', description: 'Submit a loan application' })
  @ApiParam({ name: 'id', required: true, description: 'Loan application id' })
  @ApiOkResponse({ description: 'Loan application submitted', type: undefined, isArray: false })
  @ApiNotFoundResponse({ description: 'No Loan application found', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  public async submitLoanApplication(
    @UUIDParam('id') id: string,
    @Req() request: IRequest,
  ): Promise<void> {
    const userId = request.user!.id;
    this.logger.debug(`Submitting loan application ${id}`);
    await this.loanApplicationService.submitLoanApplication(userId, id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a loan application', description: 'Accept a loan application' })
  @ApiParam({ name: 'id', required: true, description: 'Loan application id' })
  @ApiOkResponse({ description: 'Loan application accepted', type: undefined, isArray: false })
  @ApiNotFoundResponse({ description: 'No Loan application found', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  public async acceptLoanApplication(
    @UUIDParam('id') id: string,
    @Req() request: IRequest,
  ): Promise<void> {
    const userId = request.user!.id;
    this.logger.debug(`Accepting loan application ${id} by user ${userId}`);
    await this.loanApplicationService.acceptLoanApplication(userId, id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a loan application', description: 'Reject a loan application' })
  @ApiParam({ name: 'id', required: true, description: 'Loan application id' })
  @ApiOkResponse({ description: 'Loan application rejected', type: undefined, isArray: false })
  @ApiNotFoundResponse({ description: 'No Loan application found', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  public async rejectLoanApplication(
    @UUIDParam('id') id: string,
    @Req() request: IRequest,
  ): Promise<void> {
    const userId = request.user!.id;
    this.logger.debug(`Rejecting loan application ${id} by user ${userId}`);
    await this.loanApplicationService.rejectLoanApplication(userId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a loan application', description: 'Cancel a loan application' })
  @ApiParam({ name: 'id', required: true, description: 'Loan application id' })
  @ApiOkResponse({ description: 'Loan application cancelled', type: undefined, isArray: false })
  @ApiNotFoundResponse({ description: 'No Loan application found', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  public async cancelLoanApplication(
    @UUIDParam('id') id: string,
    @Req() request: IRequest,
  ): Promise<void> {
    const userId = request.user!.id;
    this.logger.debug(`Cancelling loan application ${id} by user ${userId}`);
    await this.loanApplicationService.cancelLoanApplication(userId, id);
  }
}
