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

  public async getAllLoanApplicationsByUserId(userId: string): Promise<LoanApplicationResponseDto[]> {
    this.logger.debug(`getAllLoanApplications: Getting all loan applications for user ID: ${userId}`);

    const result = await this.domainServices.loanServices.getAllLoanApplicationsByUserId(userId);

    return result.map((r) => DtoMapper.toDto(r, LoanApplicationResponseDto)).filter((dto) => dto !== null);
  }

  public async getPendingLoanApplicationsByUserId(userId: string): Promise<LoanApplicationResponseDto[]> {
    this.logger.debug(`getPendingLoanApplicationsByUserId: Getting pending loan applications for user ID: ${userId}`);

    const result = await this.domainServices.loanServices.getPendingLoanApplicationsByUserId(userId);

    return result.map((r) => DtoMapper.toDto(r, LoanApplicationResponseDto)).filter((dto) => dto !== null);
  }

  //TODO: Mike, can you review this to confirm the work is done at the right level?
  public async createLoanApplication(userId: string, data: Partial<LoanApplicationRequestDto>): Promise<LoanApplicationResponseDto | null> {
    this.logger.debug('create: Creating loan application:', data);

    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    loanApplicationInput.borrowerId = userId;
    const result = await this.domainServices.loanServices.createLoanApplication(loanApplicationInput);

    if (!result) throw new EntityFailedToUpdateException('Failed to create Loan application');

    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  public async updateLoanApplication(userId: string, id: string, data: Partial<LoanApplicationRequestDto>):
  Promise<LoanApplicationResponseDto | null> {
    this.logger.debug(`update: Updating loan application ${id}:`, data);

    // Validate that the loan application belongs to the user (as a borrower or lender)
    await this.validateApplicationLoanUser(id, userId);

    const loanFee = this.calculateLoanFee(data);
    data.loanServiceFee = loanFee;

    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    const result = await this.domainServices.loanServices.updateLoanApplication(id, loanApplicationInput);

    if (!result) throw new EntityFailedToUpdateException('Failed to update Loan application');

    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  //TODO: This is a placeholder for the loan application submission
  public async submitLoanApplication(userId: string, id: string): Promise<LoanApplicationResponseDto | null> {
    this.logger.debug(`submit: Submitting loan application ${id}`);

    //const result = await this.domainServices.loanServices.submitLoanApplication(id, userId);
    const result = await this.domainServices.loanServices.getLoanApplicationById(id);

    if (!result) throw new EntityFailedToUpdateException('Failed to submit Loan application');

    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  //TODO: This is a placeholder for the loan application accepted
  public async acceptLoanApplication(userId: string, id: string): Promise<LoanApplicationResponseDto | null> {
    this.logger.debug(`accept: Accepting loan application ${id}`);

    const result = await this.domainServices.loanServices.getLoanApplicationById(id);

    if (!result) throw new EntityFailedToUpdateException('Failed to accept Loan application');

    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  //TODO: This is a placeholder for the loan application rejected
  public async rejectLoanApplication(userId: string, id: string): Promise<LoanApplicationResponseDto | null> {
    this.logger.debug(`reject: Rejecting loan application ${id}`);

    const result = await this.domainServices.loanServices.getLoanApplicationById(id);

    if (!result) throw new EntityFailedToUpdateException('Failed to reject Loan application');

    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }
  

  // TODO: This is a placeholder for the actual loan fee calculation
  private calculateLoanFee(data: Partial<LoanApplicationRequestDto>): number {
    // Round to 2 decimal places
    const loanFee = (data.loanAmount || 0) * 0.05;
    const loanFeeRounded = Math.round(loanFee * 100) / 100;

    return loanFeeRounded;
  }

  private async validateApplicationLoanUser(id: string, userId: string) {
    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(id);
    if (!loanApplication) throw new EntityNotFoundException(`Loan application: ${id} not found`);

    if (loanApplication.borrowerId !== userId && loanApplication.lenderId !== userId)
      throw new InvalidUserForLoanApplicationException('You are not authorized to update this loan application');
  }
}
