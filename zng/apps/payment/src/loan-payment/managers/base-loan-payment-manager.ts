import { Injectable, Logger } from '@nestjs/common';
import { LoanPaymentState, LoanPaymentStateCodes, LoanPaymentType, PaymentStepStateCodes } from '@library/entity/enum';
import { ILoan, ILoanPayment, ILoanPaymentStep, IPaymentsRoute, IPaymentsRouteStep } from '@library/entity/interface';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';
import { LOAN_PAYMENT_RELATIONS, LoanPaymentRelation, LoanPaymentStepRelation, LoanRelation } from '@library/shared/domain/entities/relations';
import { ILoanPaymentManager } from '../interfaces';
import { IDomainServices } from '@payment/domain/idomain.services';
import { DeepPartial } from 'typeorm';
import { LOAN_RELATIONS } from '@library/shared/domain/entities/relations';
import { v4 } from 'uuid';

/**
 * Base class for loan payment managers
 * Provides template methods and common functionality for loan payment processing
 */
@Injectable()
export abstract class BaseLoanPaymentManager implements ILoanPaymentManager {
  protected readonly logger: Logger;
  protected readonly paymentType: LoanPaymentType;

  constructor(
    protected readonly domainServices: IDomainServices,
    protected readonly type: LoanPaymentType,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.paymentType = type;
  }

  /**
   * Initiates a new loan payment for a specific loan lifecycle part
   * Template method pattern implementation for the payment initiation flow
   * @param loanId The ID of the loan for which to initiate a payment
   * @returns The created loan payment or null if creation failed
   */
  public async initiate(loanId: string): Promise<ILoanPayment | null> {
    this.logger.debug(`Initiating ${this.paymentType} payment for loan ${loanId}`);
    
    try {
      // 1. Get loan and validate required data
      const loan = await this.getLoan(loanId, this.getRequiredLoanRelations());
      
      // 2. Validate accounts and check for existing payment
      const validationResult = this.validateLoanAndAccounts(loan);
      if (!validationResult.isValid) {
        this.logger.warn(validationResult.message, validationResult.data);
        return null;
      }
      
      // 3. Get payment route
      const route = await this.findRouteForPayment(loan);
      if (!route) {
        this.logger.error(`Can't find route for ${this.paymentType} payment for loan ${loanId}`);
        return null;
      }

      // 4. Create payment
      const payment = await this.createPayment(loan);
      if (!payment) {
        this.logger.error(`Failed to create ${this.paymentType} payment for loan ${loanId}`);
        return null;
      }

      // 5. Generate and save steps
      const steps = await this.createPaymentSteps(payment, route, loan);
      if (!steps) {
        this.logger.error(`Failed to create steps for ${this.paymentType} payment for loan ${loanId}`);
        return null;
      }

      return { ...payment, steps };
    } catch (error) {
      this.logger.error(`Error initiating ${this.paymentType} payment for loan ${loanId}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Advances the state of a loan payment based on step signals/events
   * @param loanPaymentId The ID of the payment to advance
   * @returns Boolean indicating if the payment was advanced or null if an error occurred
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
    const loan = await this.domainServices.paymentServices.getLoanById(loanId, relations);
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

  /**
   * Returns the loan relations required for this payment type
   * @returns Array of loan relations needed for this payment type
   */
  protected getRequiredLoanRelations(): LoanRelation[] {
    return [LOAN_RELATIONS.Payments, LOAN_RELATIONS.Biller, LOAN_RELATIONS.BillerPaymentAccount];
  }

  /**
   * Validates that the loan has the required accounts and doesn't already have a payment of this type
   * @param loan The loan to validate
   * @returns Validation result object
   */
  protected validateLoanAndAccounts(loan: ILoan): { isValid: boolean; message: string; data?: Record<string, any> } {
    const { payments, lenderAccountId, biller } = loan;

    // Check if lender account exists
    if (!lenderAccountId) {
      return { 
        isValid: false, 
        message: `Lender account ID is missing for loan ${loan.id}`,
        data: { loanId: loan.id }, 
      };
    }

    // Check if biller and biller's payment account exists
    if (!biller || !biller.paymentAccountId) {
      return { 
        isValid: false, 
        message: `Biller or Biller's payment Account is missing for loan ${loan.id}`,
        data: { loanId: loan.id, biller }, 
      };
    }

    // Check if payment of this type already exists
    const existingPayment = payments && payments.find(payment => payment.type === this.paymentType);
    if (existingPayment) {
      return { 
        isValid: false, 
        message: `${this.paymentType} payment already exists for loan ${loan.id}`,
        data: { loanId: loan.id, paymentId: existingPayment.id }, 
      };
    }

    return { isValid: true, message: 'Validation passed' };
  }

