import { LoanPaymentState, LoanPaymentStateCodes, LoanPaymentType, LoanType, PaymentStepState, PaymentStepStateCodes, TransferStateCodes } from '@library/entity/enum';
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exception/domain';
import { Loan, LoanPayment, LoanPaymentStep, PaymentAccount, PaymentsRoute, Transfer } from '@library/shared/domain/entity';
import { LOAN_PAYMENT_STEP_RELATIONS, LoanPaymentRelation, LoanPaymentStepRelation, LoanRelation, PaymentAccountRelation, PAYMENTS_ROUTE_RELATIONS, TRANSFER_RELATIONS, TransferRelation } from '@library/shared/domain/entity/relation';
import { PaymentCompletedEvent, PaymentFailedEvent, PaymentStepCompletedEvent, PaymentStepFailedEvent, PaymentSteppedEvent, PaymentStepPendingEvent } from '@library/shared/events';
import { TransferErrorDetails } from '@library/shared/type/lending';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentDataService } from '@payment/modules/data';
import { EventPublisherService } from 'libs/shared/src/modules/event';

@Injectable()
export class PaymentDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(PaymentDomainService.name);

  constructor(
    protected readonly data: PaymentDataService,
    protected readonly config: ConfigService,
    private readonly eventManager: EventPublisherService
  ) {
    super(data);
  }

  // #region Accounts
  public async addPaymentAccount(userId: string, input: Partial<PaymentAccount>): Promise<PaymentAccount | null> {
    this.logger.debug(`Adding payment account for user ${userId}`, { input });
    return this.data.paymentAccounts.createPaymentAccount({ ...input, userId: userId });
  }

  public async getPaymentAccountById(paymentAccountId: string, relations?: PaymentAccountRelation[]): Promise<PaymentAccount | null> {
    this.logger.debug(`Fetching payment account by ID ${paymentAccountId}`, relations);
    return this.data.paymentAccounts.getPaymentAccountById(paymentAccountId, relations);
  }
  // #endregion

  // #region Loan
  public async getLoanById(loanId: string, relations?: LoanRelation[]): Promise<Loan | null> {
    return this.data.loans.getLoanById(loanId, relations);
  }
  // #endregion

  // #region Loan Payment
  public async getLoanPaymentById(paymentId: string, relations?: LoanPaymentRelation[]): Promise<LoanPayment | null> {
    return this.data.loanPayments.getPaymentById(paymentId, relations);
  }

  public async getPaymentsByIds(paymentIds: string[], relations?: LoanPaymentRelation[]): Promise<LoanPayment[] | null> {
    return this.data.loanPayments.getPaymentsByIds(paymentIds, relations);
  }



  public async updatePayment(paymentId: string, updates: Partial<LoanPayment>): Promise<boolean | null> {
    this.logger.debug(`Updating loan payment ${paymentId}`, { updates });
    return this.data.loanPayments.updatePayment(paymentId, updates);
  }

  public async findRouteForPayment(
    fromAccountId: string,
    toAccountId: string,
    state: LoanPaymentType,
    loanType: LoanType
  ): Promise<PaymentsRoute  | null> {
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

  public async createPayment(input: Partial<LoanPayment>): Promise<LoanPayment | null> {
    this.logger.debug('Creating payment ', { input });

    return this.data.loanPayments.createPayment(input);
  }

  /**
   * Updates the state of a loan payment and publishes the corresponding event.
   *
   * This method handles the state transition logic for loan payments, including:
   * - Pending: Only updates if the old state is different
   * - Failed: Always updates to failed state
   * - Completed: Updates to completed state with timestamp
   * - Created: Logs an error for unhandled states
   *
   * @param paymentId - The ID of the payment to update
   * @param oldState - The current state of the payment before update
   * @param newState - The new state to set for the payment
   * @param paymentStepped - Indicates if this is a stepped payment (default: false)
   * @returns True if update was successful, false if no change was made, null if update failed
   */
  public async updatePaymentState(
    loanId: string,
    paymentId: string,
    oldState: LoanPaymentState,
    newState: LoanPaymentState,
    paymentStepped: boolean = false
  ): Promise<boolean | null> {
    let updateResult: boolean | null = null;
    this.logger.debug(`Updating payment ${paymentId} to state ${newState}`, { oldState, paymentStepped });
    switch (newState) {
      case LoanPaymentStateCodes.Pending:
        if (oldState !== newState) {
          updateResult = await this.data.loanPayments.updatePayment(paymentId, { state: newState });
        } else if (paymentStepped) {
          // If payment is stepped, we still want to publish the event
          updateResult =  true; // Indicate that we handled the stepped payment
        }
        break;

      case LoanPaymentStateCodes.Failed:
        updateResult = await this.data.loanPayments.updatePayment(paymentId, { state: newState });
        break;
      case LoanPaymentStateCodes.Completed:
        updateResult = await this.data.loanPayments.updatePayment(paymentId, {
          state: newState,
          completedAt: new Date(),
        });
        break;
      case LoanPaymentStateCodes.Created:
      default:
        this.logger.error(`Unhandled payment state: ${newState} for paymentId: ${paymentId}`);
        break;
    }

    if (updateResult === null) {
      this.logger.error(`Failed to update payment ${paymentId} state to ${newState}. It may not exist or the update operation failed.`);
      return null;
    } else if (updateResult === false) {
      this.logger.warn(`Payment ${paymentId} state change to ${newState} was not applied. It may already be in this state or the update operation was not successful.`);
      return false;
    } else {
      this.logger.debug(`Payment ${paymentId} state successfully changed to ${newState}`);
      await this.publishPaymentStateChangeEvent(loanId, paymentId, oldState, newState, paymentStepped);
    }

    return updateResult;
  }

  /**
   * Publishes an event for the payment state change.
   *
   * This method handles the logic for publishing events based on the new state of the payment:
   * - **Pending**: Only publishes if payment is stepped
   * - **Completed**: Publishes PaymentCompletedEvent
   * - **Failed**: Publishes PaymentFailedEvent
   * - **Created**: Logs an error for unhandled states
   *
   * @param paymentId - The ID of the payment whose state has changed
   * @param oldState - The previous state of the payment
   * @param newState - The new state of the payment
   * @param paymentStepped - Indicates if this is a stepped payment (default: false)
   * @returns True if event was published, false if skipped, null if unhandled state
   */
  private async publishPaymentStateChangeEvent(
    loanId: string,
    paymentId: string,
    oldState: LoanPaymentState,
    newState: LoanPaymentState,
    paymentStepped: boolean = false
  ): Promise<boolean | null> {
    this.logger.debug(`Publishing payment state change event for payment ${paymentId} from ${oldState} to ${newState}`, { paymentStepped });
    switch (newState) {
      case LoanPaymentStateCodes.Pending:
        if (!paymentStepped) {
          this.logger.debug(`Payment ${paymentId} is pending but not stepped, skipping event publication.`);
          return false; // Skip event if payment is pending but not stepped
        }
        return this.eventManager.publish(PaymentSteppedEvent.create(paymentId, oldState));
      case LoanPaymentStateCodes.Completed:
        return this.eventManager.publish(PaymentCompletedEvent.create(paymentId, oldState));
      case LoanPaymentStateCodes.Failed:
        return this.eventManager.publish(PaymentFailedEvent.create(paymentId, oldState));
      case LoanPaymentStateCodes.Created:
      default:
        this.logger.error(`Unhandled payment state: ${newState} for paymentId: ${paymentId}`);
        return null;
    }
  }

  /**
   * Identifies the next payment step that can be initiated.
   *
   * This method implements the step sequencing logic for payment execution:
   * 1. **First Step**: If no steps are completed, returns the first step (order 0) if it's in 'created' state
   * 2. **Sequential Steps**: Finds the step that immediately follows the highest completed step
   * 3. **State Validation**: Only returns steps in 'created' state that are ready for initiation
   *
   * The sequential execution ensures that payment steps are processed in the correct
   * order and that each step completes before the next one begins.
   *
   * @param steps - All payment steps for analysis
   * @returns The ID of the next step ready for initiation, or null if no step can be started
   */
  public couldStartNextPaymentStep(steps: LoanPaymentStep[] | null): string | null {
    if (!steps || !steps.length) return null;

    // 1. Find the highest order completed step
    const completedSteps = steps.filter(step => step.state === PaymentStepStateCodes.Completed);
    if (!completedSteps.length) {
      // If no steps are completed, check if we can start the first step
      const firstStep = steps.find(step => step.order === 0);
      return firstStep?.state === PaymentStepStateCodes.Created ? firstStep.id : null;
    }

    // Get max order of completed steps
    const maxCompletedOrder = Math.max(...completedSteps.map(step => step.order));

    // 2. Find the next step after the highest completed one
    const nextStep = steps.find(step =>
      step.order === maxCompletedOrder + 1 &&
      step.state === PaymentStepStateCodes.Created
    );

    // TODO: Should result PaymentStepped to advance next step to Pending state
    return nextStep?.id || null;
  }

  // #endregion

  // #region Loan Payment Steps
  public async getLoanPaymentStepById(stepId: string, relations?: LoanPaymentStepRelation[]): Promise<LoanPaymentStep> {
    if (!stepId) {
      throw new MissingInputException('Missing step ID');
    }
    const loanPaymentStep = await this.data.loanPaymentSteps.getStepById(stepId, relations);
    if (!loanPaymentStep) {
      throw new EntityNotFoundException('Payment step not found');
    }
    return loanPaymentStep;
  }

  public async createPaymentSteps(steps: Partial<LoanPaymentStep>[]): Promise<LoanPaymentStep[] | null> {
    return this.data.loanPaymentSteps.createPaymentSteps(steps);
  }

  public async getLatestTransferForStep(stepId: string): Promise<Transfer | null> {
    return this.data.transfers.getLatestTransferForStep(stepId);
  }

  public async updatePaymentStepState(stepId: string, oldState: PaymentStepState, newState: PaymentStepState): Promise<boolean | null> {
    this.logger.debug(`Updating payment step ${stepId} to state ${newState}`);
    const updateResult = await this.data.loanPaymentSteps.updateStepState(stepId, newState);
    if (updateResult === null) {
      this.logger.error(`Failed to update step ${stepId} state to ${newState}. It may not exist or the update operation failed.`);
      return null;
    } else if (updateResult === false) {
      this.logger.warn(`Step ${stepId} state change to ${newState} was not applied. It may already be in this state or the update operation was not successful.`);
      return false;
    } else {
      this.logger.debug(`Step ${stepId} state successfully changed to ${newState}`);
      await this.publishStepStateChangeEvent(stepId, oldState, newState);
    }

    return updateResult;
  }

  private async publishStepStateChangeEvent(stepId: string, oldState: PaymentStepState, newState: PaymentStepState): Promise<boolean | null> {
    this.logger.debug(`Publishing step state change event for step ${stepId} from ${oldState} to ${newState}`);
    switch (newState) {
      case PaymentStepStateCodes.Pending:
        return this.eventManager.publish(PaymentStepPendingEvent.create(stepId, oldState));
      case PaymentStepStateCodes.Completed:
        return this.eventManager.publish(PaymentStepCompletedEvent.create(stepId, oldState));
      case PaymentStepStateCodes.Failed:
        return this.eventManager.publish(PaymentStepFailedEvent.create(stepId, oldState));
      case PaymentStepStateCodes.Created:
      default:
        this.logger.error(`Unhandled step state: ${newState} for stepId: ${stepId}`);
        return null;
    }
  }

  // #endregion

  // #region Transfers

  public async createTransferForStep(stepId: string): Promise<Transfer | null> {
    if (!stepId) {
      throw new MissingInputException('Missing step ID');
    }
    this.logger.debug(`Creating transfer for step ${stepId}`);
    const step = await this.getLoanPaymentStepById(stepId, [LOAN_PAYMENT_STEP_RELATIONS.Transfers]);
    const { amount, sourcePaymentAccountId, targetPaymentAccountId, transfers } = step;
    const transferOrder = transfers ? transfers.length : 0;
    const transferData: Partial<Transfer> = {
      amount,
      state: TransferStateCodes.Created,
      sourceAccountId: sourcePaymentAccountId,
      destinationAccountId: targetPaymentAccountId,
      order: transferOrder,
      loanPaymentStepId: stepId,
    };
    return this.data.transfers.createTransferForStep(transferData);
  }

  public async getTransferById(transferId: string, relations?: TransferRelation[]): Promise<Transfer> {
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

  public async processTransferUpdate(transferId: string, updates: Partial<Transfer> | null): Promise<boolean | null> {
    this.logger.debug(`Processing transfer update for ${transferId}`, { updates });
    if (!updates || Object.keys(updates).length === 0) {
      this.logger.warn(`No updates provided for transfer ${transferId}`);
      return false; // No updates to apply
    }
    this.logger.debug(`Updating transfer ${transferId} with details`, { updates });    
    return this.data.transfers.updateTransfer(transferId, updates);
  }

  // #endregion

}
