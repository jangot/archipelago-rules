import { LoanState } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity';

export interface StateDecision {
  condition: (loan: Loan) => boolean;
  nextState: LoanState;
  priority: number; // For ordering decisions
}

export interface StateTransitionContext {
  currentState: LoanState;
  evaluationContext: string;
  requiresAccountValidation: boolean;
}
