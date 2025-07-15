import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanApplicationRequestDto } from '@core/modules/lending/dto/request';
import { LoanApplicationResponseDto } from '@core/modules/lending/dto/response';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { EntityFailedToUpdateException, EntityNotFoundException } from '@library/shared/common/exception/domain';
import { LoanApplication } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InvalidUserForLoanApplicationException } from './exceptions';

@Injectable()
export class LoanApplicationsService {
  private readonly logger: Logger = new Logger(LoanApplicationsService.name);

  constructor(
    private readonly domainServices: IDomainServices,

  ) {}

  public async getLoanApplicationById(id: string): Promise<LoanApplicationResponseDto | null> {
    const result = await this.domainServices.loanServices.getLoanApplicationById(id);

    if (!result) throw new EntityNotFoundException(`Loan application: ${id} not found`);

    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  public async createLoanApplication(userId: string, data: Partial<LoanApplicationRequestDto>): Promise<LoanApplicationResponseDto | null> {
    this.logger.debug('create: Creating loan application:', data);

    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    loanApplicationInput.borrowerId = userId;
    const result = await this.domainServices.loanServices.createLoanApplication(loanApplicationInput);

    if (!result) throw new EntityFailedToUpdateException('Failed to create Loan application');

    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  public async updateLoanApplication(userId: string, id: string, data: Partial<LoanApplicationRequestDto>): Promise<boolean> {
    this.logger.debug(`update: Updating loan application ${id}:`, data);

    // Validate that the loan application belongs to the user (as a borrower or lender)
    await this.validateApplicationLoanUser(id, userId);

    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    const result = await this.domainServices.loanServices.updateLoanApplication(id, loanApplicationInput);

    if (!result) throw new EntityFailedToUpdateException('Failed to update Loan application');

    return result;
  }

  private async validateApplicationLoanUser(id: string, userId: string) {
    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(id);
    if (!loanApplication) throw new EntityNotFoundException(`Loan application: ${id} not found`);

    if (loanApplication.borrowerId !== userId && loanApplication.lenderId !== userId)
      throw new InvalidUserForLoanApplicationException('You are not authorized to update this loan application');
  }
}
