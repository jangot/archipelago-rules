export interface ILoanStateManager {
  /**
   * Advances the state of a loan signals, events, current state
   * @param loanId The ID of the loan to update
   * @returns Boolean that shows were updates applied or not. `true` - loan was advanced, `false` - no updates required, `null` - update failed
   */
  advance(loanId: string): Promise<boolean | null>;
}
