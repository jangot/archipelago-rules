import { CoreDataService } from '@core/modules/data';
import { InvalidUserForLoanApplicationException } from '@core/modules/lending/exceptions';
import {
  LoanAllowanceValidation,
  LoanApplicationAllowanceValidationType,
  LoanApplicationValidationRejectType,
  LoanPaymentFrequency,
  LoanPaymentStateCodes,
  LoanPaymentTypeCodes,
  LoanState,
} from '@library/entity/enum';
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { EntityFailedToUpdateException, EntityNotFoundException } from '@library/shared/common/exception/domain';
import { Loan, LoanApplication } from '@library/shared/domain/entity';
import { LOAN_RELATIONS, LoanRelation } from '@library/shared/domain/entity/relation';
import { LoanStateChangedEvent, LoanStateSteppedEvent } from '@library/shared/events';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPublisherService } from 'libs/shared/src/modules/event';

@Injectable()
export class LoanDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(LoanDomainService.name);

  constructor(
    protected readonly data: CoreDataService,
    protected readonly config: ConfigService,
    protected readonly eventManager: EventPublisherService,
  ) {
    super(data);
  }

  // #region Loan
  public async getLoanById(loanId: string, relations?: LoanRelation[]): Promise<Loan | null> {
    return this.data.loans.getLoanById(loanId, relations);
  }

  public async createLoan(loan: Partial<Loan>): Promise<Loan | null> {
    const createdLoan = await this.data.loans.createLoan(loan);
    if (!createdLoan) throw new EntityFailedToUpdateException('Failed to create Loan');

    return createdLoan;
  }

  public async updateLoan(loanId: string, loan: Partial<Loan>): Promise<boolean | null> {
    return this.data.loans.update(loanId, loan);
  }

  /**
   * Calculates and refreshes the repayment amounts left for a given loan.
   * This method computes the principal and fee amounts left based on completed repayments
   * and updates the loan entity accordingly.
   * @param loanId - The unique identifier of the loan for which to refresh repayment amounts left
   * @returns Boolean indicating success or null if no payments were found
   * @throws {EntityFailedToUpdateException} When the loan is not found or calculated amounts left are negative
   */
  public async refreshRepaymentAmountsLeft(loanId: string): Promise<boolean | null> {
    this.logger.debug(`refreshRepaymentAmountsLeft: Refreshing repayment amounts for loan ${loanId}`);
    const loan = await this.getLoanById(loanId, [LOAN_RELATIONS.Payments]);
    if (!loan) {
      this.logger.error(`Loan with ID ${loanId} not found for repayment amounts refresh`);
      throw new EntityFailedToUpdateException('Loan not found for repayment amounts refresh');
    }

    const { payments, amount, feeAmount, principalAmountLeft, feeAmountLeft } = loan;
    if (!payments || payments.length === 0) {
      this.logger.warn(`No payments found for loan ${loanId}, skipping repayment amounts refresh`);
      return false; // No payments to refresh
    }

    // Calculate principal and fee amounts left
    const completedRepayments = payments.filter(
      payment =>
        payment.type === LoanPaymentTypeCodes.Repayment &&
        payment.state === LoanPaymentStateCodes.Completed
    );
    if (!completedRepayments || !completedRepayments.length) {
      this.logger.warn(`No completed repayments found for loan ${loanId}, skipping repayment amounts refresh`);
      return false; // No completed repayments to refresh
    }
    const principalPaid = completedRepayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const feePaid = completedRepayments.reduce((sum, payment) => sum + (payment.feeAmount || 0), 0);

    const newPrincipalAmountLeft = amount - principalPaid;
    const newFeeAmountLeft = feeAmount - feePaid;

    if (newPrincipalAmountLeft < 0 || newFeeAmountLeft < 0) {
      this.logger.error(`Calculated amounts left for loan ${loanId} are negative: principalLeft=${newPrincipalAmountLeft}, feeLeft=${newFeeAmountLeft}`);
      throw new EntityFailedToUpdateException('Calculated amounts left are negative');
    }

    if (newPrincipalAmountLeft === principalAmountLeft && newFeeAmountLeft === feeAmountLeft) {
      this.logger.debug(`No changes in amounts left for loan ${loanId}, skipping update`);
      return false; // No changes needed
    }

    this.logger.debug(`Calculated amounts left for loan ${loanId}: principalLeft=${newPrincipalAmountLeft}, feeLeft=${newFeeAmountLeft}`);
    // Update the loan with new amounts left
    return this.data.loans.update(loanId, { principalAmountLeft: newPrincipalAmountLeft, feeAmountLeft: newFeeAmountLeft });
  }


  /**
   * Updates the state of a loan from one state to another and fires a corresponding event.
   * This is an explicit function for loan state changes that ensures proper event propagation
   * when a loan transitions between states.
   *
   * @param loanId - The unique identifier of the loan to update
   * @param oldState - The current state of the loan before the update
   * @param newState - The desired new state for the loan
   * @returns Promise that resolves to true if update was successful, false if no change was needed, or null on failure
   * @throws {EntityFailedToUpdateException} When the loan state update operation fails
   *
   * @remarks
   * - If oldState equals newState, the function returns false without making changes
   * - Successfully fires a LoanStateChangedEvent after updating the loan state
   */
  public async updateLoanState(loanId: string, oldState: LoanState, newState: LoanState): Promise<boolean | null> {
    this.logger.debug(`updateLoanState: Updating loan ${loanId} from state ${oldState} to ${newState}`);

    if (oldState === newState) {
      this.logger.warn(`Loan ${loanId} is already in state ${newState}`);
      return false; // No change needed
    }

    // TODO: possibly will require add some timestamps for specific states transitions
    const updated = await this.data.loans.update(loanId, { state: newState });
    if (!updated) {
      this.logger.error(`Failed to update loan ${loanId} to state ${newState}`);
      throw new EntityFailedToUpdateException('Failed to update loan state');
    }

    await this.eventManager.publish(LoanStateChangedEvent.create(loanId, oldState, newState));

    this.logger.debug(`Successfully updated loan ${loanId} to state ${newState}`);
    return true;
  }

  /**
   * Notifies that a loan has stepped in its current state, such as moving to the next repayment payment.
   * This method is used to indicate that a loan has progressed within the same state without changing
   * the overall state of the loan.
   *
   * @param loanId - The unique identifier of the loan that stepped in state
   * @param state - The current state of the loan after stepping
   * @returns Promise that resolves to true if notification was successful, false if no change was needed, or null on failure
   */
  public async notifyLoanStateStepped(loanId: string, state: LoanState): Promise<boolean | null> {
    this.logger.debug(`notifyLoanStateStepped: Notifying that loan ${loanId} stepped in state ${state}`);
    return this.eventManager.publish(LoanStateSteppedEvent.create(loanId, state));
  }

  public async acceptLoanApplication(loanApplicationId: string, userId: string): Promise<Loan | null> {
    this.logger.debug(`acceptLoanApplication: Accepting loan application ${loanApplicationId} by user ${userId}`);

    const loanApplication = await this.getLoanApplicationById(loanApplicationId);

    // Create loan from loan application data
    const loanData: Partial<Loan> = {
      amount: loanApplication!.loanAmount!,
      type: loanApplication!.loanType!,
      lenderId: loanApplication!.lenderId,
      borrowerId: loanApplication!.borrowerId,
      relationship: loanApplication!.lenderRelationship,
      note: loanApplication!.lenderNote,
      billerId: loanApplication!.billerId,
      billingAccountNumber: loanApplication!.billAccountNumber,
      paymentsCount: loanApplication!.loanPayments!,
      paymentFrequency: loanApplication!.loanPaymentFrequency as LoanPaymentFrequency,
      feeAmount: loanApplication!.loanServiceFee || 0,
      lenderAccountId: loanApplication!.lenderPaymentAccountId,
      borrowerAccountId: loanApplication!.borrowerPaymentAccountId,
    };

    // Create the loan
    const createdLoan = await this.createLoan(loanData);
    if (!createdLoan) {
      this.logger.error(`Failed to create loan from application ${loanApplicationId}`);
      throw new EntityFailedToUpdateException('Failed to create loan from application');
    }

    this.logger.debug(`Successfully created loan ${createdLoan.id} from application ${loanApplicationId}`);
    return createdLoan;
  }
  // #endregion

  // #region Loan Application
  public async getLoanApplicationById(id: string): Promise<LoanApplication> {
    const result = await this.data.loanApplications.getById(id);
    
    if (!result) throw new EntityNotFoundException(`Loan application: ${id} not found`);

    return result;
  }

  public async getAllLoanApplicationsByUserId(userId: string): Promise<LoanApplication[]> {
    return this.data.loanApplications.getAllByUserId(userId);
  }

  public async getPendingLoanApplicationsByUserId(userId: string): Promise<LoanApplication[]> {
    return this.data.loanApplications.getPendingLoanApplicationsByUserId(userId);
  }

  public async createLoanApplication(data: Partial<LoanApplication>): Promise<LoanApplication> {
    return this.data.loanApplications.insertWithResult(data);
  }

  public async updateLoanApplication(id: string, data: Partial<LoanApplication>): Promise<LoanApplication | null> {
    // Prevent borrowerId from being changed for v1
    const { borrowerId, ...updateData } = data;

    if (borrowerId !== undefined) {
      this.logger.debug(`updateLoanApplication: borrowerId change attempted but ignored for loan application ${id}`);
    }

    return this.data.loanApplications.updateWithResult(id, updateData);
  }

  public validateLoanApplicationAllowance(
    application: LoanApplication,
    userId: string | null,
    allowance: LoanApplicationAllowanceValidationType,
    intent: LoanApplicationValidationRejectType
  ): void {

    const { id, lenderId, borrowerId, billerId } = application;
    let result = false;

    this.logger.debug(`validateLoanApplicationAllowance: Validating allowance for application ${id} by user ${userId} with validation type ${allowance}`);

    // If allowance validation is explicitly skipped, return true
    if (allowance === LoanAllowanceValidation.Skip) {
      this.logger.debug(`Allowance validation skipped for application ${id}`);
      return;
    }

    // If userId is not provided, we cannot validate allowance
    if (!userId) {
      this.logger.warn(`User ID is required for allowance validation but was not provided for application ${id}`);
      result =  false;
    } else {
    // Validate based on the type of allowance requested
      switch (allowance) {
        case LoanAllowanceValidation.Any:
          result = [lenderId, borrowerId, billerId].includes(userId); // Any assigned user can access
          break;

        case LoanAllowanceValidation.Borrower:
          result = borrowerId === userId;
          break;
        case LoanAllowanceValidation.Lender:
          result = lenderId === userId;
          break;

        default:
          this.logger.error(`Unknown allowance validation type: ${allowance}`);
          result =  false;
      }    
    }

    if (!result) {
      this.logger.warn(`User ${userId} does not have permission to ${intent} loan application ${id} with allowance type ${allowance}`);
      throw new InvalidUserForLoanApplicationException(intent);
    }
  }
  // #endregion
}
