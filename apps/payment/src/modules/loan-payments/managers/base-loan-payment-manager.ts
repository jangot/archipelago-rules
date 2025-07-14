import { ILoan, ILoanPayment, ILoanPaymentStep, IPaymentsRoute, IPaymentsRouteStep } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentType, LoanType, PaymentStepStateCodes } from '@library/entity/enum';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exception/domain';
import { LOAN_PAYMENT_RELATIONS, LOAN_RELATIONS, LoanPaymentRelation, LoanPaymentStepRelation, LoanRelation } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { Transactional } from 'typeorm-transactional';
import { v4 } from 'uuid';
import { ILoanPaymentManager } from '../interfaces';

/**
 * Interface for payment account pairs used in transfers
 */
export interface PaymentAccountPair {
  fromAccountId: string | null;
  toAccountId: string | null;
}

/**
 * Interface for payment options
 */
export interface PaymentOptions {
  state: typeof LoanPaymentStateCodes[keyof typeof LoanPaymentStateCodes];
  completedAt?: Date;
  scheduledAt?: Date;
  initiatedAt?: Date;
}

/**
 * Base class for loan payment managers
 */
@Injectable()
export abstract class BaseLoanPaymentManager implements ILoanPaymentManager {
  protected readonly logger: Logger;
  protected readonly paymentType: LoanPaymentType;

  constructor(
    protected readonly paymentDomainService: PaymentDomainService,
    protected readonly type: LoanPaymentType,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.paymentType = this.type;
  }

  /**
   * Initiates a new loan payment for a specific loan lifecycle part
   * @param loanId The ID of the loan for which to initiate a payment
   * @returns The created loan payment or null if creation failed
   */
  public abstract initiate(loanId: string): Promise<ILoanPayment | ILoanPayment[] | null>;

