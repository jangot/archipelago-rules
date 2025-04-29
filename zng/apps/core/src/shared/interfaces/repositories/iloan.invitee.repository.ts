import { ILoanInvitee } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ILoanInviteeRepository extends IRepositoryBase<ILoanInvitee> {}

export const ILoanInviteeRepository = Symbol('ILoanInviteeRepository');
