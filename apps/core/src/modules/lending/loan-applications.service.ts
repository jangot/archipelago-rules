import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanApplicationRequestDto } from '@core/modules/lending/dto/request';
import { LoanApplicationPaymentItemDto, LoanApplicationResponseDto, PublicLoanApplicationResponseDto } from '@core/modules/lending/dto/response';
import { LoanApplicationUserAssignmentValidation as AssignmentValidation, ContactType, LoanApplicationStates, LoanApplicationUserAssignmentValidationType, LoanApplicationValidationRejectType, LoanFeeModeCodes, LoanPaymentFrequency, LoanPaymentFrequencyCodes, LoanApplicationValidationRejectTypes as RejectionMessage } from '@library/entity/enum';
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
    const result = await this.getLoanApplication(id, null, AssignmentValidation.Skip, RejectionMessage.View);

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
    await this.getLoanApplication(id, userId, AssignmentValidation.Any, RejectionMessage.Update);

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
   * Submits the loan application.
   * This is called when the borrower completes the application and needs it to be sent to the Lender.
   * Validates the loan application exists and has required lender information.
   *
   * @param userId - The user performing the action (borrower)
   * @param id - The loan application ID
   * @returns Promise<void>
   * 
   * @remarks
   * This method is only called by the borrower when they complete the application and need it to be sent to the Lender.
   */
  /*

    await this.domainServices.loanServices.updateLoanApplication(id, { status, borrowerSubmittedAt });

  */
  public async submitLoanApplication(userId: string, id: string): Promise<void> {
    this.logger.debug(`submitLoanApplication: Submitting loan application ${id} from borrower ${userId}`);

    const loanApplication = await this.getLoanApplication(id, userId, AssignmentValidation.Borrower, RejectionMessage.Submit);

    const { lenderEmail, lenderFirstName } = loanApplication;

    if (!lenderEmail || !lenderFirstName) {
      throw new MissingInputException('Lender information is required to submit loan application');
    }

    // The lender may or may not have a Zirtue account yet... regardless, we just need to send a notification to the lender
    const lenderUser = await this.domainServices.userServices.getUserByContact(lenderEmail, ContactType.EMAIL);

    const status = LoanApplicationStates.Submitted;
    const lenderId = lenderUser ? lenderUser.id : null;
    const borrowerSubmittedAt = new Date();

    if (lenderUser && lenderUser.id) {
      this.logger.debug(`Lender with email ${lenderEmail} was found. Will assign lenderId now.`);
    } else {
      // lenderId will be assigned when the lender accepts or rejects the loan application
      this.logger.debug(`Lender with email ${lenderEmail} not found. Will assign lenderId after registration.`);
    }

    await this.domainServices.loanServices.updateLoanApplication(id, { status, borrowerSubmittedAt, lenderId });

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

    const loanApplication = await this.getLoanApplication(loanApplicationId, userId, AssignmentValidation.Lender, RejectionMessage.Accept);

    // If the lenderId has already been set by the loan application submission because the lender already has a Zirtue account, let's make sure they match.
    if (loanApplication.lenderId && loanApplication.lenderId !== userId) {
      this.logger.warn(`User ${userId} is not authorized to accept loan application ${loanApplicationId}`);
      throw new InvalidUserForLoanApplicationException('You are not authorized to accept this loan application');
    }

    //TODO: this validation might be too simplistic and could be check through a non-null value of the loanId field instead
    // Validate status to avoid creating double loans
    if (loanApplication.status === LoanApplicationStates.Approved) {
      this.logger.warn(`Loan application ${loanApplicationId} is already approved`);
      // TODO: New Exception class here. It is not User error
      throw new InvalidUserForLoanApplicationException('This loan application has already been accepted');
    }

    //TODO: Need to talk about the expectation of when the lenderId is set
    loanApplication.lenderId = userId;

    //TODO: Setting a non null value of the following fields to pass the validation. Needs to be removed once we get paymentId's working
    loanApplication.lenderPaymentAccountId = loanApplication.lenderPaymentAccountId || 'placeholder';
    loanApplication.borrowerPaymentAccountId = loanApplication.borrowerPaymentAccountId || 'placeholder';

    LendingLogic.validateLoanApplicationForAcceptance(loanApplication);
    const createdLoan = await this.domainServices.loanServices.acceptLoanApplication(loanApplicationId, userId);
    if (!createdLoan) {
      this.logger.error(`Failed to create loan from application ${loanApplicationId}`);
      throw new EntityFailedToUpdateException('Failed to create loan from application');
    }

    const { id: loanId, state: loanState } = createdLoan;

    const status = LoanApplicationStates.Approved;
    const lenderRespondedAt = new Date();
    const lenderId = userId; // The lender is the user accepting the loan application

    await this.domainServices.loanServices.updateLoanApplication(loanApplicationId, { status, lenderId, lenderRespondedAt, loanId });

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

    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(loanApplicationId);
    if (!loanApplication) {
      throw new EntityNotFoundException(`Loan application ${loanApplicationId} not found`);
    }


    await this.getLoanApplication(loanApplicationId, userId, AssignmentValidation.Lender, RejectionMessage.Reject);
    
    const status = LoanApplicationStates.Rejected;
    const lenderRespondedAt = new Date();
    const result = await this.domainServices.loanServices.updateLoanApplication(loanApplicationId, { status, lenderId: userId, lenderRespondedAt });
    if (!result) {
      throw new EntityFailedToUpdateException('Failed to reject Loan application');
    }

    this.logger.debug(`Successfully rejected loan application ${loanApplicationId}`);

    //TODO: review to see if we need to notify anyone
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
    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(loanApplicationId);
    if (!loanApplication) {
      throw new EntityNotFoundException(`Loan application ${loanApplicationId} not found`);
    }

    if (loanApplication.borrowerId !== userId) {
      throw new InvalidUserForLoanApplicationException('Only the borrower can cancel the loan application');
    }

    const status = LoanApplicationStates.Cancelled;
    const result = await this.domainServices.loanServices.updateLoanApplication(loanApplicationId, { status });
    if (!result) {
      throw new EntityFailedToUpdateException('Failed to cancel Loan application');
    }

    this.logger.debug(`Successfully cancelled loan application ${loanApplicationId}`);

    //TODO: generate notification to whoever needs to be told of this.
  } 

  //TODO: This check should be done in the domain service layer (Alex K deleted this method, so I'll look to delete it after I've completed the merge) 
  private async validateApplicationLoanUser(id: string, userId: string) {
    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(id);
    if (!loanApplication) throw new EntityNotFoundException(`Loan application: ${id} not found`);

    if (loanApplication.borrowerId === userId) return;
    if (!loanApplication.lenderId) return;
    if (loanApplication.lenderId === userId) return;

    throw new InvalidUserForLoanApplicationException('You are not authorized to update this loan application');
  }

  // #region Loan Application Payments
  //TODO: This is a temporary implementation until the backend team revisits the payment schedule logic.
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
   * Retrieves a loan application by its ID and validates the user's assignment.
   * Throws exceptions if the application is not found or if the user is not allowed to access it.
   *
   * @param applicationId - The ID of the loan application
   * @param userId - The ID of the user (borrower or lender)
   * @param assignment - The type of assignment validation to perform
   * @param intent - The intent for which the validation is being performed
   * @returns Promise<LoanApplication> - The loan application entity
   */
  private async getLoanApplication(
    applicationId: string,
    userId: string | null,
    assignment: LoanApplicationUserAssignmentValidationType = AssignmentValidation.Any,
    intent: LoanApplicationValidationRejectType = RejectionMessage.View
  ): Promise<LoanApplication> {
    
    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(applicationId);

    if (!loanApplication) {
      this.logger.error(`Loan application with ID ${applicationId} not found`);
      throw new EntityNotFoundException(`Loan application with ID ${applicationId} not found`);
    }

    this.domainServices.loanServices.validateLoanApplicationUserAssignment(
      loanApplication,
      userId,
      assignment,
      intent
    );

    return loanApplication;
  }
}
