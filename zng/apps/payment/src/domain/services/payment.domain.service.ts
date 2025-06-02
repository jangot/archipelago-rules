import { ILoanPayment, ILoanPaymentStep, IPaymentAccount, IPaymentsRoute } from '@library/entity/interface';
import { BaseDomainServices } from '@library/shared/common/domainservices/domain.service.base';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeepPartial } from 'typeorm';
import { LoanPaymentType, LoanType } from '@library/entity/enum';
import { PaymentDataService } from '@payment/data/data.service';
import { LoanPaymentRelation, LoanPaymentStepRelation, PaymentAccountRelation } from '@library/shared/domain/entities/relations';

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

  // #region Loan Payment
  public async getLoanPaymentById(paymentId: string, relations?: LoanPaymentRelation[]): Promise<ILoanPayment | null> {
    return this.data.loanPayments.getPaymentById(paymentId, relations);
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

    const route = await this.data.paymentsRoute.findRoute({ 
      fromAccount, fromOwnership, fromProvider, toAccount, toOwnership, toProvider, 
      loanStage: state, loanType, 
    });

    return route;
  }

  public async createPaymentByRoute(routeId: string, loanId: string, paymentType: LoanPaymentType): Promise<void> {}

  // #endregion

  // #region Loan Payment Steps
  public async getLoanPaymentStepById(stepId: string, relations?: LoanPaymentStepRelation[]): Promise<ILoanPaymentStep | null> {
    return this.data.loanPaymentSteps.findOne({ where: { id: stepId }, relations });
  }

  // #endregion

}
