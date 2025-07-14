import { IPaymentAccount } from '@library/entity/entity-interface';
import { IRepositoryBase } from '@library/shared/common/data';
import { PaymentAccountRelation } from '@library/shared/domain/entity/relation';
 
export interface IPaymentAccountRepository extends IRepositoryBase<IPaymentAccount> {
  createPaymentAccount(input: Partial<IPaymentAccount>): Promise<IPaymentAccount | null>;
  getPaymentAccountById(paymentAccountId: string, relations?: PaymentAccountRelation[]): Promise<IPaymentAccount | null>;
}

export const IPaymentAccountRepository = Symbol('IPaymentAccountRepository');