  /**
   * Finds the payment route for this payment type
   * @param loan The loan for which to find a payment route
   * @returns The found payment route or null if no route was found
   */
  protected async findRouteForPayment(loan: ILoan): Promise<IPaymentsRoute | null> {
    const { lenderAccountId, biller, type } = loan;
    
    // Find the route for this payment type
    return this.domainServices.paymentServices.findRouteForPayment(
      lenderAccountId!, 
      biller!.paymentAccountId!, 
      this.paymentType, 
      type
    );
  }

  /**
   * Creates a payment entity for the loan
   * @param loan The loan for which to create a payment
   * @returns The created payment or null if creation failed
   */
  protected async createPayment(loan: ILoan): Promise<ILoanPayment | null> {
    const { id: loanId, amount } = loan;
    
    // Get payment amount from the loan (can be overridden in subclasses)
    const paymentAmount = this.getPaymentAmount(loan);

    // Special case for zero amount payments (e.g., fee payments)
    const completionDate = paymentAmount ? null : new Date();
    const creationState = paymentAmount ? LoanPaymentStateCodes.Created : LoanPaymentStateCodes.Completed;
    
    return this.domainServices.paymentServices.createPayment({
      amount: paymentAmount !== null ? paymentAmount : amount,
      loanId,
      paymentNumber: null,
      type: this.paymentType,
      state: creationState,
      completedAt: completionDate,
      scheduledAt: completionDate,
      initiatedAt: completionDate,
    });
  }

  /**
   * Gets the amount for this payment type from the loan
   * Default implementation returns the loan amount, but can be overridden in subclasses
   * @param loan The loan from which to get the payment amount
   * @returns The payment amount or null for special handling (e.g. zero amount)
   */
  protected getPaymentAmount(loan: ILoan): number | null {
    return loan.amount;
  }
  
  /**
   * Creates payment steps for the given payment and route
   * @param payment The payment for which to create steps
   * @param route The route to follow for creating steps
   * @param loan The loan associated with the payment
   * @returns The created payment steps or null if creation failed
   */
  protected async createPaymentSteps(
    payment: ILoanPayment, 
    route: IPaymentsRoute, 
    loan: ILoan
  ): Promise<ILoanPaymentStep[] | null> {
    if (!payment.amount) {
      // For zero amount payments, no steps are needed
      return [];
    }

    const { lenderAccountId, biller } = loan;
    const generatedSteps = this.generateStepsForPayment(
      payment, 
      route,
      lenderAccountId!, 
      biller!.paymentAccountId!
    );

    if (!generatedSteps || !generatedSteps.length) {
      return null;
    }

    return this.domainServices.paymentServices.createPaymentSteps(generatedSteps);
  }

  /**
   * Base implementation for generating payment steps from a payment route
   * This implementation handles common step creation logic
   * @param payment The payment for which to generate steps
   * @param route The route defining the payment path
   * @param fromAccountId The source account ID
   * @param toAccountId The target account ID
   * @returns Array of payment steps to be created
   */
  protected generateBasePaymentSteps(
    payment: ILoanPayment | null,
    route: IPaymentsRoute | null,
    routeSteps: IPaymentsRouteStep[],
    fromAccountId: string,
    toAccountId: string
  ): DeepPartial<ILoanPaymentStep>[] | null {
    if (!payment) {
      this.logger.error(`Failed to generate ${this.paymentType} payment steps as payment was not provided`, 
        { payment, route, fromAccountId, toAccountId });
      return null;
    }

    if (!routeSteps || routeSteps.length === 0) {
      this.logger.error(`No steps found for ${this.paymentType} payment route`, 
        { payment, route, fromAccountId, toAccountId });
      return null;
    }

    const { id: loanPaymentId, amount } = payment;
    const paymentSteps: DeepPartial<ILoanPaymentStep>[] = [];

    for (let index = 0; index < routeSteps.length; index++) {
      const stepToApply = routeSteps[index];
      const { fromId, toId } = stepToApply;
      const paymentStep: DeepPartial<ILoanPaymentStep> = {
        id: v4(), // We generate id here as TypeORM sometimes fails to generate multiple uuids within one transaction
        loanPaymentId,
        order: index,
        amount,
        sourcePaymentAccountId: fromId || fromAccountId,
        targetPaymentAccountId: toId || toAccountId,
        state: LoanPaymentStateCodes.Created,
        awaitStepState: index === 0 ? null : LoanPaymentStateCodes.Completed,
        awaitStepId: null,
      };
      paymentSteps.push(paymentStep);
    }

    return paymentSteps;
  }

  /**
   * Generates the steps required for a specific loan payment.
   * Should implement payment-type specific step selection logic.
   * @param payment The loan payment for which to generate steps
   * @param route The route defining the steps to be taken. Requires steps to be loaded
   * @param fromAccountId The ID of the source payment account
   * @param toAccountId The ID of the target payment account
   * @returns An array of loan payment steps to be created
   */
  protected abstract generateStepsForPayment(
    payment: ILoanPayment | null, 
    route: IPaymentsRoute | null, 
    fromAccountId: string, 
    toAccountId: string
  ): DeepPartial<ILoanPaymentStep>[] | null;
}
