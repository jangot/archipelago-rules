import { CoreDataService } from '@core/modules/data';
import { ActionNotAllowedException } from '@core/modules/lending/exceptions';
import { IApplicationUser, IBiller, ILoan, ILoanApplication, ILoanInvitee } from '@library/entity/entity-interface';
import { BillerTypeCodes, ContactType, LoanAssignIntent, LoanAssignIntentCodes, LoanInviteeTypeCodes, LoanStateCodes, RegistrationStatus } from '@library/entity/enum';
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { EntityFailedToUpdateException, EntityNotFoundException } from '@library/shared/common/exception/domain';
import { LoanApplication } from '@library/shared/domain/entity';
import { LOAN_INVITEE_RELATIONS, LOAN_RELATIONS, LoanRelation } from '@library/shared/domain/entity/relation';
import { LoanAssignToContactInput, LoansSetTargetUserInput, LoanTargetUserInput } from '@library/shared/type/lending';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoanDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(LoanDomainService.name);

  constructor(
    protected readonly data: CoreDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  // #region Loan
  public async getLoanById(loanId: string, relations?: LoanRelation[]): Promise<ILoan | null> {
    return this.data.loans.getLoanById(loanId, relations);
  }

  public async createLoan(loan: Partial<ILoan>): Promise<ILoan | null> {
    const createdLoan = await this.data.loans.createLoan(loan);
    if (!createdLoan) throw new EntityFailedToUpdateException('Failed to create Loan');
    
    const { id: loanId } = createdLoan;
    const invitee = loan.invitee!;
    invitee.loanId = loanId;
    const storedInvitee = await this.data.loanInvitees.create(invitee);
    // Try to set Loan target User
    const assignInput = this.mapInviteeToAssignInput(loanId, LoanAssignIntentCodes.Propose, storedInvitee);
    const assignResult = await this.setLoansTarget(assignInput);
    if (assignResult && assignResult.length) {
      this.logger.log(`Assigned Target User to Loan ${loanId} with invitee ${invitee.id} during Loan Creation`);
    }
    return this.getLoanById(loanId);
  }

  public async updateLoan(loanId: string, loan: Partial<ILoan>): Promise<boolean | null> {
    return this.data.loans.update(loanId, loan);
  }

  public async setLoansTarget(input: LoanAssignToContactInput): Promise<Array<string>> {
    const { contactValue, contactType, loanId } = input;

    // Before looking for Loans we should check that User with provided contact is registered  
    const user = await this.getLoanInviteeUser(input);
    if (!user) return [];

    const { id: targetUserId } = user;

    const assignUpdates: LoansSetTargetUserInput = {
      userId: targetUserId,
      loansTargets: [],
    };

    if (loanId) {
      const loan = await this.getLoanById(loanId, [LOAN_RELATIONS.Invitee]);
      const assignUpdate = this.validateLoanTargetUpdates(loan, targetUserId);
      if (assignUpdate) {
        assignUpdates.loansTargets.push(assignUpdate);
      }
    } else {
      const invitees = await this.data.loanInvitees.searchInvitees(contactValue, contactType, [LOAN_INVITEE_RELATIONS.Loan]);
      const updates = invitees.map((invitee) => this.validateLoanTargetUpdates(invitee.loan, targetUserId)).filter((update) => update !== null);
      if (updates && updates.length) assignUpdates.loansTargets.push(...updates);
    }

    const loansToUpdate = assignUpdates.loansTargets.map((t) => t.loanId);
    try {
      await this.data.loans.assignUserToLoans(assignUpdates);
      return loansToUpdate;
    } catch (error) {
      this.logger.error(`Failed to assign User ${targetUserId} to Loans: ${error.message}`, { input, error, assignUpdates });
      return [];
    }
  }

  public async acceptLoan(loanId: string, userId: string, targetPaymentAccountId: string): Promise<ILoan | null> {
    // Check Loan existance
    const loan = await this.getLoanById(loanId, [LOAN_RELATIONS.Biller, LOAN_RELATIONS.Invitee]);
    if (!loan) {
      this.logger.error(`Loan with ID ${loanId} not found for acceptance`);
      throw new EntityNotFoundException(`Loan ${loanId} not found`);
    }

    const { state: loanState, lenderId, borrowerId, invitee, lenderAccountId, borrowerAccountId } = loan;
    let { biller } = loan;
    // Check that Loan is in the correct state for acceptance
    if (loanState !== LoanStateCodes.BorrowerAssigned && loanState !== LoanStateCodes.LenderAssigned) {
      this.logger.error(`Loan with ID ${loanId} is not in a state that allows acceptance: ${loanState}`);
      throw new EntityFailedToUpdateException(`Loan ${loanId} is not in a state that allows acceptance`);
    }

    // Check User existance
    const user = await this.data.users.getById(userId);
    if (!user) {
      this.logger.error(`User with ID ${userId} not found for loan acceptance`);
      throw new EntityNotFoundException(`User ${userId} not found`);
    }

    // Check User allowance to accept the Loan
    if (loanState === LoanStateCodes.BorrowerAssigned && userId !== borrowerId || 
      loanState === LoanStateCodes.LenderAssigned && userId !== lenderId) {
      this.logger.error(`User ${userId} is not allowed to accept Loan ${loanId}`);
      throw new ActionNotAllowedException(`User ${userId} is not allowed to accept Loan ${loanId}`);
    }

    // Check Payment Account existance
    const paymentAccount = await this.data.paymentAccounts.getById(targetPaymentAccountId);
    if (!paymentAccount) {
      this.logger.error(`Payment Account with ID ${targetPaymentAccountId} not found for loan acceptance`);
      throw new EntityNotFoundException(`Payment Account ${targetPaymentAccountId} not found`);
    }

    const sourceUserId = loanState === LoanStateCodes.BorrowerAssigned ? lenderId! : borrowerId!;
    // Biller is required for acceptance - so if it is not set yet, we create it as Personal Biller
    if (!biller) {
      this.logger.warn(`Biller not found for Loan ${loanId}, creating Personal Biller`);
      const billerCreateResult = await this.createPersonalBiller(invitee, sourceUserId);
      if (!billerCreateResult) {
        this.logger.error(`Failed to create Personal Biller for Loan ${loanId} on acceptance`);
        throw new EntityFailedToUpdateException(`Failed to create Personal Biller for Loan ${loanId}`);
      }
      biller = billerCreateResult;
    }
    const { type: billerType, paymentAccountId: billerPaymentAccountId, id: billerId } = biller;
    // If Biller is personal - it means we should set its paymentAccount to the one provided if it is not set yet
    if (billerType === BillerTypeCodes.Personal && !billerPaymentAccountId) {
      this.logger.debug(`Setting Payment Account ${targetPaymentAccountId} to Personal Biller ${biller.id}`);
      await this.data.billers.update(billerId, { paymentAccountId: targetPaymentAccountId });
    }

    // Set the target Payment Account to the Loan and update the Loan state
    const updates: Partial<ILoan> = {
      state: LoanStateCodes.Accepted,
      lenderAccountId: loanState === LoanStateCodes.BorrowerAssigned ? lenderAccountId : targetPaymentAccountId,
      borrowerAccountId: loanState === LoanStateCodes.LenderAssigned ? borrowerAccountId : targetPaymentAccountId,
      billerId: loan.billerId || billerId,
    };

    this.logger.debug(`Updating Loan ${loanId} with Payment Account ${targetPaymentAccountId} and state ${updates.state}`);
    const updateResult = await this.updateLoan(loanId, updates);

    if (!updateResult) {
      this.logger.error(`Failed to accept Loan ${loanId} with Payment Account ${targetPaymentAccountId}`);
      return null;
    }

    return this.getLoanById(loanId);
  }

  private async getLoanInviteeUser(input: LoanAssignToContactInput): Promise<IApplicationUser | null> {
    const { contactValue, contactType, intent } = input;
    const user = await this.data.users.getUserByContact(contactValue, contactType);
    
    if (!user || user.registrationStatus !== RegistrationStatus.Registered) {
      switch (intent) {
        // If intent is `propose` - it is okay if no such User yet (means that assignment will happen when User registered)
        case LoanAssignIntentCodes.Propose:
          this.logger.log(`Attempted to assign User ${contactType} ${contactValue} to Loans during proposal but User not registered yet`);
          break;
        case LoanAssignIntentCodes.Registration:
          this.logger.error(`Attempted to assign User ${contactType} ${contactValue} to Loans after registration but could not find User or registration is not completed yet`);
          break;
      }
      return null;
    }
    return user;
  }

  /**
   * Validates if a user can be assigned to a loan target (lender or borrower).
   * 
   * This method verifies the following conditions:
   * - The loan exists
   * - The loan has an invitee
   * - The loan is in 'Offered' or 'Requested' state
   * - The loan does not already have both lender and borrower assigned
   * - The target role (lender or borrower) is not already filled
   * 
   * @param loan - The loan object to validate
   * @param targetId - The ID of the user to be assigned as lender or borrower
   * @returns A tuple containing the loan ID and the invitee type if validation passes, or null if validation fails
   * @private
   */
  private validateLoanTargetUpdates(loan: ILoan | null, targetId: string): LoanTargetUserInput | null {
    this.logger.debug(`setInviteeToLoanTarget: loanId:${loan?.id}, invitee:${loan?.invitee?.id}`);
    if (!loan) {
      this.logger.error(`Attempted to assign User ${targetId} to Loan but Loan was not found`);
      return null;
    }
    if (!loan.invitee) {
      this.logger.error(`Attempted to assign User ${targetId} to Loan but Loan does not have invitee`);
      return null;
    }
    const { state, lenderId, borrowerId, invitee } = loan;
    const { type: targetType } = invitee;
    if (state !== LoanStateCodes.Offered && state !== LoanStateCodes.Requested) {
      this.logger.warn(`Loan should be in ${LoanStateCodes.Offered} or ${LoanStateCodes.Requested} state to set the target`);
      return null;
    }
    if (lenderId && borrowerId) {
      this.logger.warn('Loan already has lender and borrower assigned');
      return null;
    }
    if (lenderId && targetType === LoanInviteeTypeCodes.Lender || borrowerId && targetType === LoanInviteeTypeCodes.Borrower) {
      this.logger.warn(`Loan has ${targetType} already assigned`);
      return null;
    }

    return { loanId: loan.id, userType: targetType };
  }

  /**
   * Maps an ILoanInvitee to LoanAssignToContactInput.
   * Prioritizes email over phone number when both are available.
   * 
   * @param loanId - The loan ID to assign
   * @param intent - The assignment intent
   * @param invitee - The loan invitee containing contact information
   * @returns LoanAssignToContactInput with appropriate contact type and value
   */
  private mapInviteeToAssignInput(loanId: string, intent: LoanAssignIntent, invitee: ILoanInvitee): LoanAssignToContactInput {
    let contactValue: string;
    let contactType: ContactType;

    // Prioritize email over phone number
    if (invitee.email) {
      contactValue = invitee.email;
      contactType = ContactType.EMAIL;
    } else if (invitee.phone) {
      contactValue = invitee.phone;
      contactType = ContactType.PHONE_NUMBER;
    } else {
      this.logger.error('Invitee has neither email nor phone number', { inviteeId: invitee.id, loanId });
      throw new Error('Invitee must have either email or phone number');
    }

    return {
      loanId,
      intent,
      contactValue,
      contactType,
    };
  }
  // #endregion

  // #region Biller
  public async createPersonalBiller(invitee: ILoanInvitee, createdById: string): Promise<IBiller | null> {
    const loanTypeText = invitee ? invitee.type === LoanInviteeTypeCodes.Borrower ? 'offer' : 'request' : '';
    const billerName = `Personal ${loanTypeText} to ${invitee?.firstName} ${invitee?.lastName}`;
    return this.data.billers.createBiller({ name: billerName, type: BillerTypeCodes.Personal, createdById });
  }

  public async createCustomBiller(createdById: string, billerName: string): Promise<IBiller | null> {
    return this.data.billers.createBiller({ name: billerName, type: BillerTypeCodes.Custom, createdById });
  }

  public async getCustomBillers(createdById: string): Promise<Array<IBiller> | null> {
    return this.data.billers.getAllCustomBillers(createdById);
  }
  // #endregion

  // #region Loan Application
  public async getLoanApplicationById(id: string): Promise<ILoanApplication | null> {
    return this.data.loanApplications.getById(id);
  }

  public async createLoanApplication(data: Partial<LoanApplication>): Promise<ILoanApplication> {
    return this.data.loanApplications.insertWithResult(data);
  }

  public async updateLoanApplication(id: string, data: Partial<LoanApplication>): Promise<ILoanApplication | null> {
    return this.data.loanApplications.updateWithResult(id, data);
  }
  // #endregion
}
