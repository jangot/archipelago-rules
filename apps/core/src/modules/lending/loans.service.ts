import { LoanState } from '@library/entity/enum';
import { Inject, Injectable } from '@nestjs/common';
import { ILoanStateManagersFactory } from './interfaces';

@Injectable()
export class LoansService {

  constructor(
    @Inject(ILoanStateManagersFactory)
    private readonly stateManagerFactory: ILoanStateManagersFactory) {}

  /**
   * Advances a loan through its state machine lifecycle by delegating to the appropriate state manager.
   *
   * This method uses the State Pattern to handle loan state transitions. It retrieves the correct
   * state manager instance from the factory based on the loan ID and optional current state,
   * then delegates the advancement logic to that manager. Each state manager is responsible for
   * validating if a transition is possible and executing the appropriate business logic.
   *
   * The method supports the following state transitions:
   *  - `accepted` -> `funding`
   *  - `funding` -> `funded`
   *  - `funded` -> `disbursing`
   *  - `disbursing` -> `disbursed`
   *  - `disbursed` -> `repaying`
   *  - `repaying` -> `repaid`
   *  - `repaid` -> `closed`
   *  - Plus all related error/paused states (e.g., `funding_paused`, `disbursing_paused`)
   *
   * @param loanId - The unique identifier of the loan to advance
   * @param currentState - Optional current state to optimize manager selection. If not provided,
   *                      the factory will retrieve the current state from the database
   * @returns Promise<boolean | null> - true if the loan was successfully advanced to the next state,
   *                                   false if no advancement was possible/needed, null if an error occurred
   */
  public async advanceLoan(loanId: string): Promise<boolean | null>;
  public async advanceLoan(loanId: string, currentState: LoanState): Promise<boolean | null>;
  public async advanceLoan(loanId: string, currentState?: LoanState): Promise<boolean | null> {
    const manager = await this.stateManagerFactory.getManager(loanId, currentState);
    return manager.advance(loanId);
  }
}
