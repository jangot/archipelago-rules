import { ContactType } from '@library/entity/enum';
import { ILoanInvitee } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data';


export interface ILoanInviteeRepository extends IRepositoryBase<ILoanInvitee> {
  getLoanInvitee(loanId: string, contactValue: string, contactType: ContactType): Promise<ILoanInvitee | null>;
}

export const ILoanInviteeRepository = Symbol('ILoanInviteeRepository');