  /**
   * Template method for initiating a payment - implements common steps while allowing
   * specific behaviors to be overridden by child classes
   * @param loanId The ID of the loan for which to initiate a payment
   * @returns The created loan payment or null if creation failed
   */
  protected async initiatePayment(loanId: string): Promise<ILoanPayment | null> {
    this.logger.debug(`Initiating ${this.paymentType} payment for loan ${loanId}`);
    
    // Get loan with necessary relations
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments, LOAN_RELATIONS.Biller, LOAN_RELATIONS.BillerPaymentAccount]);
    
    // Check for duplicate payment
    if (this.hasDuplicatePayment(loan.payments)) {
      this.logger.error(`${this.paymentType} payment already exists for loan ${loanId}`);
      return null;
    }
    
    // Get payment accounts
    const { fromAccountId, toAccountId } = await this.getPaymentAccounts(loan);
    if (!fromAccountId || !toAccountId) {
      return null; // Error already logged in getPaymentAccounts
    }
    
    // Get the Route with its steps
    const route = await this.findRouteForPayment(fromAccountId, toAccountId, loan.type);
    
    // Create payment with basic details
    const paymentAmount = this.getPaymentAmount(loan);
    const paymentOptions = this.getPaymentOptions(loan, paymentAmount);
    const payment = await this.paymentDomainService.createPayment({
      amount: paymentAmount,
      loanId,
      paymentNumber: null,
      type: this.paymentType,
      state: paymentOptions.state,
      completedAt: paymentOptions.completedAt,
      scheduledAt: paymentOptions.scheduledAt,
      initiatedAt: paymentOptions.initiatedAt,
    });

    if (!payment) {
      this.logger.error(`Failed to create ${this.paymentType} payment for loan ${loanId}`);
      return null;
    }
    
    // Generate and create payment steps
    const generatedSteps = this.generateStepsForPayment(payment, route, fromAccountId, toAccountId);
    if (!generatedSteps || !generatedSteps.length) {
      if (paymentOptions.state === LoanPaymentStateCodes.Completed) {
        // For zero amount payments we might not need steps
        return { ...payment, steps: [] };
      }
      this.logger.error(`Failed to generate ${this.paymentType} payment steps for loan`, { payment, route, fromAccountId, toAccountId });
      return null;
    }
    
    const savedSteps = await this.paymentDomainService.createPaymentSteps(generatedSteps);
    return { ...payment, steps: savedSteps };
  }

  /**
   * Checks if a duplicate payment of the current payment type already exists
   * @param payments Array of existing payments for the loan
   * @returns True if a duplicate payment exists, false otherwise
   */
  protected hasDuplicatePayment(payments: ILoanPayment[] | null): boolean {
    return !!payments && payments.some(payment => payment.type === this.paymentType);
  }

  /**
   * Gets the source and target payment account IDs for this payment type
   * Override this method in child classes to provide specific account mapping logic
   * @param loan The loan for which to get payment accounts
   * @returns Object containing fromAccountId and toAccountId
   */
  protected abstract getPaymentAccounts(loan: ILoan): Promise<PaymentAccountPair>;

  /**
   * Gets the payment amount for this payment type
   * Override this method in child classes if the amount differs from the loan amount
   * @param loan The loan for which to get the payment amount
   * @returns The payment amount
   */
  protected getPaymentAmount(loan: ILoan): number {
    return loan.amount; // Default to loan amount, override in specific manager if needed
  }

  /**
   * Gets the payment options (state, timestamps) for this payment type
   * Override this method in child classes if the options differ from the defaults
   * @param loan The loan for which to get payment options
   * @param amount The payment amount
   * @returns Object containing payment options
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getPaymentOptions(_loan: ILoan, _amount: number): PaymentOptions {
    // By default, return Created state with no timestamps
    return { state: LoanPaymentStateCodes.Created };
  }

  /**
   * Finds a route for the payment
   * @param fromAccountId Source account ID
   * @param toAccountId Target account ID
   * @param loanType Type of the loan
   * @returns The payment route or null if not found
   */
  protected async findRouteForPayment(fromAccountId: string, toAccountId: string, loanType: LoanType): Promise<IPaymentsRoute | null> {
    return this.paymentDomainService.findRouteForPayment(
      fromAccountId,
      toAccountId,
      this.paymentType,
      loanType
    );
  }

  /**
   * Advances the state of a loan payment based on step signals/events
   * @param loanPayment The loan payment to update
   * @param step The step that triggered the state change
   * @returns The updated loan payment or null if update failed
   */
  @Transactional()
  public async advance(loanPaymentId: string): Promise<boolean | null> {
    // Get all steps for this loan payment to determine overall state
    const loanPayment = await this.getPayment(loanPaymentId, [
      LOAN_PAYMENT_RELATIONS.Steps, 
      LOAN_PAYMENT_RELATIONS.StepsTransfers, 
      LOAN_PAYMENT_RELATIONS.StepsTransfersErrors,
    ]);
    const { state, steps } = loanPayment;
    // Sort steps by order ascending to process them in the correct sequence
    const paymentSteps = steps?.sort((a, b) => a.order - b.order) || null;
    
    // 1. should complete payment?
    const shouldCompletePayment = this.couldCompletePayment(paymentSteps) && state !== LoanPaymentStateCodes.Completed;
    if (shouldCompletePayment) {
      this.logger.debug(`Loan payment ${loanPaymentId} can be completed`);
      // Set Completed state and completion info (date)
      return this.paymentDomainService.completePayment(loanPaymentId);
    }
    // 2. should fail payment?
    const failReasonStepId = this.couldFailPayment(paymentSteps);
    if (failReasonStepId && state !== LoanPaymentStateCodes.Failed) {
      this.logger.debug(`Loan payment ${loanPaymentId} failed by ${failReasonStepId}`);
      // Set Failed state
      return this.paymentDomainService.failPayment(loanPaymentId, failReasonStepId);
    }
    // 3. should start next step?
    const nextStepId = this.couldStartNextStep(paymentSteps);
    if (nextStepId && (state === LoanPaymentStateCodes.Created || state === LoanPaymentStateCodes.Pending)) {
      this.logger.debug(`Loan payment ${loanPaymentId} can start next step ${nextStepId}`);
      // Set Pending state if needed - step advancement should be handled by management service
      const paymentStateUpdate = state === LoanPaymentStateCodes.Pending 
        ? true 
        : await this.paymentDomainService.updatePayment(loanPaymentId, { state: LoanPaymentStateCodes.Pending });
      return paymentStateUpdate;
    }
    // 4. TODO: States artifacts
    return false; // No state change needed
  }

  /**
   * Checks if Loan Payment can be considered completed.
   * 
   * We keep Payment completion requirements strict:
   * - If any Step is in `created` state - Payment should wait for initiation and completion
   * - If any Step is in `pending` state - Payment should wait for completion
   * - If any Step is in `failed` state - Payment should wait until Step is retried or fixed 
   * 
   * Thus Payment can be considered completed only if all Steps are in `completed` state or no steps exist.
   * @param steps Steps of the loan payment
   * @returns True if all steps are completed, false otherwise
   */
  protected couldCompletePayment(steps: ILoanPaymentStep[] | null): boolean {
    if (!steps || !steps.length) return true;
    return steps.every(step => step.state === PaymentStepStateCodes.Completed);
  }

  /**
   * Checks if the payment could fail based on its steps
   * 
   * A payment could fail if:
   * - There are steps that are not in `created` state
   * - The last active step (highest order) is in `failed` state
   * 
   * @param steps Steps of the loan payment
   * @returns The ID of the failed step that causes the payment to fail, or null if the payment should not fail
   */
  protected couldFailPayment(steps: ILoanPaymentStep[] | null): string | null {
    if (!steps || !steps.length) return null;
    
    // Filter out steps that are in Created state
    const activeSteps = steps.filter(step => step.state !== PaymentStepStateCodes.Created);
    
    if (!activeSteps.length) return null;
    
    // Sort steps by order to find the last one (highest order)
    const lastActiveStep = activeSteps.reduce((latest, current) => 
      latest.order > current.order ? latest : current
    );
    
    // Return the step ID if the last active step is in Failed state, otherwise null
    return lastActiveStep.state === PaymentStepStateCodes.Failed ? lastActiveStep.id : null;
  }

  /**
   * Determines the next step that can be started based on the current steps
   * This method finds the next step that is in `Created` state and follows the last completed step.
   * @param steps All steps of the loan payment
   * @returns The ID of the next step that can be started, or null if no step can be started
   */
  protected couldStartNextStep(steps: ILoanPaymentStep[] | null): string | null {
    // Returns the ID of the next step that can be started, or null if no step can be started
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

    return nextStep?.id || null;
  }

  protected async getLoan(loanId: string, relations?: LoanRelation[]): Promise<ILoan> {
    if (!loanId) {
      throw new MissingInputException('Missing Loan Id');
    }
    const loan = await this.paymentDomainService.getLoanById(loanId, relations);
    if (!loan) {
      throw new EntityNotFoundException('Loan not found');
    }
    return loan;
  }

  protected async getPayment(paymentId: string, relations?: LoanPaymentRelation[]): Promise<ILoanPayment> {
    if (!paymentId) {
      throw new MissingInputException('Missing payment ID');
    }
    const loanPayment = await this.paymentDomainService.getLoanPaymentById(paymentId, relations);
    if (!loanPayment) {
      throw new EntityNotFoundException('Payment account not found');
    }
    return loanPayment;
  }

  protected async getStep(stepId: string, relations?: LoanPaymentStepRelation[]): Promise<ILoanPaymentStep> {
    return this.paymentDomainService.getLoanPaymentStepById(stepId, relations);
  }

  /**
   * Creates a basic payment step from a route step
   * @param loanPaymentId The ID of the loan payment
   * @param amount The payment amount
   * @param stepToApply The route step to apply
   * @param fromAccountId Source account ID (fallback)
   * @param toAccountId Target account ID (fallback)
   * @param order The order of the step
   * @returns A payment step
   */
  protected createPaymentStep(
    loanPaymentId: string,
    amount: number,
    stepToApply: IPaymentsRouteStep,
    fromAccountId: string,
    toAccountId: string,
    order: number
  ): Partial<ILoanPaymentStep> {
    const { fromId, toId } = stepToApply;
    return {
      id: v4(), // We generate id here as TypeORM sometimes fails to generate multiple uuids within one transaction
      loanPaymentId,
      order,
      amount,
      sourcePaymentAccountId: fromId || fromAccountId,
      targetPaymentAccountId: toId || toAccountId,
      state: LoanPaymentStateCodes.Created,
      awaitStepState: order === 0 ? null : LoanPaymentStateCodes.Completed,
      awaitStepId: null,
    };
  }

  /**
   * Gets the route steps to apply for this payment type
   * Override this method in child classes to apply specific step selection logic
   * @param routeSteps Steps from the payment route
   * @returns The steps to apply for this payment type
   */
  protected getStepsToApply(routeSteps: IPaymentsRouteStep[]): IPaymentsRouteStep[] {
    return routeSteps; // By default, use all steps, override in specific managers
  }

  /**
   * Generates the steps required for a specific loan payment.
   * Should implement all Payment-specific validations, restrictions, etc.
   * @param payment The loan payment for which to generate steps
   * @param route The route defining the steps to be taken. Requires steps to be loaded
   * @param fromAccountId The ID of the source payment account
   * @param toAccountId The ID of the target payment account
   * @returns An array of loan payment steps to be created
   */
  protected generateStepsForPayment(
    payment: ILoanPayment | null, 
    route: IPaymentsRoute | null, 
    fromAccountId: string, 
    toAccountId: string
  ): Partial<ILoanPaymentStep>[] | null {
    if (!payment) {
      this.logger.error(`Failed to generate ${this.paymentType} payment steps for loan as payment was not provided`, 
        { payment, route, fromAccountId, toAccountId });
      return null;
    }

    if (!route || !route.steps) {
      this.logger.error(`Cant route ${this.paymentType} payment for Loan`, 
        { payment, route, fromAccountId, toAccountId });
      return null;
    }

    const { id: loanPaymentId, amount } = payment;
    const routeSteps = this.getStepsToApply(route.steps);
    const paymentSteps: Partial<ILoanPaymentStep>[] = [];

    for (let index = 0; index < routeSteps.length; index++) {
      const stepToApply = routeSteps[index];
      const paymentStep = this.createPaymentStep(
        loanPaymentId,
        amount,
        stepToApply,
        fromAccountId,
        toAccountId,
        index
      );
      paymentSteps.push(paymentStep);
    }

    return paymentSteps;
  }
}
