import { LoanApplicationUnauthResponseDto } from '@core/modules/lending/dto/response/loan-application.unauth.response.dto';
import { UUIDParam } from '@library/shared/common/pipe/uuidparam';
import { Controller, Get, Logger } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation, ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { LoanApplicationsService } from './loan-applications.service';

//TODO: This class needs to be removed in favor of Mike's @Public() decorator once it's available
@Controller('loan-applications-unauth')
@ApiTags('loan-applications-unauth')
export class LoanApplicationsUnauthController {
  private readonly logger: Logger = new Logger(LoanApplicationsUnauthController.name);

  constructor(private readonly loanApplicationService: LoanApplicationsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a loan application by ID ', description: 'Get a loan application by ID' })
  @ApiOkResponse({ description: 'Loan application', type: LoanApplicationUnauthResponseDto, isArray: false })
  @ApiNotFoundResponse({ description: 'No Loan application found', isArray: false })
  @ApiParam({ name: 'id', required: true, description: 'Loan application id' })
  public async getLoanApplicationById(@UUIDParam('id') id: string): Promise<LoanApplicationUnauthResponseDto | null> {
    this.logger.debug(`Getting loan application details with ID: ${id}`);

    return this.loanApplicationService.getLoanApplicationUnauthById(id);
  }
}
