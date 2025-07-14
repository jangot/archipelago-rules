import { Injectable, Logger } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { LoanApplication } from '@library/shared/domain/entity';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { LoanApplicationResponseDto } from '@core/modules/lending/dto/response';
import { LoanApplicationRequestDto } from '@core/modules/lending/dto/request';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { IDomainServices } from '@core/modules/domain/idomain.services';

@Injectable()
export class LoanApplicationsService {
  private readonly logger: Logger = new Logger(LoanApplicationsService.name);

  constructor(
    private readonly domainServices: IDomainServices,

  ) {}

  async getLoanApplicationById(id: string): Promise<LoanApplicationResponseDto | null> {
    const result = await this.domainServices.loanApplicationServices.getLoanApplicationById(id);
    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  async createLoanApplication(data: DeepPartial<LoanApplicationRequestDto>): Promise<LoanApplicationResponseDto | null> {
    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    return DtoMapper.toDto(this.domainServices.loanApplicationServices.createLoanApplication(loanApplicationInput), LoanApplicationResponseDto);
  }

  async updateLoanApplication(id: string, data: DeepPartial<LoanApplication>): Promise<boolean> {
    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    return this.domainServices.loanApplicationServices.updateLoanApplication(id, loanApplicationInput);
  }
}
