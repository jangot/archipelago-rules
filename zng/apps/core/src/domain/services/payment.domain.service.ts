import { CoreDataService } from '@core/data/data.service';
import { ILoanPayment, ILoanPaymentStep, IPaymentAccount } from '@library/entity/interface';
import { BaseDomainServices } from '@library/shared/common/domainservices/domain.service.base';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeepPartial } from 'typeorm';
import { LoanPaymentRelation, LoanPaymentStepRelation } from '../entities/relations';

@Injectable()
export class PaymentDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(PaymentDomainService.name);

  constructor(
    protected readonly data: CoreDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  // #region Accounts
  public async addPaymentAccount(userId: string, input: DeepPartial<IPaymentAccount>): Promise<IPaymentAccount | null> {
    this.logger.debug(`Adding payment account for user ${userId}`, { input });
    return this.data.paymentAccounts.create({ ...input, userId: userId });
  }

  public async getPaymentAccountById(paymentAccountId: string): Promise<IPaymentAccount | null> {
    this.logger.debug(`Fetching payment account by ID ${paymentAccountId}`);
    return this.data.paymentAccounts.findOne({ where: { id: paymentAccountId } });
  }
  // #endregion

  // #region Loan Payment
  public async getLoanPaymentById(paymentId: string, relations?: LoanPaymentRelation[]): Promise<ILoanPayment | null> {
    return this.data.loanPayments.findOne({ where: { id: paymentId }, relations });
  }

  public async updatePayment(paymentId: string, updates: DeepPartial<ILoanPayment>): Promise<boolean | null> {
    this.logger.debug(`Updating loan payment ${paymentId}`, { updates });
    return this.data.loanPayments.update(paymentId, updates);
  }
  // #endregion

  // #region Loan Payment Steps
  public async getLoanPaymentStepById(stepId: string, relations?: LoanPaymentStepRelation[]): Promise<ILoanPaymentStep | null> {
    return this.data.loanPaymentSteps.findOne({ where: { id: stepId }, relations });
  }
  // #endregion

}
