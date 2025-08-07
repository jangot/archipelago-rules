import { LoanState, LoanStateCodes } from '@library/entity/enum';
import { EntityNotFoundException } from '@library/shared/common/exception/domain';
import { Injectable } from '@nestjs/common';
import { IDomainServices } from '../domain/idomain.services';
import { ILoanStateManager, ILoanStateManagers, ILoanStateManagersFactory } from './interfaces';

@Injectable()
export class LoanStateManagersFactory implements ILoanStateManagersFactory {
  constructor(private readonly managers: ILoanStateManagers, private readonly domainServices: IDomainServices) {}

  public async getManager(loanId: string, currentState?: LoanState): Promise<ILoanStateManager> {
    if (currentState) return this.getManagerByState(currentState);
    const loan = await this.domainServices.loanServices.getLoanById(loanId);
    if (!loan) {
      throw new EntityNotFoundException(`Loan with ID ${loanId} not found`);
    }
    return this.getManagerByState(loan.state);
  }

  private getManagerByState(loanState: LoanState): ILoanStateManager {
    // TODO: I don't like this switch - it makes Factory so DI fat (all managers are injected into it on creation)
    switch (loanState) {
      case LoanStateCodes.Accepted:
        return this.managers.accepted;

      case LoanStateCodes.Funding:
        return this.managers.funding;
      case LoanStateCodes.FundingPaused:
        return this.managers.fundingPaused;
      case LoanStateCodes.Funded:
        return this.managers.funded;

      case LoanStateCodes.Disbursing:
        return this.managers.disbursing;
      case LoanStateCodes.DisbursingPaused:
        return this.managers.disbursingPaused;
      case LoanStateCodes.Disbursed:
        return this.managers.disbursed;

      case LoanStateCodes.Repaying:
        return this.managers.repaying;
      case LoanStateCodes.RepaymentPaused:
        return this.managers.repaymentPaused;
      case LoanStateCodes.Repaid:
        return this.managers.repaid;

      case LoanStateCodes.Closed:
        return this.managers.closed;
      
      default:
        throw new Error(`Manager for loan state '${loanState}' is not implemented yet`);
    }
  }
}
