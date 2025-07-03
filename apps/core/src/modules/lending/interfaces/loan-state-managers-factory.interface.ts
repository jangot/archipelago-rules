import { LoanState } from '@library/entity/enum';
import { ILoanStateManager } from './loan-state-manager.interface';

export interface ILoanStateManagersFactory {
  getManager(loanId: string, currentState?: LoanState): Promise<ILoanStateManager>;
}

export const ILoanStateManagersFactory = Symbol('ILoanStateManagersFactory');
