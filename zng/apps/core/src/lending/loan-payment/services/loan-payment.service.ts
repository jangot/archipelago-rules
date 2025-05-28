import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../../domain/entities/loan.entity';
import { LoanPayment } from '../../../domain/entities/loan.payment.entity';
import { LoanPaymentFactory } from '../loan-payment.factory';
import { LoanPaymentStepManager } from './loan-payment-step-manager.service';
import { LoanType, LoanPaymentType, LoanState, LoanStateCodes, LoanPaymentTypeCodes } from '@library/entity/enum';

/**
 * Service for creating and managing loan payments throughout the loan lifecycle
 */
@Injectable()
export class LoanPaymentService {
  private readonly logger: Logger = new Logger(LoanPaymentService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanPayment)
    private readonly loanPaymentRepository: Repository<LoanPayment>,
    private readonly loanPaymentFactory: LoanPaymentFactory,
    private readonly loanPaymentStepManager: LoanPaymentStepManager,
  ) {}

  /**
   * Initiates a payment for a loan based on its current lifecycle stage
   * @param loanId The ID of the loan for which to initiate a payment
   * @param routeId The ID of the payment route to use
   * @param lifecyclePart Optional lifecycle part (if not provided, determined from loan state)
   * @returns The created loan payment or null if creation failed
   */
  public async initiatePayment(
    loanId: string, 
    routeId: string,
    lifecyclePart?: string
  ): Promise<LoanPayment | null> {
    try {
      // Get the loan with related entities needed for payment processing
      const loan = await this.loanRepository.findOne({
        where: { id: loanId },
        relations: ['lender', 'borrower', 'biller', 'lenderAccount', 'borrowerAccount'],
      });

      if (!loan) {
        this.logger.error(`Loan with ID ${loanId} not found`);
        return null;
      }

      // If lifecycle part not provided, determine it from loan state
      if (!lifecyclePart) {
        lifecyclePart = this.determineLifecyclePart(loan);
      }

      // More broken / wrong code here.
      // Get the appropriate loan payment manager
      // const manager = this.loanPaymentFactory.getManager(lifecyclePart, loan.type);

      // // Initiate the payment using the manager
      // let payment: LoanPayment | null;
      
      // // Special handling for repayment which may need payment number
      // if (lifecyclePart === LoanPaymentFactory.REPAYMENT) {
      //   // Find the next payment number
      //   const paymentNumber = await this.determineNextRepaymentNumber(loan);
      //   payment = await (manager as any).initiate(loan, routeId, paymentNumber);
      // } else {
      //   payment = await manager.initiate(loan, routeId);
      // }

      // if (!payment) {
      //   return null;
      // }

      // Create the payment steps
      // const steps = await this.loanPaymentStepManager.createSteps(payment, routeId);
      
      // if (!steps) {
      //   // If step creation failed, try to remove the payment
      //   await this.loanPaymentRepository.remove(payment);
      //   return null;
      // }

      // return payment;
      return null;
    } catch (error) {
      this.logger.error(`Failed to initiate payment: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Determines the loan lifecycle part based on the loan's current state
   * @param loan The loan for which to determine lifecycle part
   * @returns The determined lifecycle part
   */
  private determineLifecyclePart(loan: Loan): string {
    // Map loan states to lifecycle parts
    // switch (loan.state) {
    //   case LoanStateCodes.Created:
    //   case LoanStateCodes.Accepted:
    //     return LoanPaymentFactory.FUNDING;
      
    //   case LoanStateCodes.Funded:
    //     return LoanPaymentFactory.DISBURSEMENT;
      
    //   case LoanStateCodes.Repaying:
    //     return LoanPaymentFactory.REPAYMENT;
      
    //     // Additional states would map to appropriate lifecycle parts
      
    //   default:
    //     this.logger.warn(`Could not determine lifecycle part for loan state: ${loan.state}`);
    //     throw new Error(`Unsupported loan state for payment initiation: ${loan.state}`);
    // }
    // No idea what should be returned here, or even if it should be in this class or not.
    return LoanPaymentTypeCodes.Funding;
  }

  /**
   * Determines the next repayment number for a loan
   * @param loan The loan for which to determine the next repayment number
   * @returns The next repayment number
   */
  private async determineNextRepaymentNumber(loan: Loan): Promise<number> {
    // Find the latest repayment payment
    const latestRepayment = await this.loanPaymentRepository.findOne({
      where: {
        loanId: loan.id,
        type: LoanPaymentTypeCodes.Repayment,
      },
      order: { paymentNumber: 'DESC' },
    });

    // If there's no repayment yet, start with 1
    if (!latestRepayment || !latestRepayment.paymentNumber) {
      return 1;
    }

    // Otherwise, increment the number
    return latestRepayment.paymentNumber + 1;
  }

  /**
   * Processes a loan payment by initiating the next eligible step
   * @param loanPaymentId The ID of the loan payment to process
   * @returns True if processing succeeded, false otherwise
   */
  public async processPayment(loanPaymentId: string): Promise<boolean> {
    try {
      const step = await this.loanPaymentStepManager.processNextEligibleStep(loanPaymentId);
      return !!step;
    } catch (error) {
      this.logger.error(`Failed to process payment ${loanPaymentId}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Gets all payments for a loan
   * @param loanId The ID of the loan
   * @returns Array of loan payments or null if retrieval failed
   */
  public async getPaymentsForLoan(loanId: string): Promise<LoanPayment[] | null> {
    try {
      return await this.loanPaymentRepository.find({
        where: { loanId },
        relations: ['steps'],
        order: { createdAt: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Failed to get payments for loan ${loanId}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Gets a specific payment by ID
   * @param paymentId The ID of the payment to get
   * @returns The loan payment or null if not found
   */
  public async getPaymentById(paymentId: string): Promise<LoanPayment | null> {
    try {
      return await this.loanPaymentRepository.findOne({
        where: { id: paymentId },
        relations: ['steps', 'loan'],
      });
    } catch (error) {
      this.logger.error(`Failed to get payment ${paymentId}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Cancels a loan payment if it's in a cancellable state
   * @param paymentId The ID of the payment to cancel
   * @returns True if cancellation succeeded, false otherwise
   */
  public async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      // Implement cancellation logic here
      // This would include checking if payment can be cancelled,
      // updating payment state, and potentially notifying other services
      
      return false; // Not implemented yet
    } catch (error) {
      this.logger.error(`Failed to cancel payment ${paymentId}: ${error.message}`, error.stack);
      return false;
    }
  }

  /*
  // TODO: Implement when needed
  public async retryFailedPayment(paymentId: string): Promise<boolean> {
    // Logic to retry a failed payment
  }

  public async findScheduledPayments(): Promise<LoanPayment[]> {
    // Find payments that are scheduled for execution at or before current time
  }
  */
}
