import { LoanInviteeRelation } from '@core/domain/entities/relations';
import { ContactType } from '@library/entity/enum';
import { ILoanInvitee } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data';


export interface ILoanInviteeRepository extends IRepositoryBase<ILoanInvitee> {
  getLoanInvitee(loanId: string, contactValue: string, contactType: ContactType): Promise<ILoanInvitee | null>;
  searchInvitees(contactValue: string, contactType: ContactType, relations?: LoanInviteeRelation[]): Promise<ILoanInvitee[]>;
}

export const ILoanInviteeRepository = Symbol('ILoanInviteeRepository');
