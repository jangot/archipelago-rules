import { CoreDataService } from '@core/modules/data';
import { ActionNotAllowedException } from '@core/modules/lending/exceptions';
import { IBiller, ILoan, ILoanApplication } from '@library/entity/entity-interface';
import { BillerTypeCodes, LoanStateCodes } from '@library/entity/enum';
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { EntityFailedToUpdateException, EntityNotFoundException } from '@library/shared/common/exception/domain';
import { LoanApplication } from '@library/shared/domain/entity';
import { LOAN_RELATIONS, LoanRelation } from '@library/shared/domain/entity/relation';
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

    return createdLoan;
  }

  public async updateLoan(loanId: string, loan: Partial<ILoan>): Promise<boolean | null> {
    return this.data.loans.update(loanId, loan);
  }

  

  public async acceptLoan(loanId: string, userId: string, targetPaymentAccountId: string): Promise<ILoan | null> {
    // Check Loan existance
    const loan = await this.getLoanById(loanId, [LOAN_RELATIONS.Biller, LOAN_RELATIONS.Invitee]);
    if (!loan) {
      this.logger.error(`Loan with ID ${loanId} not found for acceptance`);
      throw new EntityNotFoundException(`Loan ${loanId} not found`);
    }

    const { state: loanState, lenderId, borrowerId, lenderAccountId, borrowerAccountId } = loan;
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
      const billerCreateResult = await this.createPersonalBiller(sourceUserId);
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

  // #endregion

  // #region Biller
  public async createPersonalBiller(createdById: string): Promise<IBiller | null> {
    // const loanTypeText = invitee ? invitee.type === LoanAssignIntent.Borrower ? 'offer' : 'request' : '';
    // const billerName = `Personal offer to ${invitee?.firstName} ${invitee?.lastName}`;
    const billerName = `Personal offer to ${createdById}`; // TODO: Add correct name based on the loan application
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
    return  this.data.loanApplications.insertWithResult(data);
  }

  public async updateLoanApplication(id: string, data: Partial<LoanApplication>): Promise<ILoanApplication> {
    return  this.data.loanApplications.updateWithResult(id, data);
  }
  // #endregion
}
