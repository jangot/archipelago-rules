import { ILoan, ILoanPayment, ILoanPaymentStep, IPaymentAccount, IPaymentsRoute, ITransfer } from '@library/entity/interface';
import { BaseDomainServices } from '@library/shared/common/domainservices/domain.service.base';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeepPartial } from 'typeorm';
import { LoanPaymentStateCodes, LoanPaymentType, LoanPaymentTypeCodes, LoanType } from '@library/entity/enum';
import { PaymentDataService } from '@payment/data/data.service';
import {  LoanPaymentRelation, LoanPaymentStepRelation, LoanRelation, PaymentAccountRelation, PAYMENTS_ROUTE_RELATIONS } from '@library/shared/domain/entities/relations';
import { PlanPreviewOutputItem } from '@library/shared/types/lending';
import { v4 } from 'uuid';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';

@Injectable()
export class PaymentDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(PaymentDomainService.name);

  constructor(
    protected readonly data: PaymentDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  // #region Accounts
  public async addPaymentAccount(userId: string, input: DeepPartial<IPaymentAccount>): Promise<IPaymentAccount | null> {
    this.logger.debug(`Adding payment account for user ${userId}`, { input });
    return this.data.paymentAccounts.createPaymentAccount({ ...input, userId: userId });
  }

  public async getPaymentAccountById(paymentAccountId: string, relations?: PaymentAccountRelation[]): Promise<IPaymentAccount | null> {
    this.logger.debug(`Fetching payment account by ID ${paymentAccountId}`, relations);
    return this.data.paymentAccounts.getPaymentAccountById(paymentAccountId, relations);
  }
  // #endregion

  // #region Loan
  public async getLoanById(loanId: string, relations?: LoanRelation[]): Promise<ILoan | null> {
    return this.data.loans.getLoanById(loanId, relations);
  }
  // #endregion

  // #region Loan Payment
  public async getLoanPaymentById(paymentId: string, relations?: LoanPaymentRelation[]): Promise<ILoanPayment | null> {
    return this.data.loanPayments.getPaymentById(paymentId, relations);
  }

  public async getPaymentsByIds(paymentIds: string[], relations?: LoanPaymentRelation[]): Promise<ILoanPayment[] | null> {
    return this.data.loanPayments.getPaymentsByIds(paymentIds, relations);
  }



  public async updatePayment(paymentId: string, updates: DeepPartial<ILoanPayment>): Promise<boolean | null> {
    this.logger.debug(`Updating loan payment ${paymentId}`, { updates });
    return this.data.loanPayments.updatePayment(paymentId, updates);
  }

  public async findRouteForPayment(
    fromAccountId: string, 
    toAccountId: string, 
    state: LoanPaymentType, 
    loanType: LoanType
  ): Promise<IPaymentsRoute  | null> {
    const [fromAccountResult, toAccountResult] = await Promise.all([
      this.data.paymentAccounts.getPaymentAccountById(fromAccountId), 
      this.data.paymentAccounts.getPaymentAccountById(toAccountId),
    ]);
    if (!fromAccountResult || !toAccountResult) {
      this.logger.warn(`Payment accounts not found: from ${fromAccountId}, to ${toAccountId}`);
      return null;
    }

    const { type: fromAccount, ownership: fromOwnership, provider: fromProvider } = fromAccountResult;
    const { type: toAccount, ownership: toOwnership, provider: toProvider } = toAccountResult;

    const route = await this.data.paymentsRoute.findRoute(
      { 
        fromAccount, fromOwnership, fromProvider, toAccount, toOwnership, toProvider, 
        loanStage: state, loanType, 
      }, 
      [PAYMENTS_ROUTE_RELATIONS.Steps]);

    return route;
  }

  public async createPayment(input: DeepPartial<ILoanPayment>): Promise<ILoanPayment | null> {
    this.logger.debug('Creating payment ', { input });

    return this.data.loanPayments.createPayment(input);
  }

  public async saveRepaymentPlan(plan: PlanPreviewOutputItem[], loanId: string): Promise<ILoanPayment[] | null> {
    this.logger.debug(`Saving repayment plan for loan ${loanId}`, { plan });

    if (!plan || !plan.length) {
      this.logger.warn(`No repayment plan provided for loan ${loanId}`);
      return null;
    }

    const payments: DeepPartial<ILoanPayment>[] = plan.map(item => ({
      id: v4(),
      amount: item.amount,
      loanId,
      paymentNumber: item.index + 1,
      type: LoanPaymentTypeCodes.Repayment,
      state: LoanPaymentStateCodes.Created,
      scheduledAt: item.paymentDate,
    }));

    return this.data.loanPayments.createPayments(payments);
  }

  // #endregion

  // #region Loan Payment Steps
  public async getLoanPaymentStepById(stepId: string, relations?: LoanPaymentStepRelation[]): Promise<ILoanPaymentStep> {
    if (!stepId) {
      throw new MissingInputException('Missing step ID');
    }
    const loanPaymentStep = await this.data.loanPaymentSteps.getStepById(stepId, relations);
    if (!loanPaymentStep) {
      throw new EntityNotFoundException('Payment step not found');
    }
    return loanPaymentStep;
  }

  public async createPaymentSteps(steps: DeepPartial<ILoanPaymentStep>[]): Promise<ILoanPaymentStep[] | null> {
    return this.data.loanPaymentSteps.createPaymentSteps(steps);
  }

  public async getLatestTransferForStep(stepId: string): Promise<ITransfer | null> {
    return this.data.transfers.getLatestTransferForStep(stepId);
  }

  // #endregion

}
