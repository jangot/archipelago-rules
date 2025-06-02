import { PaymentAccountRelation } from '@library/shared/domain/entities/relations';
import { IPaymentAccount } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data';
import { DeepPartial } from 'typeorm';

 
export interface IPaymentAccountRepository extends IRepositoryBase<IPaymentAccount> {
  createPaymentAccount(input: DeepPartial<IPaymentAccount>): Promise<IPaymentAccount | null>;
  getPaymentAccountById(paymentAccountId: string, relations?: PaymentAccountRelation[]): Promise<IPaymentAccount | null>;
}

export const IPaymentAccountRepository = Symbol('IPaymentAccountRepository');
