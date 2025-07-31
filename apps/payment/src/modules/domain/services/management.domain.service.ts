import { LoanPaymentType, PaymentAccountProvider, PaymentStepState } from '@library/entity/enum';
import { TransferErrorPayload, TransferUpdateDetails, TransferUpdatePayload } from '@library/shared/type/lending';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ILoanPaymentStepFactory } from '@payment/modules/loan-payment-steps/interfaces';
import { ILoanPaymentFactory } from '@payment/modules/loan-payments';
import { ITransferExecutionFactory } from '@payment/modules/transfer-execution/interface';

/**
 * Service to manage states of Loan, Loan Payment, Loan Payment Steps by aggregating their managers.
 * Supposed that this service does not executes calls to repository directly
 */
@Injectable()
export class ManagementDomainService {
  protected readonly logger = new Logger(ManagementDomainService.name);

  constructor(
    @Inject(ILoanPaymentFactory) private readonly loanPaymentFactory: ILoanPaymentFactory,
    @Inject(ILoanPaymentStepFactory) private readonly loanPaymentStepFactory: ILoanPaymentStepFactory,
    @Inject(ITransferExecutionFactory) private readonly transferExecutionFactory: ITransferExecutionFactory
  ) {}

  /**
   * Initiates a loan payment process for a specific loan
   * 
   * This method creates a new payment of the specified type for a loan and initiates the first payment step.
   * For repayment type, it will select the payment with the lowest payment number to process first.
   * If the payment has no steps, it will attempt to advance the payment directly.
   * 
   * @param loanId - Unique identifier of the loan to create payment for
   * @param paymentType - Type of payment to initiate (e.g. Disbursement, Repayment)
   * @returns Promise resolving to boolean indicating success, or null if initiation fails
   */
  public async initiateLoanPayment(loanId: string, paymentType: LoanPaymentType): Promise<boolean | null> {
    const paymentManager = this.loanPaymentFactory.getManager(paymentType);
    const initiatedPayment = await paymentManager.initiate(loanId);
    if (!initiatedPayment) {
      this.logger.error(`Failed to initiate ${paymentType} payment for loan ${loanId}`);
      return null;
    }

    const { id: paymentId, steps: initialPaymentSteps } = initiatedPayment;

    if (!initialPaymentSteps || !initialPaymentSteps.length) {
      this.logger.warn(`No steps found for initiated payment ${paymentId}`);
      // If no steps then it might be that it is zero steps Payments, which might be already completed
      try {
        this.logger.debug(`Trying to advance payment ${paymentId} without steps`);
        const advanceResult = paymentManager.advance(paymentId);
        this.logger.debug(`Advance result for payment ${paymentId}: ${advanceResult}`);
        return advanceResult;
      } catch (error) {
        this.logger.error(`Failed to advance payment ${paymentId} without steps`, { error });
        return null;
      }
    }

    // Find the step with the lowest order to initiate first
    const stepToInitiate = initialPaymentSteps.reduce((lowestStep, currentStep) => {
      return (currentStep.order < lowestStep.order) ? currentStep : lowestStep;
    }, initialPaymentSteps[0]);
    
    if (!stepToInitiate) {
      this.logger.error(`Failed to find step to initiate for payment ${paymentId}`);
      return null;
    }

    // Initiate the step
    const { id: stepId, state: stepState } = stepToInitiate;

    try {
      this.logger.debug(`Initiating step ${stepId} for payment ${paymentId} from state ${stepState}`);
      const stepManager = await this.loanPaymentStepFactory.getManager(stepId, stepState);
      // Created step advancement will create a transfer and trigger Event to advance Payment as well
      return stepManager.advance(stepId);
    } catch (error) {
      this.logger.error(`Error initiating step ${stepId} for payment ${paymentId}`, { error });
      return null;
    }
  }

  /**
   * Advances a loan payment to its next state
   * 
   * This method progresses a payment through its workflow by delegating to the appropriate
   * payment manager based on the payment type. It handles the state transitions of the payment entity.
   * 
   * @param paymentId - Unique identifier of the payment to advance
   * @param paymentType - Type of the payment being advanced
   * @returns Promise resolving to boolean indicating success, or null if advancement fails
   */
  public async advancePayment(paymentId: string, paymentType: LoanPaymentType): Promise<boolean | null> {
    this.logger.debug(`Advancing payment ${paymentId} of type ${paymentType}`);

    const manager = this.loanPaymentFactory.getManager(paymentType);
    return manager.advance(paymentId);
  }

  /**
   * Advances a specific payment step to its next state
   * 
   * This method handles the progression of an individual payment step through its workflow.
   * It dynamically selects the appropriate step manager based on the step ID and current state.
   * 
   * @param stepId - Unique identifier of the payment step to advance
   * @param stepState - Optional current state of the step to determine the correct manager
   * @returns Promise resolving to boolean indicating success, or null if advancement fails
   */
  public async advancePaymentStep(stepId: string, stepState?: PaymentStepState): Promise<boolean | null> {
    this.logger.debug(`Advancing payment step ${stepId} ${stepState ? `with state ${stepState}` : ''}`);
    
    const manager = await this.loanPaymentStepFactory.getManager(stepId, stepState);
    return manager.advance(stepId);
  }

  /**
   * Executes a transfer for a specific payment step using the specified provider
   * 
   * This method retrieves the appropriate transfer execution provider based on the transfer ID and provider type,
   * and then executes the transfer. It is used to handle the actual fund transfers for payment steps.
   * 
   * @param transferId - Unique identifier of the transfer to execute
   * @param providerType - Type of payment account provider to use for executing the transfer
   * @returns Promise resolving to boolean indicating success, or null if execution fails
   */
  public async initiateTransfer(transferId: string, providerType?: PaymentAccountProvider): Promise<boolean | null> {
    this.logger.debug(`Executing transfer ${transferId} with provider ${providerType}`);
    
    const transferExecutionProvider = await this.transferExecutionFactory.getProvider(transferId, providerType);
    return transferExecutionProvider.initiateTransfer(transferId);
  }

  public async completeTransfer(transferId: string, providerType?: PaymentAccountProvider): Promise<boolean | null> {
    this.logger.debug(`Completing transfer ${transferId}`);
    const transferExecutionProvider = await this.transferExecutionFactory.getProvider(transferId, providerType);
    return transferExecutionProvider.completeTransfer(transferId);
  }

  public async failTransfer(transferId: string, error: TransferErrorPayload, providerType?: PaymentAccountProvider): Promise<boolean | null> {
    this.logger.debug(`Failing transfer ${transferId}`);
    const transferExecutionProvider = await this.transferExecutionFactory.getProvider(transferId, providerType);
    return transferExecutionProvider.failTransfer(transferId, error);
  }

  public async parseTransferUpdate(
    transferId: string,
    update: TransferUpdatePayload,
    providerType?: PaymentAccountProvider
  ): Promise<TransferUpdateDetails | null> {
    this.logger.debug(`Parsing transfer update for ${transferId}`);
    const transferExecutionProvider = await this.transferExecutionFactory.getProvider(transferId, providerType);
    return transferExecutionProvider.parseTransferUpdate(update);
  }

  public async applyTransferUpdate(
    transferId: string,
    update: TransferUpdateDetails,
    providerType?: PaymentAccountProvider
  ): Promise<boolean | null> {
    this.logger.debug(`Processing transfer update for ${transferId}`);
    const transferExecutionProvider = await this.transferExecutionFactory.getProvider(transferId, providerType);
    return transferExecutionProvider.applyTransferUpdate(transferId, update);
  }
}
