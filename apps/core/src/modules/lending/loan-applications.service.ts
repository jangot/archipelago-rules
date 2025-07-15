import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanApplicationRequestDto } from '@core/modules/lending/dto/request';
import { LoanApplicationResponseDto } from '@core/modules/lending/dto/response';
import { LoanApplicationStatusCodes } from '@library/entity/enum';
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

  /**
   * Retrieves a loan application by its ID.
   * Throws EntityNotFoundException if not found.
   *
   * @param id - The ID of the loan application
   * @returns Promise<LoanApplicationResponseDto | null> - The loan application DTO or null
   */
  public async getLoanApplicationById(id: string): Promise<LoanApplicationResponseDto | null> {
    const result = await this.domainServices.loanServices.getLoanApplicationById(id);

    if (!result) throw new EntityNotFoundException(`Loan application: ${id} not found`);

    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  /**
   * Creates a new loan application for the specified user.
   * Throws EntityFailedToUpdateException if creation fails.
   *
   * @param userId - The ID of the user creating the application
   * @param data - Partial loan application request DTO
   * @returns Promise<LoanApplicationResponseDto | null> - The created loan application DTO or null
   */
  public async createLoanApplication(userId: string, data: Partial<LoanApplicationRequestDto>): Promise<LoanApplicationResponseDto | null> {
    this.logger.debug('create: Creating loan application:', data);

    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    loanApplicationInput.borrowerId = userId;
    const result = await this.domainServices.loanServices.createLoanApplication(loanApplicationInput);

    if (!result) throw new EntityFailedToUpdateException('Failed to create Loan application');

    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  /**
   * Updates an existing loan application for the specified user.
   * Validates user authorization and throws if not authorized or update fails.
   *
   * @param userId - The ID of the user updating the application
   * @param id - The ID of the loan application
   * @param data - Partial loan application request DTO
   * @returns Promise<LoanApplicationResponseDto | null> - The updated loan application DTO or null
   */
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


  /**
   * Sends the loan application to the lender by updating its status to 'sent_to_lender'.
   * Validates that the loan application exists, and throws if not found.
   *
   * @param userId - The user performing the action
   * @param id - The loan application ID
   * @returns Promise<LoanApplicationResponseDto | null> - The loan application DTO or null
   */
  public async sendToLender(userId: string, id: string): Promise<LoanApplicationResponseDto | null> {
    this.logger.debug(`sendToLender: Sending loan application ${id} to lender`);

    await this.validateApplicationLoanUser(id, userId);

    const status = LoanApplicationStatusCodes.SentToLender;
    const result = await this.domainServices.loanServices.updateLoanApplication(id, { status });

    if (!result) throw new EntityFailedToUpdateException('Failed to send Loan application to lender');

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
