import { Injectable } from '@nestjs/common';
import { ILoanStateManager, ILoanStateManagers, ILoanStateManagersFactory } from './interfaces';
import { LoanState } from '@library/entity/enum';
import { IDomainServices } from '../domain/idomain.services';
import { EntityNotFoundException } from '@library/shared/common/exception/domain';

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
    switch (loanState) {
      case 'accepted':
        return this.managers.accepted;

      case 'funding':
        return this.managers.funding;
      case 'funding_paused':
        return this.managers.fundingPaused;
      case 'funded':
        return this.managers.funded;

      case 'disbursing':
        return this.managers.disbursing;
      case 'disbursing_paused':
        return this.managers.disbursingPaused;
      case 'disbursed':
        return this.managers.disbursed;

      case 'repaying':
        return this.managers.repaying;
      case 'repayment_paused':
        return this.managers.repaymentPaused;
      case 'repaid':
        return this.managers.repaid;

      case 'closed':
        return this.managers.closed;

      case 'created':
      case 'requested':
      case 'offered':
      case 'borrower_assigned':
      case 'lender_assigned':
      default:
        throw new Error(`Manager for loan state '${loanState}' is not implemented yet`);
    }
  }
}
