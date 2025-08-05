import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanApplicationRequestDto } from '@core/modules/lending/dto/request';
import { LoanApplicationPaymentItemDto, LoanApplicationResponseDto, PublicLoanApplicationResponseDto } from '@core/modules/lending/dto/response';
import { LoanApplicationAllowanceValidation as AllowanceValidation, ContactType, LoanApplicationAllowanceValidationType, LoanApplicationStates, LoanApplicationValidationRejectType, LoanFeeModeCodes, LoanPaymentFrequency, LoanPaymentFrequencyCodes, LoanApplicationValidationRejectTypes as RejectionMessage } from '@library/entity/enum';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { EntityFailedToUpdateException, EntityNotFoundException, MissingInputException } from '@library/shared/common/exception/domain';
import { LoanApplication } from '@library/shared/domain/entity';
import { ScheduleService } from '@library/shared/service';
import { PlanPreviewOutputItem } from '@library/shared/type/lending';
import { Injectable, Logger } from '@nestjs/common';
import { addDays } from 'date-fns';
import { InvalidUserForLoanApplicationException } from './exceptions';
import { LendingLogic } from './lending.logic';
import { LoansService } from './loans.service';


//TODO: Security check missing attributes to protect against unauthorized access
@Injectable()
export class LoanApplicationsService {
  private readonly logger: Logger = new Logger(LoanApplicationsService.name);

  constructor(
    private readonly domainServices: IDomainServices,
    private readonly loanService: LoansService
  ) {}

  /**
   * Retrieves a loan application by its ID.
   * Throws EntityNotFoundException if not found.
   *
   * @param id - The ID of the loan application
   * @returns Promise<LoanApplicationResponseDto | null> - The loan application DTO or null
   */
  public async getLoanApplicationById(id: string, userId: string): Promise<LoanApplicationResponseDto | null> {
    const result = await this.getLoanApplication(id, userId);

    const resultDto = DtoMapper.toDto(result, LoanApplicationResponseDto);
    if (!resultDto) {
      return null;
    }

    resultDto.loanPaymentSchedule = this.previewLoanApplicationPayments(resultDto);

    return resultDto;
  }

  public async getPublicLoanApplicationById(id: string): Promise<PublicLoanApplicationResponseDto | null> {
    const result = await this.getLoanApplication(id, null, AllowanceValidation.Skip, RejectionMessage.View);

    return DtoMapper.toDto(result, PublicLoanApplicationResponseDto);
  }

  public async getAllLoanApplicationsByUserId(userId: string): Promise<LoanApplicationResponseDto[]> {
    this.logger.debug(`getAllLoanApplications: Getting all loan applications for user ID: ${userId}`);

    const result = await this.domainServices.loanServices.getAllLoanApplicationsByUserId(userId);

    return result.map((r) => DtoMapper.toDto(r, LoanApplicationResponseDto)).filter((dto) => dto !== null);
  }

  public async getPendingLoanApplicationsByUserId(userId: string): Promise<LoanApplicationResponseDto[]> {
    this.logger.debug(`getPendingLoanApplicationsByUserId: Getting pending loan applications for user ID: ${userId}`);

    const result = await this.domainServices.loanServices.getPendingLoanApplicationsByUserId(userId);

    return result
      .map((app) => {
        const dto = DtoMapper.toDto(app, LoanApplicationResponseDto);
        if (!dto) {
          return null;
        }

        dto.loanPaymentSchedule = this.previewLoanApplicationPayments(dto);

        return dto;
      })
      .filter((dto): dto is LoanApplicationResponseDto => dto !== null);
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

    const user = await this.domainServices.userServices.getUserById(userId);
    if (!user) {
      throw new EntityNotFoundException(`User with ID ${userId} not found`);
    }

    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    loanApplicationInput.borrowerId = userId;
    loanApplicationInput.borrowerFirstName = user.firstName;
    loanApplicationInput.borrowerLastName = user.lastName;

    loanApplicationInput.loanFirstPaymentDate = this.getFirstPaymentDate(loanApplicationInput.loanFirstPaymentDate);

    const result = await this.domainServices.loanServices.createLoanApplication(loanApplicationInput);
    if (!result) throw new EntityFailedToUpdateException('Failed to create Loan application');

    const resultDto = DtoMapper.toDto(result, LoanApplicationResponseDto);
    if (!resultDto) throw new EntityFailedToUpdateException('Failed to create Loan application');
    
    resultDto.loanPaymentSchedule = this.previewLoanApplicationPayments(resultDto);

    return resultDto;
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
    await this.getLoanApplication(id, userId, AllowanceValidation.Any, RejectionMessage.Update);

    const { loanAmount } = data;
    const loanFee = loanAmount ? ScheduleService.previewFeeAmount(loanAmount) : 0;
    data.loanServiceFee = loanFee;

    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    const result = await this.domainServices.loanServices.updateLoanApplication(id, loanApplicationInput);

    if (!result) throw new EntityFailedToUpdateException('Failed to update Loan application');

    const resultDto = DtoMapper.toDto(result, LoanApplicationResponseDto);
    if (!resultDto) {
      return null;
    }

    resultDto.loanPaymentSchedule = this.previewLoanApplicationPayments(resultDto);

    return resultDto;
  }


