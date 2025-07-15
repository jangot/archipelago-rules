import { UUIDParam } from '@library/shared/common/pipe/uuidparam';
import { IRequest } from '@library/shared/type';
import { Body, Controller, Get, Logger, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { LoanApplicationRequestDto, LoanApplicationUpdateDto } from './dto/request';
import { LoanApplicationResponseDto } from './dto/response';
import { LoanApplicationsService } from './loan-applications.service';

@Controller('loan-applications')
@ApiTags('loan-applications')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
export class LoanApplicationsController {
  private readonly logger: Logger = new Logger(LoanApplicationsController.name);

  constructor(private readonly loanApplicationService: LoanApplicationsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a loan application by ID ', description: 'Get a loan application by ID' })
  public async getLoanApplicationById(@UUIDParam('id') id: string): Promise<LoanApplicationResponseDto | null> {
    this.logger.debug(`Getting loan application details with ID: ${id}`);

    return this.loanApplicationService.getLoanApplicationById(id);
  }
  
  @Post()
  @ApiOperation({ summary: 'Create a new loan application', description: 'Create a new loan application' })
  @ApiCreatedResponse({ description: 'Loan application created', type: LoanApplicationResponseDto })
  public async create(@Req() request: IRequest, @Body() input: LoanApplicationRequestDto): Promise<LoanApplicationResponseDto | null> {
    const userId = request.user!.id;  
    this.logger.debug('Creating loan application', { input });

    return this.loanApplicationService.createLoanApplication(userId, input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a loan application', description: 'Partially update a loan application' })
  @ApiBody({ type: LoanApplicationUpdateDto })
  public async updateLoanApplication(
    @UUIDParam('id') id: string,
    @Req() request: IRequest,
    @Body() updates: LoanApplicationUpdateDto,
  ): Promise<boolean> {
    const userId = request.user!.id;
    this.logger.debug(`Updating loan application ${id} with data:`, updates);

    return this.loanApplicationService.updateLoanApplication(userId, id, updates);
  }
}
