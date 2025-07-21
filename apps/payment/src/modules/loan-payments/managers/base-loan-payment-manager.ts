import { LoanPaymentState, LoanPaymentStateCodes, LoanPaymentType, LoanType, PaymentStepStateCodes } from '@library/entity/enum';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exception/domain';
import { Loan, LoanPayment, LoanPaymentStep, PaymentsRoute, PaymentsRouteStep } from '@library/shared/domain/entity';
import { LOAN_PAYMENT_RELATIONS, LOAN_RELATIONS, LoanPaymentRelation, LoanRelation } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { Transactional } from 'typeorm-transactional';
import { v4 } from 'uuid';
import { ILoanPaymentManager } from '../interfaces';

/**
 * Interface for payment account pairs used in transfers between loan participants
 * 
 * @interface PaymentAccountPair
 * @property fromAccountId - The source account ID for the payment transfer, or null if not available
 * @property toAccountId - The target account ID for the payment transfer, or null if not available
 */
export interface PaymentAccountPair {
  fromAccountId: string | null;
  toAccountId: string | null;
}

/**
 * Base abstract class for loan payment managers implementing the Template Method pattern.
 * 
 * This class provides the common framework for handling different types of loan payments
 * (Funding, Disbursement, Repayment, Fee, Refund) throughout the loan lifecycle.
 * Each payment type has its own manager that extends this base class and implements
 * specific business logic while leveraging common payment processing patterns.
 * 
 * ## Design Pattern
 * Implements the Template Method pattern where:
 * - Common payment processing logic is defined in the base class
 * - Specific payment type behaviors are implemented in concrete subclasses
 * - Payment state management follows a consistent state machine across all payment types
 * 
 * ## Payment Lifecycle
 * 1. **Initiation**: Validate loan state, resolve accounts, calculate amounts, generate steps
 * 2. **Advancement**: Process payment through states based on step completion/failure
 * 3. **Completion**: Mark payment as completed when all steps are successfully executed
 * 
 * ## State Machine
 * Payment states: Created → Pending → Completed/Failed
 * Step states: Created → Pending → Completed/Failed
 * 
 * @abstract
 * @class BaseLoanPaymentManager
 * @implements {ILoanPaymentManager}
 */
@Injectable()
export abstract class BaseLoanPaymentManager implements ILoanPaymentManager {
  // #region Class Properties and Constructor
  
  protected readonly logger: Logger;
  protected readonly paymentType: LoanPaymentType;

  /**
   * Initializes a new loan payment manager instance.
   * 
   * @param paymentDomainService - The domain service for payment operations
   * @param type - The specific loan payment type this manager handles
   */
  constructor(
    protected readonly paymentDomainService: PaymentDomainService,
    protected readonly type: LoanPaymentType,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.paymentType = this.type;
  }
  
  // #endregion

  // #region Public Interface Methods

