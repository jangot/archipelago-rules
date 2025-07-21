import { CoreDataService } from '@core/modules/data';
import {
  BillerTypeCodes,
  LoanPaymentFrequency,
  LoanStateCodes,
} from '@library/entity/enum';
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { EntityFailedToUpdateException } from '@library/shared/common/exception/domain';
import { Biller, Loan, LoanApplication } from '@library/shared/domain/entity';
import { LoanRelation } from '@library/shared/domain/entity/relation';
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

  public async acceptLoanApplication(loanApplicationId: string, userId: string): Promise<Loan | null> {
    this.logger.debug(`acceptLoanApplication: Accepting loan application ${loanApplicationId} by user ${userId}`);

    const loanApplication = await this.getLoanApplicationById(loanApplicationId);

    // Create loan from loan application data
    const loanData: Partial<Loan> = {
      amount: loanApplication!.loanAmount!,
      type: loanApplication!.loanType!,
      state: LoanStateCodes.Created, // Initial state for new loan
      lenderId: loanApplication!.lenderId,
      borrowerId: loanApplication!.borrowerId,
      relationship: loanApplication!.lenderRelationship,
      note: loanApplication!.lenderNote,
      billerId: loanApplication!.billerId,
      billingAccountNumber: loanApplication!.billAccountNumber,
      paymentsCount: loanApplication!.loanPayments!,
      paymentFrequency: loanApplication!.loanPaymentFrequency as LoanPaymentFrequency,
      feeAmount: loanApplication!.loanServiceFee,
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

  // #region Biller
  public async createPersonalBiller(createdById: string, lenderName?: string): Promise<Biller | null> {
    const billerName = `Personal offer to ${lenderName}`;
    return this.data.billers.createBiller({ name: billerName, type: BillerTypeCodes.Personal, createdById });
  }

  public async createCustomBiller(createdById: string, billerName: string): Promise<Biller | null> {
    return this.data.billers.createBiller({ name: billerName, type: BillerTypeCodes.Custom, createdById });
  }

  public async getCustomBillers(createdById: string): Promise<Array<Biller> | null> {
    return this.data.billers.getAllCustomBillers(createdById);
  }
  // #endregion

  // #region Loan Application
  public async getLoanApplicationById(id: string): Promise<LoanApplication | null> {
    return this.data.loanApplications.getById(id);
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
  // #endregion
}
