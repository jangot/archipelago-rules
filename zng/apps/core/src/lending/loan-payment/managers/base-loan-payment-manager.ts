import { Injectable, Logger } from '@nestjs/common';
import { LoanPaymentState, LoanPaymentStateCodes, PaymentStepStateCodes } from '@library/entity/enum';
import { ILoan, ILoanPayment, ILoanPaymentStep } from '@library/entity/interface';
import { IDomainServices } from '@core/domain/idomain.services';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';
import { LOAN_PAYMENT_RELATIONS, LoanPaymentRelation, LoanPaymentStepRelation, LoanRelation } from '@core/domain/entities/relations';
import { ILoanPaymentManager } from '../interfaces';

/**
 * Base class for loan payment managers
 */
@Injectable()
export abstract class BaseLoanPaymentManager implements ILoanPaymentManager {
  protected readonly logger: Logger;

  constructor(
    protected readonly domainServices: IDomainServices,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Initiates a new loan payment for a specific loan lifecycle part
   * @param loanId The ID of the loan for which to initiate a payment
   * @returns The created loan payment or null if creation failed
   */
  public abstract initiate(loanId: string): Promise<ILoanPayment | null>;

  /**
   * Advances the state of a loan payment based on step signals/events
   * @param loanPayment The loan payment to update
   * @param step The step that triggered the state change
   * @returns The updated loan payment or null if update failed
   */
  public async advance(loanPaymentId: string): Promise<boolean | null> {
    
    try {
      // Get all steps for this loan payment to determine overall state
      const loanPayment = await this.getPayment(loanPaymentId, [
        LOAN_PAYMENT_RELATIONS.Steps, 
        LOAN_PAYMENT_RELATIONS.StepsTransfers, 
        LOAN_PAYMENT_RELATIONS.StepsTransfersErrors,
      ]);
      const steps = loanPayment.steps;
      
      // Calculate the new state based on all steps
      const newState = this.calculateNewState(steps);
      
      if (newState === loanPayment.state) {
        this.logger.debug(`No state change needed for loan payment ${loanPayment.id}`);
        return false;
      }

      // Update the loan payment state
      loanPayment.state = newState;
      
      // If payment is completed, set completedAt timestamp
      if (newState === LoanPaymentStateCodes.Completed && !loanPayment.completedAt) {
        loanPayment.completedAt = new Date();
      }
      
      return await this.domainServices.paymentServices.updatePayment(loanPaymentId, loanPayment);
    } catch (error) {
      this.logger.error(`Failed to advance loan payment ${loanPaymentId}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Calculates the new state of a loan payment based on all its steps
   * @param steps All steps of the loan payment
   * @returns The calculated loan payment state
   */
  protected calculateNewState(steps: ILoanPaymentStep[] | null): LoanPaymentState {
    const allStepsCompleted = !steps || steps.every(step => step.state === PaymentStepStateCodes.Completed);
    if (allStepsCompleted) {
      return LoanPaymentStateCodes.Completed;
    }

    // Check if any step has failed - only consider the latest active step by order
    const activeSteps = steps.filter(step => step.state !== PaymentStepStateCodes.Created);
    if (activeSteps.length > 0) {
      // Get the step with the highest order value
      const latestStep = activeSteps.reduce((prev, current) => 
        (prev.order > current.order) ? prev : current
      );
      
      // Check the state of the latest step
      if (latestStep.state === PaymentStepStateCodes.Failed) {
        return LoanPaymentStateCodes.Failed;
      }
      
      if (latestStep.state === PaymentStepStateCodes.Pending) {
        return LoanPaymentStateCodes.Pending;
      }
    }

    // TODO: Doublecheck the need of that
    // If none of the above, keep the payment in created state
    return LoanPaymentStateCodes.Created;
  }

  protected async getLoan(loanId: string, relations?: LoanRelation[]): Promise<ILoan> {
    if (!loanId) {
      throw new MissingInputException('Missing Loan Id');
    }
    const loan = await this.domainServices.loanServices.getLoanById(loanId, relations);
    if (!loan) {
      throw new EntityNotFoundException('Loan not found');
    }
    return loan;
  }

  protected async getPayment(paymentId: string, relations?: LoanPaymentRelation[]): Promise<ILoanPayment> {
    if (!paymentId) {
      throw new MissingInputException('Missing payment ID');
    }
    const loanPayment = await this.domainServices.paymentServices.getLoanPaymentById(paymentId, relations);
    if (!loanPayment) {
      throw new EntityNotFoundException('Payment account not found');
    }
    return loanPayment;
  }

  protected async getStep(stepId: string, relations?: LoanPaymentStepRelation[]): Promise<ILoanPaymentStep> {
    if (!stepId) {
      throw new MissingInputException('Missing step ID');
    }
    const loanPaymentStep = await this.domainServices.paymentServices.getLoanPaymentStepById(stepId, relations);
    if (!loanPaymentStep) {
      throw new EntityNotFoundException('Payment step not found');
    }
    return loanPaymentStep;
  }
}
