import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanState, LoanStateCodes, PaymentAccountStateCodes } from '@library/entity/enum';
import { LOAN_STANDARD_RELATIONS, LoanRelation } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { ILoanStateManager, IPaymentEvaluationStrategy, StateDecision } from '../interfaces';
import { StatesManagersLogic } from './states-managers-logic.service';
import { AcceptedLoanStrategy, ClosedLoanStrategy, DisbursementPaymentStrategy, FundingPaymentStrategy, RepaymentStrategy } from './strategy';

@Injectable()
export abstract class BaseLoanStateManager implements ILoanStateManager {
  // #region Properties and Constructor
  
  protected readonly logger: Logger;
  protected readonly loanState: LoanState;
  protected paymentStrategy: IPaymentEvaluationStrategy;

  constructor(protected readonly domainServices: IDomainServices, currentState: LoanState) {
    this.logger = new Logger(BaseLoanStateManager.name);
    this.loanState = currentState;
    this.paymentStrategy = this.getDefaultPaymentStrategy();
  }

  // #endregion

  // #region Public Interface Methods

  /**
   * Advances a loan to its next state in the loan lifecycle workflow
   * @param loanId - The unique identifier of the loan to advance
   * @returns Promise indicating success (true), no change needed (false), or failure (null)
   */
  // TODO: Might require additional generic payload for states handling additional input
  public async advance(loanId: string): Promise<boolean | null> {
    const nextState = await this.getNextState(loanId);
    if (!nextState) {
      this.logger.error(`Failed to determine next state for loan ${loanId}. Current state: ${this.loanState}`);
      return null; // Update failed
    }
    if (nextState === this.loanState) {
      this.logger.debug(`No state change required for loan ${loanId}. Current state: ${this.loanState}`);
      return false; // No updates required
    }
    return this.setNextState(loanId, nextState);
  }

  // #endregion

  // #region Protected Template Methods for State Management

