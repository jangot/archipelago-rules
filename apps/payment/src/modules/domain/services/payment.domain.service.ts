import { ILoan, ILoanPayment, ILoanPaymentStep, IPaymentAccount, IPaymentsRoute, ITransfer } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentType, LoanPaymentTypeCodes, LoanType, PaymentStepState, TransferStateCodes } from '@library/entity/enum';
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exception/domain';
import { LOAN_PAYMENT_STEP_RELATIONS, LoanPaymentRelation, LoanPaymentStepRelation, LoanRelation, PaymentAccountRelation, PAYMENTS_ROUTE_RELATIONS, TRANSFER_RELATIONS, TransferRelation } from '@library/shared/domain/entity/relation';
import { PlanPreviewOutputItem, TransferErrorDetails } from '@library/shared/type/lending';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentDataService } from '@payment/modules/data';
import { v4 } from 'uuid';

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
  public async addPaymentAccount(userId: string, input: Partial<IPaymentAccount>): Promise<IPaymentAccount | null> {
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



  public async updatePayment(paymentId: string, updates: Partial<ILoanPayment>): Promise<boolean | null> {
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

  public async createPayment(input: Partial<ILoanPayment>): Promise<ILoanPayment | null> {
    this.logger.debug('Creating payment ', { input });

    return this.data.loanPayments.createPayment(input);
  }

  public async createRepaymentByPreview(preview: PlanPreviewOutputItem, loanId: string): Promise<ILoanPayment | null> {
    this.logger.debug(`Creating repayment payment for loan ${loanId}`, { preview });

    if (!preview || !preview.amount || !preview.paymentDate) {
      this.logger.warn(`Invalid repayment preview for loan ${loanId}`);
      return null;
    }

    return this.data.loanPayments.createPayment({
      id: v4(),
      amount: preview.amount,
      loanId,
      paymentNumber: preview.index,
      type: LoanPaymentTypeCodes.Repayment,
      state: LoanPaymentStateCodes.Created,
      scheduledAt: preview.paymentDate,
    });
  }

  public async completePayment(paymentId: string): Promise<boolean | null> {
    this.logger.debug(`Completing payment ${paymentId}`);
    return this.data.loanPayments.updatePayment(
      paymentId, 
      { 
        state: LoanPaymentStateCodes.Completed, 
        completedAt: new Date(), 
      });
  }

  public async failPayment(paymentId: string, stepId: string): Promise<boolean | null> {
    this.logger.debug(`Failing payment ${paymentId} because of step ${stepId}`);
    return this.data.loanPayments.updatePayment(
      paymentId, 
      { 
        state: LoanPaymentStateCodes.Failed, 
      });
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

  public async createPaymentSteps(steps: Partial<ILoanPaymentStep>[]): Promise<ILoanPaymentStep[] | null> {
    return this.data.loanPaymentSteps.createPaymentSteps(steps);
  }

  public async getLatestTransferForStep(stepId: string): Promise<ITransfer | null> {
    return this.data.transfers.getLatestTransferForStep(stepId);
  }

  public async updatePaymentStepState(stepId: string, state: PaymentStepState): Promise<boolean | null> {
    this.logger.debug(`Updating payment step ${stepId} to state ${state}`);
    return this.data.loanPaymentSteps.updateStepState(stepId, state);
  }

  // #endregion

  // #region Transfers

  public async createTransferForStep(stepId: string): Promise<ITransfer | null> {
    if (!stepId) {
      throw new MissingInputException('Missing step ID');
    }
    this.logger.debug(`Creating transfer for step ${stepId}`);
    const step = await this.getLoanPaymentStepById(stepId, [LOAN_PAYMENT_STEP_RELATIONS.Transfers]);
    const { amount, sourcePaymentAccountId, targetPaymentAccountId, transfers } = step;
    const transferOrder = transfers ? transfers.length : 0;
    const transferData: Partial<ITransfer> = {
      amount,
      state: TransferStateCodes.Created,
      sourceAccountId: sourcePaymentAccountId,
      destinationAccountId: targetPaymentAccountId,
      order: transferOrder,
      loanPaymentStepId: stepId,
    };
    return this.data.transfers.createTransferForStep(transferData);
  }

  public async getTransferById(transferId: string, relations?: TransferRelation[]): Promise<ITransfer> {
    if (!transferId) {
      throw new MissingInputException('Missing transfer ID');
    }
    const transfer = await this.data.transfers.getTransferById(transferId, relations);
    if (!transfer) {
      throw new EntityNotFoundException('Transfer not found');
    }
    return transfer;
  }

  public async completeTransfer(transferId: string): Promise<boolean | null> {
    this.logger.debug(`Completing transfer ${transferId}`);
    return this.data.transfers.completeTransfer(transferId);
  }

  public async failTransfer(transferId: string, error: TransferErrorDetails): Promise<boolean | null> {
    this.logger.debug(`Failing transfer ${transferId}`, { error });
    // Check transfer existence and state (prevent double-fail)
    // Get Loan Id attached to Transfer if any
    const transfer = await this.data.transfers.getTransferById(transferId, [TRANSFER_RELATIONS.LoanPayment, TRANSFER_RELATIONS.Error]);
    if (!transfer) {
      throw new EntityNotFoundException('Transfer not found');
    }
    const storedError = transfer.error;
    if (storedError) {
      this.logger.error(`Transfer ${transferId} already has an error: ${storedError.displayMessage}`, { storedError });
      return null; // Transfer already failed, no action needed
    }

    const loanId = transfer.loanPaymentStep?.loanPayment.loanId;
    // Save TransferError
    await this.data.transferErrors.createTransferError(transferId, error, loanId || null);
    // Save Transfer
    return this.data.transfers.failTransfer(transferId);
  }

  // #endregion

}
