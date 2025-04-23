import { IPaymentAccount } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IPaymentAccountRepository extends IRepositoryBase<IPaymentAccount> {}

export const IPaymentAccountRepository = Symbol('IPaymentAccountRepository');
