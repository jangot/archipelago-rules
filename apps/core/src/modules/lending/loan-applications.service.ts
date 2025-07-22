import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanApplicationRequestDto } from '@core/modules/lending/dto/request';
import { LoanApplicationResponseDto } from '@core/modules/lending/dto/response';
import { ContactType, LoanApplicationStates } from '@library/entity/enum';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { EntityFailedToUpdateException, EntityNotFoundException, MissingInputException } from '@library/shared/common/exception/domain';
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
   * Submits the loan application by updating its status to 'sent_to_lender'.
   * Creates a loan invitee for the lender and attempts to assign them to the loan application.
   * Validates that the loan application exists and has required lender information.
   *
   * @param userId - The user performing the action (borrower)
   * @param id - The loan application ID
   * @returns Promise<void>
   */
  public async submitLoanApplication(userId: string, id: string): Promise<void> {
    this.logger.debug(`submitLoanApplication: Submitting loan application ${id}`);

    await this.validateApplicationLoanUser(id, userId);

    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(id);

    if (!loanApplication!.lenderEmail && !loanApplication!.lenderFirstName) {
      throw new MissingInputException('Lender information is required to submit loan application');
    }

    const lenderUser = await this.domainServices.userServices.getUserByContact(
      loanApplication!.lenderEmail!,
      ContactType.EMAIL
    );
    const status = LoanApplicationStates.Submitted;
    if (lenderUser && lenderUser.id) {
      this.logger.debug(`Lender with email ${loanApplication!.lenderEmail} was found. Will assign lenderId now.`);
      await this.domainServices.loanServices.updateLoanApplication(id, { lenderId: lenderUser.id, status });
    } else {
      // TODO: Assign lenderId once the lender creates/authenticates a Zirtue account
      this.logger.debug(`Lender with email ${loanApplication!.lenderEmail} not found. Will assign lenderId after registration.`);
      await this.domainServices.loanServices.updateLoanApplication(id, { status });
    }
    // TODO: Send email to lender
  }

  /**
   * Accepts a loan application by creating a loan from the application data.
   * Validates all required information is present before creating the loan.
   *
   * @param userId - The ID of the user accepting the application (lender)
   * @param loanApplicationId - The ID of the loan application to accept
   * @returns Promise<void>
   */
  public async acceptLoanApplication(userId: string, loanApplicationId: string): Promise<void> {
    this.logger.debug(`acceptLoanApplication: Accepting loan application ${loanApplicationId} by user ${userId}`);

    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(loanApplicationId);
    if (!loanApplication) {
      throw new EntityNotFoundException(`Loan application ${loanApplicationId} not found`);
    }

    // Validate that the user is the lender for v1
    if (loanApplication.lenderId !== userId) {
      this.logger.warn(`${userId} is not authorized to accept loan application ${loanApplicationId}`);
      throw new InvalidUserForLoanApplicationException('You are not authorized to accept this loan application');
    }

    // Validate status to avoid creating double loans
    if (loanApplication.status === LoanApplicationStates.Approved) {
      this.logger.warn(`Loan application ${loanApplicationId} is already approved`);
      throw new InvalidUserForLoanApplicationException('This loan application has already been accepted');
    }

    this.validateLoanApplicationForAcceptance(loanApplication);
    const createdLoan = await this.domainServices.loanServices.acceptLoanApplication(loanApplicationId, userId);
    if (!createdLoan) {
      this.logger.error(`Failed to create loan from application ${loanApplicationId}`);
      throw new EntityFailedToUpdateException('Failed to create loan from application');
    }
    
    const status = LoanApplicationStates.Approved;
    await this.domainServices.loanServices.updateLoanApplication(loanApplicationId, { status });

    this.logger.debug(`Successfully accepted loan application ${loanApplicationId} and created loan ${createdLoan.id}`);
  }

  private validateLoanApplicationForAcceptance(loanApplication: LoanApplication): void {
    const missingFields: string[] = [];

    // Required loan information
    if (!loanApplication.loanAmount) {
      missingFields.push('loanAmount');
    }
    if (!loanApplication.loanType) {
      missingFields.push('loanType');
    }

    // Required user information
    if (!loanApplication.lenderId) {
      missingFields.push('lenderId');
    }
    if (!loanApplication.borrowerId) {
      missingFields.push('borrowerId');
    }

    // Required payment account information
    if (!loanApplication.lenderPaymentAccountId) {
      missingFields.push('lenderPaymentAccountId');
    }
    if (!loanApplication.borrowerPaymentAccountId) {
      missingFields.push('borrowerPaymentAccountId');
    }

    // Required payments frequency
    if (!loanApplication.loanPaymentFrequency) {
      missingFields.push('loanPaymentFrequency');
    }
    if (!loanApplication.loanPayments) {
      missingFields.push('loanPayments');
    }

    // For non-personal loans, biller information is required
    if (loanApplication.loanType !== 'personal') {
      if (!loanApplication.billerId) {
        missingFields.push('billerId');
      }
      if (!loanApplication.billAccountNumber) {
        missingFields.push('billAccountNumber');
      }
    }

    if (missingFields.length > 0) {
      const errorMessage = `Loan application is missing required fields: ${missingFields.join(', ')}`;
      this.logger.error(`Validation failed for loan application ${loanApplication.id}: ${errorMessage}`);
      throw new MissingInputException(errorMessage);
    }
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
