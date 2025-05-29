import { CoreDataService } from '@core/data/data.service';
import { BillerTypeCodes, LoanAssignIntentCodes, LoanInviteeTypeCodes, LoanStateCodes, RegistrationStatus } from '@library/entity/enum';
import { IApplicationUser, IBiller, ILoan, ILoanInvitee } from '@library/entity/interface';
import { BaseDomainServices } from '@library/shared/common/domainservices/domain.service.base';
import { LoanAssignToContactInput, LoansSetTargetUserInput, LoanTargetUserInput } from '@library/shared/types/lending';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DeepPartial } from 'typeorm';
import { LOAN_INVITEE_RELATIONS, LOAN_RELATIONS, LoanRelation } from '../entities/relations';
import { EntityFailedToUpdateException } from '@library/shared/common/exceptions/domain';

@Injectable()
export class LoanDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(LoanDomainService.name);

  constructor(
    protected readonly data: CoreDataService,
    protected readonly jwtService: JwtService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  // #region Loan
  public async getLoanById(loanId: string, relations?: LoanRelation[]): Promise<ILoan | null> {
    return this.data.loans.getLoanById(loanId, relations);
  }

  public async createLoan(loan: DeepPartial<ILoan>): Promise<ILoan | null> {
    const createdLoan = await this.data.loans.createLoan(loan);
    if (!createdLoan) throw new EntityFailedToUpdateException('Failed to create Loan');
    
    const { id: loanId } = createdLoan;
    const invitee = loan.invitee!;
    invitee.loanId = loanId;
    await this.data.loanInvitees.create(invitee);
    return this.getLoanById(loanId);
  }

  public async updateLoan(loanId: string, loan: DeepPartial<ILoan>): Promise<boolean | null> {
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
  // #endregion

  // #region Biller
  public async createPersonalBiller(invitee: DeepPartial<ILoanInvitee>, createdById: string): Promise<IBiller | null> {
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







  
}
