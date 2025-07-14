import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanApplicationRequestDto } from '@core/modules/lending/dto/request';
import { LoanApplicationResponseDto } from '@core/modules/lending/dto/response';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { EntityFailedToUpdateException, EntityNotFoundException } from '@library/shared/common/exception/domain';
import { LoanApplication } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoanApplicationsService {
  private readonly logger: Logger = new Logger(LoanApplicationsService.name);

  constructor(
    private readonly domainServices: IDomainServices,

  ) {}

  async getLoanApplicationById(id: string): Promise<LoanApplicationResponseDto | null> {
    const result = await this.domainServices.loanServices.getLoanApplicationById(id);
    if (!result) throw new EntityNotFoundException(`LoanApplication: ${id} not found`);
    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  async createLoanApplication(data: Partial<LoanApplicationRequestDto>): Promise<LoanApplicationResponseDto | null> {
    this.logger.debug('create: Creating loan application:', data);
    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    const result = await this.domainServices.loanServices.createLoanApplication(loanApplicationInput);
    if (!result) throw new EntityFailedToUpdateException('Failed to create Loan application');
    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  async updateLoanApplication(id: string, data: Partial<LoanApplication>): Promise<boolean> {
    this.logger.debug(`update: Updating loan application ${id}:`, data);
    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    const result = await this.domainServices.loanServices.updateLoanApplication(id, loanApplicationInput);
    if (!result) throw new EntityFailedToUpdateException('Failed to update Loan application');
    return result;
  }
}
