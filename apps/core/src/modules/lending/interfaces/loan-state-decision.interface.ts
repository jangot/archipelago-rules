import { ILoan } from '@library/entity/entity-interface';
import { LoanState } from '@library/entity/enum';

export interface StateDecision {
  condition: (loan: ILoan) => boolean;
  nextState: LoanState;
  priority: number; // For ordering decisions
}

export interface StateTransitionContext {
  currentState: LoanState;
  evaluationContext: string;
  requiresAccountValidation: boolean;
}