  /**
   * Submits the loan application by updating its status to 'sent_to_lender'.
   * Creates a loan invitee for the lender and attempts to assign them to the loan application.
   * Validates that the loan application exists and has required lender information.
   *
   * @param userId - The user performing the action (borrower)
   * @param id - The loan application ID
   * @returns Promise<void>
   * 
   * @remarks
   * This method is called when the borrower completes the application and should send to the Lender. No lender is assigned yet.
   */
  public async submitLoanApplication(userId: string, id: string): Promise<void> {
    this.logger.debug(`submitLoanApplication: Submitting loan application ${id}`);

    const loanApplication = await this.getLoanApplication(id, userId, AllowanceValidation.Borrower, RejectionMessage.Submit);

    const { lenderEmail, lenderFirstName } = loanApplication;
    
    if (!lenderEmail || !lenderFirstName) {
      throw new MissingInputException('Lender information is required to submit loan application');
    }

    // The lender may or may not have a Zirtue account yet... regardless, we just need to send a notification to the lender
    const lenderUser = await this.domainServices.userServices.getUserByContact(lenderEmail, ContactType.EMAIL);
    const status = LoanApplicationStates.Submitted;
    const borrowerSubmittedAt = new Date();
    if (lenderUser && lenderUser.id) {
      this.logger.debug(`Lender with email ${lenderEmail} was found. Will assign lenderId now.`);
      await this.domainServices.loanServices.updateLoanApplication(id, { lenderId: lenderUser.id, status, borrowerSubmittedAt });
    } else {
      // Assign lenderId once the lender creates/authenticates a Zirtue account
      this.logger.debug(`Lender with email ${lenderEmail} not found. Will assign lenderId after registration.`);
      await this.domainServices.loanServices.updateLoanApplication(id, { status, borrowerSubmittedAt });
    }

    // TODO: Queue notification to send email to the lender
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

    const loanApplication = await this.getLoanApplication(loanApplicationId, userId, AllowanceValidation.Lender, RejectionMessage.Accept);

    // Validate status to avoid creating double loans
    if (loanApplication.status === LoanApplicationStates.Approved) {
      this.logger.warn(`Loan application ${loanApplicationId} is already approved`);
      // TODO: New Exception class here. It is not User error
      throw new InvalidUserForLoanApplicationException('This loan application has already been accepted');
    }

    LendingLogic.validateLoanApplicationForAcceptance(loanApplication);
    const createdLoan = await this.domainServices.loanServices.acceptLoanApplication(loanApplicationId, userId);
    if (!createdLoan) {
      this.logger.error(`Failed to create loan from application ${loanApplicationId}`);
      throw new EntityFailedToUpdateException('Failed to create loan from application');
    }

    const { id: loanId, state: loanState } = createdLoan;

    const status = LoanApplicationStates.Approved;
    await this.domainServices.loanServices.updateLoanApplication(loanApplicationId, { status, lenderId: userId });

    this.logger.debug(`Successfully accepted loan application ${loanApplicationId} and created loan ${loanId}`);

    // Immediately advance the loan to the next state
    const advanceResult = await this.loanService.advanceLoan(loanId, loanState);
    if (!advanceResult) {
      this.logger.error(`Failed to advance loan ${loanId} to the next state after acceptance`);
    } else {
      this.logger.debug(`Successfully advanced loan ${loanId} to the next state after acceptance`);
    }
  }

