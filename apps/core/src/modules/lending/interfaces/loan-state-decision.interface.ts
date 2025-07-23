import { LoanState } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity';

export interface StateDecision {
  /**
   * Condition function to evaluate if the decision applies to the given loan.
   * @param loan Loan object to evaluate against the condition.
   * @returns Boolean indicating if the condition is met.
   */
  condition: (loan: Loan) => boolean;
  /**
   * The next state to transition to if the condition is met.
   */
  nextState: LoanState;
  /**
   * Indicates if the decision is a step within the same state (e.g., progress within the current state).
   * If true, it means the decision does not change the state but progresses it.
   */
  sameStateProgress: boolean;
  /**
   * Priority of the decision for ordering purposes.
   * Lower numbers indicate higher priority.
   */
  priority: number;
}

export interface StateDecisionResult {
  /**
   * The next state to transition to based on the decision.
   */
  nextState: LoanState;
  /**
   * Indicates if the decision is a step within the same state.
   */
  sameStateProgress: boolean;

}
