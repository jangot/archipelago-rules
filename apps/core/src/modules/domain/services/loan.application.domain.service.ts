import { Injectable, Logger } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { EntityFailedToUpdateException, EntityNotFoundException } from '@library/shared/common/exception/domain';
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { CoreDataService } from '@core/modules/data';
import { ILoanApplication } from '@library/entity/entity-interface';
import { LoanApplication } from '@library/shared/domain/entity';

@Injectable()
export class LoanApplicationDomainService extends BaseDomainServices {
  private readonly logger: Logger = new Logger(LoanApplicationDomainService.name);

  constructor(
    protected readonly data: CoreDataService,
  ) {
    super(data);
  }

  async getLoanApplicationById(id: string): Promise<ILoanApplication | null> {
    const result = await this.data.loanApplications.getById(id);
    if (!result) throw new EntityNotFoundException(`LoanApplication: ${id} not found`);
    return result;
  }

  async createLoanApplication(data: DeepPartial<LoanApplication>): Promise<ILoanApplication> {
    this.logger.debug('create: Creating loan application:', data);
    const loanApplication = await this.data.loanApplications.insertWithResult(data);
    if (!loanApplication) throw new EntityFailedToUpdateException('Failed to create Loan application');
    return loanApplication;
  }

  async updateLoanApplication(id: string, data: DeepPartial<LoanApplication>): Promise<boolean> {
    this.logger.debug(`update: Updating loan application ${id}:`, data);
    const loanApplication = await this.data.loanApplications.update(id, data);
    if (!loanApplication) throw new EntityFailedToUpdateException('Failed to update Loan application');
    return loanApplication;
  }
}
