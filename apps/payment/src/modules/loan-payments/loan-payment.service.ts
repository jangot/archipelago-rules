import { LoanPaymentType } from '@library/entity/enum';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { LoanPaymentStepService } from '../loan-payment-steps';
import { ILoanPaymentFactory } from './interfaces';

@Injectable()
export class LoanPaymentService {
  private readonly logger: Logger = new Logger(LoanPaymentService.name);

  constructor(
    @Inject(ILoanPaymentFactory) private readonly loanPaymentFactory: ILoanPaymentFactory,
    private readonly stepsService: LoanPaymentStepService
  ) { }

  /**
   * Initiates a payment for a specified loan
   * 
   * @param loanId - The unique identifier of the loan for which payment is being initiated
   * @param paymentType - The type of loan payment (e.g., scheduled, extra, payoff)
   * @returns A Promise resolving to boolean indicating success, or null if operation failed
   * @description This method triggers the payment initiation process for a loan, creating 
   *              the necessary payment record and preparing it for processing based on the
   *              specified payment type.
   */
  public async initiatePayment(loanId: string, paymentType: LoanPaymentType): Promise<boolean | null> {
    this.logger.debug(`Initiating payment for loan ${loanId} with type ${paymentType}`);
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
      // Created step advancement will create a transfer and trigger Event to advance Payment as well
      return this.stepsService.advanceStep(stepId, stepState);
    } catch (error) {
      this.logger.error(`Error initiating step ${stepId} for payment ${paymentId}`, { error });
      return null;
    }
  }

  /**
   * Advances a payment to its next stage in the payment processing workflow
   * 
   * @param paymentId - The unique identifier of the payment to advance
   * @param paymentType - The type of loan payment that is being advanced
   * @returns A Promise resolving to boolean indicating success, or null if operation failed
   * @description This method progresses a payment from its current state to the next stage
   *              in the payment workflow (e.g., from initiated to processing, or from 
   *              processing to completed). The specific state transitions depend on the 
   *              payment type and current state.
   */
  public async advancePayment(paymentId: string, paymentType: LoanPaymentType): Promise<boolean | null> {
    this.logger.debug(`Advancing payment ${paymentId} of type ${paymentType}`);

    const manager = this.loanPaymentFactory.getManager(paymentType);
    return manager.advance(paymentId);  
  }
}
