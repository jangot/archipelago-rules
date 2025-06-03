import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanPaymentFactory } from '../loan-payment.factory';
import { PaymentStepState, PaymentStepStateCodes } from '@library/entity/enum';
import { LoanPayment, LoanPaymentStep } from '@library/shared/domain/entities';

/**
 * Service responsible for coordinating and managing loan payment steps
 */
@Injectable()
export class LoanPaymentStepManager {
  private readonly logger: Logger = new Logger(LoanPaymentStepManager.name);

  constructor(
    @InjectRepository(LoanPaymentStep)
    private readonly loanPaymentStepRepository: Repository<LoanPaymentStep>,
    @InjectRepository(LoanPayment)
    private readonly loanPaymentRepository: Repository<LoanPayment>,
    private readonly loanPaymentFactory: LoanPaymentFactory,
  ) {}

  /**
   * Creates payment steps for a loan payment based on the payment route
   * @param loanPayment The loan payment for which to create steps
   * @param routeId The ID of the payment route to use
   * @returns Array of created payment steps or null if creation failed
   */
  public async createSteps(loanPayment: LoanPayment, routeId: string): Promise<LoanPaymentStep[] | null> {
    try {
      // TODO: Get route configuration from a PaymentRouteService using routeId
      // This would contain step definitions including source/target account types,
      // step order, and dependencies
      
      // For now, we'll create a simple placeholder/mock step
      const mockStep = this.loanPaymentStepRepository.create({
        loanPaymentId: loanPayment.id,
        loanPayment: loanPayment,
        order: 0,
        amount: loanPayment.amount,
        // Mock source/target account IDs would come from the route configuration
        sourcePaymentAccountId: 'mock-source-id',
        targetPaymentAccountId: 'mock-target-id',
        state: PaymentStepStateCodes.Created,
        awaitStepState: null, // First step doesn't wait
        awaitStepId: null,
      });

      // Save the step
      const savedStep = await this.loanPaymentStepRepository.save(mockStep);
      
      this.logger.log(`Created payment step ${savedStep.id} for loan payment ${loanPayment.id}`);
      
      return [savedStep];
    } catch (error) {
      this.logger.error(`Failed to create payment steps: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Updates a payment step's state and propagates changes to the parent payment
   * @param step The step to update
   * @param newState The new state of the step
   * @returns The updated step or null if update failed
   */
  public async updateStepState(step: LoanPaymentStep, newState: PaymentStepState): Promise<LoanPaymentStep | null> {
    try {
      // Update the step state
      step.state = newState;
      const updatedStep = await this.loanPaymentStepRepository.save(step);
      
      // Get the loan payment
      const loanPayment = await this.loanPaymentRepository.findOne({
        where: { id: step.loanPaymentId },
        relations: ['loan'],
      });
      
      if (!loanPayment) {
        this.logger.error(`Loan payment ${step.loanPaymentId} not found for step ${step.id}`);
        return updatedStep;
      }
      
      // Get the appropriate manager and advance the payment state
      const manager = this.loanPaymentFactory.getManager(loanPayment.type);
      await manager.advance(loanPayment.id);
      
      return updatedStep;
    } catch (error) {
      this.logger.error(`Failed to update step state: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Processes the next eligible step in a payment
   * This would be called by a scheduler or event handler
   * @param loanPaymentId The ID of the loan payment to process
   * @returns The processed step or null if no eligible step found or processing failed
   */
  public async processNextEligibleStep(loanPaymentId: string): Promise<LoanPaymentStep | null> {
    try {
      // Get all steps for the payment ordered by step order
      const steps = await this.loanPaymentStepRepository.find({
        where: { loanPaymentId },
        order: { order: 'ASC' },
      });
      
      if (!steps || steps.length === 0) {
        this.logger.warn(`No steps found for loan payment ${loanPaymentId}`);
        return null;
      }
      
      // Find the first step that's eligible to be processed
      for (const step of steps) {
        if (step.state !== PaymentStepStateCodes.Created) {
          continue; // Skip steps that aren't in created state
        }
        
        // Check if this step is waiting for a previous step
        if (step.awaitStepId) {
          const awaitStep = steps.find(s => s.id === step.awaitStepId);
          if (!awaitStep || awaitStep.state !== step.awaitStepState) {
            continue; // Skip if waiting for a step that's not in the right state
          }
        } else if (step.order > 0 && step.awaitStepState) {
          // If no specific step ID but has await state, check the previous step by order
          const prevStep = steps.find(s => s.order === step.order - 1);
          if (!prevStep || prevStep.state !== step.awaitStepState) {
            continue; // Skip if previous step isn't in the right state
          }
        }
        
        // This step is eligible for processing
        // TODO: Initiate the actual transfer here or send to a transfer service
        // For now, just update the state to pending
        return await this.updateStepState(step, PaymentStepStateCodes.Pending);
      }
      
      this.logger.debug(`No eligible steps found for loan payment ${loanPaymentId}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to process next eligible step: ${error.message}`, error.stack);
      return null;
    }
  }

  /*
  // TODO: Implement when needed
  public async getPaymentStepsProgress(loanPaymentId: string): Promise<{ completed: number, total: number }> {
    // Get progress information about steps completion
  }

  public async retryFailedStep(stepId: string): Promise<LoanPaymentStep | null> {
    // Logic to retry a failed payment step
  }
  */
}