  /**
   * Initiates a new loan payment for the specified loan.
   * 
   * This is the main entry point for creating a new payment. It orchestrates the entire
   * payment creation process including validation, account resolution, route discovery,
   * payment calculation, and step generation.
   * 
   * ## Process Flow
   * 1. Load loan with required relations for payment processing
   * 2. Validate that payment can be initiated (no duplicate payments)
   * 3. Resolve payment accounts based on payment type and loan configuration
   * 4. Find the appropriate payment route for the account pair and loan type
   * 5. Calculate payment details (amount, scheduling, etc.)
   * 6. Create the payment record in the database
   * 7. Generate and save payment steps based on the route
   * 8. Return the complete payment with its steps
   * 
   * @param loanId - The ID of the loan for which to initiate the payment
   * @returns The created loan payment with its steps, or null if creation failed
   * @throws {MissingInputException} When loanId is not provided
   * @throws {EntityNotFoundException} When the loan is not found
   */
  public async initiate(loanId: string): Promise<LoanPayment | null> {
    this.logger.debug(`Initiating new ${this.paymentType} payment for loan ${loanId}`);
    
    // Get loan with necessary relations
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments, LOAN_RELATIONS.Biller, LOAN_RELATIONS.BillerPaymentAccount]);
    const { type: loanType } = loan;

    // Check if payment can be initiated by validating payments states
    // Logging is done in canInitiatePayment method
    const canInitiate = this.canInitiatePayment(loan);
    if (!canInitiate) return null;

    // Get payment accounts by explicit payment type implementation
    const { fromAccountId, toAccountId } = await this.getPaymentAccounts(loan);
    if (!fromAccountId || !toAccountId) return null;

    // Get the route with its steps
    const route = await this.findRouteForPayment(fromAccountId, toAccountId, loanType);

    // Since different payment managers could have different logic for payment calculations - they should provide their own implementation of Payment generation
    const calculatedPayment = this.calculateNewPayment(loan);
    if (!calculatedPayment) return null; // Error already logged in calculateNewPayment

    // Save calculated Payment to continue with steps generation
    const newPayment = await this.paymentDomainService.createPayment(calculatedPayment);
    if (!newPayment) {
      this.logger.error(`Failed to create new ${this.paymentType} payment for loan ${loanId}`);
      return null;
    }

    // Generate steps for the new payment
    const generatedSteps = this.generateStepsForPayment(newPayment, route, fromAccountId, toAccountId);
    if (!generatedSteps || !generatedSteps.length) {
      this.logger.error('Failed to generate payment steps for loan', { newPayment, route, fromAccountId, toAccountId });
      return null;
    }
    // Save the generated steps
    await this.paymentDomainService.createPaymentSteps(generatedSteps);

    // Return the saved payment with its steps
    return this.paymentDomainService.getLoanPaymentById(newPayment.id, [LOAN_PAYMENT_RELATIONS.Steps]);
  }

  /**
   * Advances the state of a loan payment based on the current state of its steps.
   * 
   * This method implements the payment state machine by analyzing the current state
   * of all payment steps and determining what state transition should occur next.
   * It handles the progression from Created → Pending → Completed/Failed.
   * 
   * ## State Transition Logic
   * 1. **Completion Check**: If all steps are completed and payment isn't already completed
   * 2. **Failure Check**: If the last active step is failed and payment isn't already failed
   * 3. **Next Step Check**: If there's a next step ready to start and payment is in appropriate state
   * 4. **No Change**: If no state transition is needed
   * 
   * ## Return Values
   * - `true`: Payment state was successfully updated
   * - `false`: No state change was needed (normal operation)
   * - `null`: State update failed (error condition)
   * 
   * @param loanPaymentId - The ID of the loan payment to advance
   * @returns Boolean indicating if payment was advanced, false if no update needed, null if failed
   * @throws {MissingInputException} When loanPaymentId is not provided
   * @throws {EntityNotFoundException} When the payment is not found
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
  
  // #endregion

  // #region Payment Initiation Logic

  /**
   * Determines if a new payment can be initiated for the given loan.
   * 
   * This method implements the business rules for payment initiation validation:
   * - Always allow the first payment of any type for a loan
   * - Prevent duplicate initiated payments (Created or Pending state)
   * - Handle post-completion initiation logic via template method hook
   * 
   * @param loan - The loan entity with payments loaded
   * @returns True if payment can be initiated, false otherwise
   */
  protected canInitiatePayment(loan: Loan): boolean {
    const { id: loanId, payments } = loan;
  
    // Fast return for the first payment initiation
    if (!payments || !payments.length) return true;
  
    // Check already initiated payments
    const initiatedPayments = this.getSameInitiatedPayments(payments);
    if (initiatedPayments && initiatedPayments.length) {
      this.logger.error(`${this.paymentType} payment already initiated for loan ${loanId}`);
      return false;
    }
  
    // Check payment for existed completion
    const completedPayments = this.getSameCompletedPayments(payments);
    if (completedPayments && completedPayments.length) {
      return this.canInitiateAfterCompleted(loan, completedPayments);
    }
  
    return true;
  }

  /**
   * Template method hook for handling payment initiation after completion.
   * 
   * Override this method in child classes to implement payment-type-specific logic
   * for handling situations where payments of this type have already been completed.
   * For example, repayment payments may allow multiple instances, while funding
   * payments typically only allow one completion.
   * 
   * @param loan - The loan entity
   * @param completedPayments - Array of completed payments of the same type
   * @returns True if another payment can be initiated, false otherwise
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected canInitiateAfterCompleted(loan: Loan, completedPayments: LoanPayment[]): boolean {
    const { id: loanId } = loan;
    this.logger.error(`${this.paymentType} payment already completed for loan ${loanId}`);
    return false; // Default behavior for single-payment types
  }

  /**
   * Calculates and returns a new loan payment object with default values.
   * 
   * This method creates a partial loan payment object containing the calculated payment amount,
   * attempt tracking for failed payments and other fields.
   * The attempt counter is incremented based on the number of previously failed payment attempts
   * for the same loan.
   * 
   * @param loan - The loan object containing payment history and loan details
   * @returns A partial loan payment object with calculated values, or null if payment cannot be calculated

   */
  protected calculateNewPayment(loan: Loan): Partial<LoanPayment> | null {
    const { id: loanId, payments } = loan;
    const amount = this.getPaymentAmount(loan);
    const failedAttempts = this.getSameFailedPayments(payments);
    const attempt = failedAttempts && failedAttempts.length ? failedAttempts.length : 0;

    return {
      amount,
      loanId,
      type: this.paymentType,
      state: LoanPaymentStateCodes.Created,
      attempt,
      paymentNumber: null,
      scheduledAt: new Date(),
    };
  }

  /**
   * Resolves and validates payment accounts for the current payment type.
   * 
   * This method delegates to the abstract getAccountPairForPaymentType method
   * to get payment-type-specific account resolution, then validates that both
   * source and target accounts are available.
   * 
   * @param loan - The loan entity with account information
   * @returns Payment account pair with validated account IDs, or null accounts if validation fails
   */
  protected async getPaymentAccounts(loan: Loan): Promise<PaymentAccountPair> {
    const accountPair = this.getAccountPairForPaymentType(loan);
  
    if (!accountPair.fromAccountId) {
      this.logger.warn(`Source account ID is missing for loan ${loan.id}`);
      return { fromAccountId: null, toAccountId: null };
    }

    if (!accountPair.toAccountId) {
      this.logger.warn(`Target account ID is missing for loan ${loan.id}`);
      return { fromAccountId: null, toAccountId: null };
    }

    return accountPair;
  }

  /**
   * Finds the appropriate payment route for the given account pair and loan type.
   * 
   * Payment routes define the sequence of steps (transfers) needed to complete
   * a payment between the source and target accounts. Different payment types
   * and loan types may require different routing strategies.
   * 
   * @param fromAccountId - Source account ID for the payment
   * @param toAccountId - Target account ID for the payment
   * @param loanType - Type of the loan requiring the payment
   * @returns The payment route with steps, or null if no route found
   */
  protected async findRouteForPayment(fromAccountId: string, toAccountId: string, loanType: LoanType): Promise<PaymentsRoute | null> {
    return this.paymentDomainService.findRouteForPayment(
      fromAccountId,
      toAccountId,
      this.paymentType,
      loanType
    );
  }

  /**
   * Generates the sequence of payment steps required for executing a payment.
   * 
   * This method transforms the abstract payment route into concrete payment steps
   * that can be executed by the payment processing system. Each step represents
   * a specific transfer operation with source/target accounts and amounts.
   * 
   * ## Process Flow
   * 1. Validate payment and route inputs
   * 2. Filter route steps based on payment type requirements
   * 3. Create payment step objects with proper sequencing
   * 4. Set up step dependencies and await conditions
   * 
   * @param payment - The loan payment for which to generate steps
   * @param route - The route defining the steps to be taken (requires steps to be loaded)
   * @param fromAccountId - The ID of the source payment account (fallback)
   * @param toAccountId - The ID of the target payment account (fallback)
   * @returns Array of loan payment steps ready for creation, or null if generation failed
   */
  protected generateStepsForPayment(
    payment: LoanPayment | null, 
    route: PaymentsRoute | null, 
    fromAccountId: string, 
    toAccountId: string
  ): Partial<LoanPaymentStep>[] | null {
    if (!payment) {
      this.logger.error(`Failed to generate ${this.paymentType} payment steps for loan as payment was not provided`, 
        { payment, route, fromAccountId, toAccountId });
      return null;
    }

    if (!route || !route.steps) {
      this.logger.error(`Cannot route ${this.paymentType} payment for Loan`, 
        { payment, route, fromAccountId, toAccountId });
      return null;
    }

    const { id: loanPaymentId, amount } = payment;
    const routeSteps = this.getStepsToApply(route.steps);
    const paymentSteps: Partial<LoanPaymentStep>[] = [];

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

  /**
   * Creates a payment step from a route step template.
   * 
   * This method converts a route step definition into a concrete payment step
   * with all necessary details for execution. It handles account ID resolution
   * using route-specific accounts or fallback to payment-level accounts.
   * 
   * @param loanPaymentId - The ID of the loan payment this step belongs to
   * @param amount - The payment amount for this step
   * @param stepToApply - The route step template to convert
   * @param fromAccountId - Fallback source account ID if not specified in route step
   * @param toAccountId - Fallback target account ID if not specified in route step
   * @param order - The execution order of this step (0-based)
   * @returns A payment step object ready for database creation
   */
  protected createPaymentStep(
    loanPaymentId: string,
    amount: number,
    stepToApply: PaymentsRouteStep,
    fromAccountId: string,
    toAccountId: string,
    order: number
  ): Partial<LoanPaymentStep> {
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
  
  // #endregion

  // #region Payment State Advancement Logic

  /**
   * Evaluates whether a loan payment can be considered completed.
   * 
   * This method implements strict completion requirements to ensure payment integrity:
   * - All steps must be in 'completed' state
   * - No steps in 'created', 'pending', or 'failed' states are allowed
   * - Payments with no steps are considered immediately completed
   * 
   * This conservative approach ensures that payments are only marked complete
   * when all constituent operations have been successfully executed.
   * 
   * @param steps - The payment steps to evaluate for completion
   * @returns True if all steps are completed or no steps exist, false otherwise
   */
  protected couldCompletePayment(steps: LoanPaymentStep[] | null): boolean {
    if (!steps || !steps.length) return true;
    return steps.every(step => step.state === PaymentStepStateCodes.Completed);
  }

  /**
   * Determines if a payment should be marked as failed based on its step states.
   * 
   * The failure logic focuses on the progression of payment execution:
   * - Only considers steps that have moved beyond 'created' state (active steps)
   * - Identifies the step with the highest execution order (latest in sequence)
   * - Fails the payment if this latest step is in 'failed' state
   * 
   * This approach ensures that payment failure is determined by the furthest
   * point of execution, not by isolated step failures that might be retried.
   * 
   * @param steps - The payment steps to evaluate for failure conditions
   * @returns The ID of the failed step causing payment failure, or null if payment should not fail
   */
  protected couldFailPayment(steps: LoanPaymentStep[] | null): string | null {
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
  protected couldStartNextStep(steps: LoanPaymentStep[] | null): string | null {
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
  
  // #endregion

  // #region Payment Filtering and Classification

  /**
   * Filters payments to find those of the current type in initiated states.
   * 
   * Initiated payments are those that have been created but not yet completed or failed.
   * This includes payments in 'created' and 'pending' states.
   * 
   * @param payments - Array of loan payments to filter
   * @returns Array of payments matching the current type in initiated states
   */
  protected getSameInitiatedPayments(payments: LoanPayment[] | null): LoanPayment[] {
    if (!payments) return [];
    return this.getSamePayments(payments, ['created', 'pending']);
  }

  /**
   * Filters payments to find those of the current type in completed state.
   * 
   * @param payments - Array of loan payments to filter
   * @returns Array of payments matching the current type in completed state
   */
  protected getSameCompletedPayments(payments: LoanPayment[] | null): LoanPayment[] {
    if (!payments) return [];
    return this.getSamePayments(payments, ['completed']);
  }

  /**
   * Filters payments to find those of the current type in failed state.
   * 
   * @param payments - Array of loan payments to filter
   * @returns Array of payments matching the current type in failed state
   */
  protected getSameFailedPayments(payments: LoanPayment[] | null): LoanPayment[] {
    if (!payments) return [];
    return this.getSamePayments(payments, ['failed']);
  }

  /**
   * Generic method for filtering payments by type and state.
   * 
   * This utility method provides the core filtering logic used by the specific
   * payment state filter methods. It ensures consistent filtering behavior
   * across all payment state classifications.
   * 
   * @param payments - Array of existing payments for the loan
   * @param statesFilter - Array of payment states to filter by
   * @returns Array of payments matching the current payment type and specified states
   */
  protected getSamePayments(payments: LoanPayment[] | null, statesFilter: LoanPaymentState[]): LoanPayment[] {
    if (!payments) return [];
    return payments.filter(payment => payment.type === this.paymentType && statesFilter.includes(payment.state));
  }
  
  // #endregion

  // #region Data Access and Validation

  /**
   * Retrieves and validates a loan entity by ID.
   * 
   * This method provides centralized loan retrieval with consistent error handling
   * and optional relation loading for payment processing operations.
   * 
   * @param loanId - The ID of the loan to retrieve
   * @param relations - Optional array of relations to load with the loan
   * @returns The loan entity with requested relations loaded
   * @throws {MissingInputException} When loanId is not provided
   * @throws {EntityNotFoundException} When the loan is not found
   */
  protected async getLoan(loanId: string, relations?: LoanRelation[]): Promise<Loan> {
    if (!loanId) {
      throw new MissingInputException('Missing Loan Id');
    }
    const loan = await this.paymentDomainService.getLoanById(loanId, relations);
    if (!loan) {
      throw new EntityNotFoundException('Loan not found');
    }
    return loan;
  }

  /**
   * Retrieves and validates a loan payment entity by ID.
   * 
   * This method provides centralized payment retrieval with consistent error handling
   * and optional relation loading for payment advancement operations.
   * 
   * @param paymentId - The ID of the payment to retrieve
   * @param relations - Optional array of relations to load with the payment
   * @returns The loan payment entity with requested relations loaded
   * @throws {MissingInputException} When paymentId is not provided
   * @throws {EntityNotFoundException} When the payment is not found
   */
  protected async getPayment(paymentId: string, relations?: LoanPaymentRelation[]): Promise<LoanPayment> {
    if (!paymentId) {
      throw new MissingInputException('Missing payment ID');
    }
    const loanPayment = await this.paymentDomainService.getLoanPaymentById(paymentId, relations);
    if (!loanPayment) {
      throw new EntityNotFoundException('Payment not found');
    }
    return loanPayment;
  }
  
  // #endregion

  // #region Template Method Hooks (Abstract/Protected)

  /**
   * Abstract method for resolving payment accounts based on payment type.
   * 
   * Each payment type has specific rules for determining the source and target
   * accounts for the payment transfer. For example:
   * - Funding: lender → biller account
   * - Repayment: borrower → lender account
   * 
   * Concrete implementations must override this method to provide payment-type-specific
   * account resolution logic.
   * 
   * @param loan - The loan entity containing account information
   * @returns Payment account pair with source and target account IDs
   */
  protected abstract getAccountPairForPaymentType(loan: Loan): PaymentAccountPair;

  /**
   * Template method hook for calculating payment-type-specific amounts.
   * 
   * Override this method in child classes when the payment amount calculation
   * differs from the default loan amount. Examples:
   * - Funding payments may include fees: `loan.amount + loan.feeAmount`
   * - Fee payments use only the fee amount: `loan.feeAmount`
   * - Repayment payments may use calculated installment amounts
   * 
   * @param loan - The loan for which to calculate the payment amount
   * @returns The calculated payment amount for this payment type
   */
  protected getPaymentAmount(loan: Loan): number {
    return loan.amount; // Default to loan amount, override in specific manager if needed
  }

  /**
   * Template method hook for filtering route steps based on payment type requirements.
   * 
   * Some payment types may need to use only a subset of the available route steps.
   * For example, in a combined funding+disbursement route:
   * - Funding payment uses only the first step
   * - Disbursement payment uses all steps except the first
   * 
   * Override this method in child classes to implement payment-type-specific
   * step selection logic.
   * 
   * @param routeSteps - All available steps from the payment route
   * @returns The subset of steps that should be applied for this payment type
   */
  protected getStepsToApply(routeSteps: PaymentsRouteStep[]): PaymentsRouteStep[] {
    return routeSteps; // By default, use all steps, override in specific managers
  }
  
  // #endregion
}
