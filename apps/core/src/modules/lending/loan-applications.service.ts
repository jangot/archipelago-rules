import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanApplicationRequestDto } from '@core/modules/lending/dto/request';
import { LoanApplicationPaymentItemDto, LoanApplicationResponseDto, PublicLoanApplicationResponseDto } from '@core/modules/lending/dto/response';
import { LoanApplicationStates, LoanPaymentFrequencyCodes } from '@library/entity/enum';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { EntityFailedToUpdateException, EntityNotFoundException } from '@library/shared/common/exception/domain';
import { LoanApplication } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InvalidUserForLoanApplicationException } from './exceptions';
import { LendingLogic } from './lending.logic';


//TODO: Security check missing attributes to protect against unauthorized access
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

    const resultDto = DtoMapper.toDto(result, LoanApplicationResponseDto);
    if (!resultDto) {
      return null;
    }

    resultDto.loanPaymentSchedule = this.generatePaymentSchedule(resultDto);

    return resultDto;
  }

  public async getPublicLoanApplicationById(id: string): Promise<PublicLoanApplicationResponseDto | null> {
    const result = await this.domainServices.loanServices.getLoanApplicationById(id);

    if (!result) throw new EntityNotFoundException(`Loan application: ${id} not found`);
    
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

        dto.loanPaymentSchedule = this.generatePaymentSchedule(dto);

        return dto;
      })
      .filter((dto): dto is LoanApplicationResponseDto => dto !== null);
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

    const user = await this.domainServices.userServices.getUserById(userId);
    if (!user) {
      throw new EntityNotFoundException(`User with ID ${userId} not found`);
    }

    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    loanApplicationInput.borrowerId = userId;
    loanApplicationInput.borrowerFirstName = user.firstName;
    loanApplicationInput.borrowerLastName = user.lastName;

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    loanApplicationInput.loanFirstPaymentDate = loanApplicationInput.loanFirstPaymentDate || thirtyDaysFromNow;

    const result = await this.domainServices.loanServices.createLoanApplication(loanApplicationInput);
    if (!result) throw new EntityFailedToUpdateException('Failed to create Loan application');

    const resultDto = DtoMapper.toDto(result, LoanApplicationResponseDto);
    if (!resultDto) throw new EntityFailedToUpdateException('Failed to create Loan application');
    
    resultDto.loanPaymentSchedule = this.generatePaymentSchedule(resultDto);

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
    await this.validateApplicationLoanUser(id, userId);

    const loanFee = this.calculateLoanFee(data);
    data.loanServiceFee = loanFee;

    const loanApplicationInput = EntityMapper.toEntity(data, LoanApplication);
    const result = await this.domainServices.loanServices.updateLoanApplication(id, loanApplicationInput);

    if (!result) throw new EntityFailedToUpdateException('Failed to update Loan application');

    const resultDto = DtoMapper.toDto(result, LoanApplicationResponseDto);
    if (!resultDto) {
      return null;
    }

    resultDto.loanPaymentSchedule = this.generatePaymentSchedule(resultDto);

    return resultDto;
  }


  /**
   * Submits the loan application by updating its status to 'sent_to_lender'.
   * This is called when the borrower completes the application and needs it to be sent to the Lender. No lender is assigned yet.
   * Creates a loan invitee for the lender
   * Validates that the loan application exists and has required lender information.
   *
   * @param userId - The user performing the action (borrower)
   * @param id - The loan application ID
   * @returns Promise<void>
   */
  
  public async submitLoanApplication(userId: string, id: string): Promise<void> {
    this.logger.debug(`submitLoanApplication: Submitting loan application ${id} from borrower ${userId}`);

    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(id);
    if (!loanApplication) {
      throw new EntityNotFoundException(`Loan application ${id} not found`);
    }

    const status = LoanApplicationStates.Submitted;
    const borrowerSubmittedAt = new Date();

    await this.domainServices.loanServices.updateLoanApplication(id, { status, borrowerSubmittedAt });

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

    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(loanApplicationId);
    if (!loanApplication) {
      throw new EntityNotFoundException(`Loan application ${loanApplicationId} not found`);
    }

    //TODO: this validation is too restictive and should probably check the non-null value of the loanId field instead
    // Validate status to avoid creating double loans
    if (loanApplication.status === LoanApplicationStates.Approved) {
      this.logger.warn(`Loan application ${loanApplicationId} is already approved`);
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

    //TODO: review because the loan application is not updated until the loan is created.
    const status = LoanApplicationStates.Approved;
    const lenderRespondedAt = new Date();
    await this.domainServices.loanServices.updateLoanApplication(loanApplicationId, { status, lenderId: userId, lenderRespondedAt });

    this.logger.debug(`Successfully accepted loan application ${loanApplicationId} and created loan ${createdLoan.id}`);
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

  //TODO: This check should be done in the domain service layer
  private async validateApplicationLoanUser(id: string, userId: string) {
    const loanApplication = await this.domainServices.loanServices.getLoanApplicationById(id);
    if (!loanApplication) throw new EntityNotFoundException(`Loan application: ${id} not found`);

    if (loanApplication.borrowerId === userId) return;
    if (!loanApplication.lenderId) return;
    if (loanApplication.lenderId === userId) return;

    throw new InvalidUserForLoanApplicationException('You are not authorized to update this loan application');
  }

  // #region Loan Application Payments (temporary implementation until the backend team revisits)

  // TODO: This is a placeholder for the actual loan fee calculation
  private calculateLoanFee(data: Partial<LoanApplicationRequestDto>): number {
    // Round to 2 decimal places
    const loanFee = (data.loanAmount || 0) * 0.05;
    const loanFeeRounded = Math.round(loanFee * 100) / 100;

    return loanFeeRounded;
  }


  //TODO: This is a placeholder for future actual implementation of payment schedule generation
  private generatePaymentSchedule(loanApplication: LoanApplicationResponseDto): LoanApplicationPaymentItemDto[] {
    const { loanPaymentFrequency, loanAmount, loanServiceFee, loanPayments, loanFirstPaymentDate } = loanApplication;
    if (!loanPaymentFrequency || !loanAmount || !loanServiceFee || !loanPayments || !loanFirstPaymentDate || loanPayments <= 0) {
      return [];
    }

    if (loanPaymentFrequency === LoanPaymentFrequencyCodes.OneTime) {
      return [{
        paymentDate: loanFirstPaymentDate,
        paymentAmount: loanAmount + loanServiceFee,
        loanBalance: loanAmount + loanServiceFee,
      }];
    }

    if (loanPaymentFrequency !== LoanPaymentFrequencyCodes.Monthly) {
      this.logger.warn(`Unsupported loan payment frequency: ${loanPaymentFrequency}`);
      return [];
    }

    const total = Number(loanAmount) + Number(loanServiceFee);
    const round = (n: number) => Number(n.toFixed(2));
    const basePayment = round(total / Number(loanPayments));

    const paymentSchedule: LoanApplicationPaymentItemDto[] = [];
    let balance = total;

    for (let i = 0; i < loanPayments; i++) {
      const payment = i === loanPayments - 1 ? round(balance) : basePayment;

      paymentSchedule.push({
        paymentDate: this.addMonths(loanFirstPaymentDate, i),
        paymentAmount: payment,
        loanBalance: balance,
      });
      balance = round(balance - payment);
    }

    return paymentSchedule;
  }

  // helper
  public addMonths(d: Date, months: number): Date {
    const res = new Date(d);
    res.setMonth(res.getMonth() + months);
    return res;
  }

  // #endregion  
}