  /**
   * Rejects a loan application by updating its status to 'rejected'.
   * Validates that the user is authorized to perform the action.
   *
   * @param userId - The user performing the action
   * @param loanApplicationId - The loan application ID
   * @returns Promise<void>
   */
  public async rejectLoanApplication(userId: string, loanApplicationId: string): Promise<void> {
    this.logger.debug(`rejectLoanApplication: Rejecting loan application ${loanApplicationId}`);

    await this.getLoanApplication(loanApplicationId, userId, AllowanceValidation.Lender, RejectionMessage.Reject);
    
    const status = LoanApplicationStates.Rejected;

    const result = await this.domainServices.loanServices.updateLoanApplication(loanApplicationId, { status, lenderId: userId });
    if (!result) {
      throw new EntityFailedToUpdateException('Failed to reject Loan application');
    }

    this.logger.debug(`Successfully rejected loan application ${loanApplicationId}`);
  }

  /**
   * Cancels a loan application by updating its status to 'cancelled'.
   * Validates that the user is authorized to perform the action.
   *
   * @param userId - The user performing the action
   * @param loanApplicationId - The loan application ID
   * @returns Promise<void>
   */
  public async cancelLoanApplication(userId: string, loanApplicationId: string): Promise<void> {
    this.logger.debug(`cancelLoanApplication: Cancelling loan application ${loanApplicationId}`);
    await this.getLoanApplication(loanApplicationId, userId, AllowanceValidation.Borrower, RejectionMessage.Cancel);

    const status = LoanApplicationStates.Cancelled;

    const result = await this.domainServices.loanServices.updateLoanApplication(loanApplicationId, { status });
    if (!result) {
      throw new EntityFailedToUpdateException('Failed to cancel Loan application');
    }
    this.logger.debug(`Successfully cancelled loan application ${loanApplicationId}`);
  } 

  // #region Loan Application Payments (temporary implementation until the backend team revisits)

  private previewLoanApplicationPayments(input: LoanApplicationResponseDto): LoanApplicationPaymentItemDto[] {
    const repaymentStartFallback = addDays(new Date(), 30);
    const preview = ScheduleService.previewApplicationPlan({
      amount: input.loanAmount || 0,
      paymentsCount: input.loanPayments || 0,
      paymentFrequency: (input.loanPaymentFrequency as LoanPaymentFrequency) || LoanPaymentFrequencyCodes.Monthly,
      feeAmount: input.loanServiceFee,
      feeMode: LoanFeeModeCodes.Standard,
      repaymentStartDate: input.loanFirstPaymentDate || repaymentStartFallback,
    });
    return this.mapPaymentsPreviewToDto(preview);
  }

  private mapPaymentsPreviewToDto(payments: PlanPreviewOutputItem[]): LoanApplicationPaymentItemDto[] { 
    return payments
      .map((p) => ({
        paymentDate: p.paymentDate,
        paymentAmount: p.amount + p.feeAmount,
        loanBalance: p.endingBalance,
      }))
      .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
  }

  /**
   * Gets the first payment date for the loan application.
   * If no date is provided, defaults to 30 days from now.
   */
  private getFirstPaymentDate(date: Date | null): Date {
    if (date) return date;

    // Default to 30 days from now 
    return addDays(new Date(), 30); 
  }

  // #endregion  

  /**
   * Retrieves a loan application by its ID and validates the user's allowance.
   * Throws exceptions if the application is not found or if the user is not allowed to access it.
   *
   * @param applicationId - The ID of the loan application
   * @param userId - The ID of the user (borrower or lender)
   * @param allowance - The type of allowance validation to perform
   * @param intent - The intent for which the validation is being performed
   * @returns Promise<LoanApplication> - The loan application entity
   */
  private async getLoanApplication(
    applicationId: string,
    userId: string | null,
    allowance: LoanApplicationAllowanceValidationType = AllowanceValidation.Any,
    intent: LoanApplicationValidationRejectType = RejectionMessage.View
  ): Promise<LoanApplication> {
    
    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(applicationId);

    this.domainServices.loanServices.validateLoanApplicationAllowance(
      loanApplication,
      userId,
      allowance,
      intent
    );

    return loanApplication;
  }
}