  /**
   * Determines the next appropriate state for a loan based on current business rules
   * @param loanId - The unique identifier of the loan to evaluate
   * @returns The next state, current state if no transition needed, or null on error
   */
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    return this.evaluateStateTransition(loanId);
  }

  /**
   * Executes the actual state transition by updating the loan's state in the database
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Success status or null on failure
   */
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);
  }

  /**
   * Gets the supported next states for this state manager from configuration
   * @returns Array of supported loan states this state can transition to
   */
  protected getSupportedNextStates(): LoanState[] {
    return StatesManagersLogic.getSupportedNextStates(this.loanState);
  }

  /**
   * Gets the primary payment type associated with this state from configuration
   * @returns The primary payment type for this state
   */
  protected getPrimaryPaymentType(): LoanPaymentType {
    return StatesManagersLogic.getPrimaryPaymentType(this.loanState);
  }

  /**
   * Gets the required relations for loan evaluation in this state manager
   * @returns Array of loan relations required for proper state evaluation
   */
  protected getRequiredRelations(): LoanRelation[] {
    return [...LOAN_STANDARD_RELATIONS.PAYMENT_EVALUATION]; // Default
  }

  // #endregion

  // #region Protected Helper Methods for State Transitions

  /**
   * Template method for executing state transitions with validation
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Success status or null on failure
   */
  protected async executeStateTransition(loanId: string, nextState: LoanState): Promise<boolean | null> {
    if (!this.getSupportedNextStates().includes(nextState)) {
      this.logger.error(`Unsupported next state ${nextState} for loan ${loanId} in ${this.loanState} state.`);
      return null;
    }
    this.logger.debug(`Setting next state for loan ${loanId} to ${nextState}.`);
    return this.domainServices.loanServices.updateLoan(loanId, { state: nextState });
  }

  /**
   * Validates loan and retrieves it with required relations for state evaluation
   * @param loanId - The unique identifier of the loan
   * @returns The validated loan entity or null if validation fails
   */
  protected async validateAndGetLoan(loanId: string): Promise<ILoan | null> {
    const loan = await this.getLoan(loanId, this.getRequiredRelations());
    if (!loan || !this.isActualStateValid(loan)) return null;
    return loan;
  }
  
  /**
   * Evaluates the state transition by checking all decision conditions in priority order
   * @param loanId - The unique identifier of the loan to evaluate
   * @returns The next state or current state if no transition is needed, null on error
   */
  protected async evaluateStateTransition(loanId: string): Promise<LoanState | null> {
    const loan = await this.validateAndGetLoan(loanId);
    if (!loan) return null;
  
    const decisions = this.getStateDecisions();
    for (const decision of decisions.sort((a, b) => a.priority - b.priority)) {
      if (decision.condition(loan)) {
        return decision.nextState;
      }
    }
    
    return this.loanState; // Stay in current state
  }

  // #endregion

  // #region Protected Data Access Methods

  /**
   * Retrieves a loan by ID with optional relations
   * @param loanId - The unique identifier of the loan
   * @param relations - Optional relations to include in the query
   * @returns The loan entity or null if not found
   */
  protected async getLoan(loanId: string, relations?: LoanRelation[]): Promise<ILoan | null> { 
    const loan = await this.domainServices.loanServices.getLoanById(loanId, relations);
    if (!loan) {
      this.logger.error(`Loan with ID ${loanId} not found`);
      return null; // Loan does not exist
    }
    return loan;
  }

  // #endregion

  // #region Protected Validation Methods

  /**
   * Validates that a loan is in the expected state for this state manager
   * @param loan - The loan entity to validate
   * @returns True if the loan is in the expected state, false otherwise
   */
  protected isActualStateValid(loan: ILoan): boolean {
    const isValid = StatesManagersLogic.isActualStateValid(loan, this.loanState);
    if (!isValid) {
      this.logger.error(`Loan ${loan.id} is not in expected state ${this.loanState}. Current state: ${loan.state}`);
    }
    return isValid;
  }

  /**
   * Validates if a loan has valid payment accounts connected
   * @param loan - The loan entity to validate
   * @returns True if all prerequisites are met, false otherwise
   */
  protected hasValidAccountsConnected(loan: ILoan): boolean {
    const isValid = StatesManagersLogic.hasValidAccountsConnected(loan);
    const { id: loanId, billerId, lenderId, borrowerId, biller, lenderAccountId, borrowerAccountId, lenderAccount, borrowerAccount } = loan;
    
    if (!isValid) {
      // Detailed logging for debugging
      if (!biller) {
        this.logger.warn(`Loan ${loanId} has no associated biller`);
      } else if (!lenderAccount || !borrowerAccount || !biller.paymentAccount) {
        this.logger.warn(`Loan ${loanId} has missing payment accounts for lender, borrower, or biller`);
      } else {
        const { paymentAccountId: billerAccountId } = biller;
        const requiredIds = [billerId, lenderId, borrowerId, billerAccountId, lenderAccountId, borrowerAccountId];
        
        if (requiredIds.some(id => id === null || id === undefined)) {
          this.logger.warn(`Loan ${loanId} has missing required entity IDs`);
        } else {
          const isLenderAccountVerified = lenderAccount.state === PaymentAccountStateCodes.Verified;
          const isBorrowerAccountVerified = borrowerAccount.state === PaymentAccountStateCodes.Verified;
          const isBillerAccountVerified = biller.paymentAccount.state === PaymentAccountStateCodes.Verified;
          
          this.logger.warn(`Loan ${loanId} has unverified payment accounts - Lender: ${isLenderAccountVerified}, Borrower: ${isBorrowerAccountVerified}, Biller: ${isBillerAccountVerified}`);
        }
      }
    }
    
    return isValid;
  }

  // #endregion

  // #region Protected Utility Methods

  /**
   * Factory method to create appropriate payment strategy based on loan state
   * @returns The appropriate payment evaluation strategy for the current state
   */
  protected getDefaultPaymentStrategy(): IPaymentEvaluationStrategy {
    // Factory method to create appropriate strategy based on state
    // Strategies no longer need dependencies, they use static StatesManagersLogic
    switch (this.loanState) {
      case LoanStateCodes.Accepted:
        return new AcceptedLoanStrategy();
      case LoanStateCodes.Funding:
      case LoanStateCodes.FundingPaused:
      case LoanStateCodes.Funded:
        return new FundingPaymentStrategy();
      case LoanStateCodes.Disbursing:
      case LoanStateCodes.DisbursingPaused:
      case LoanStateCodes.Disbursed:
        return new DisbursementPaymentStrategy();
      case LoanStateCodes.Repaying:
      case LoanStateCodes.RepaymentPaused:
      case LoanStateCodes.Repaid:
        return new RepaymentStrategy();
      case LoanStateCodes.Closed:
        return new ClosedLoanStrategy();
      default:
        this.logger.error(`No default payment strategy defined for state ${this.loanState}`);
        throw new Error(`Unsupported loan state: ${this.loanState}`);
    }
  }

  // #endregion

  // #region Abstract Methods

  /**
   * Abstract method to define state transition decisions for concrete implementations
   * @returns Array of state decisions with conditions and priorities
   */
  protected abstract getStateDecisions(): StateDecision[];

  // #endregion
}
