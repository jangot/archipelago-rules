import { EntityId } from '@library/shared/common/data';
import { IApplicationUser } from './iapplication-user';
import { PaymentAccountProvider, PaymentAccountType } from '../enum';

export interface IPaymentAccount extends EntityId<string> {
  id: string; // UUID

  ownerId: string;
  owner: IApplicationUser;

  type: PaymentAccountType;
  provider: PaymentAccountProvider;
    
}
