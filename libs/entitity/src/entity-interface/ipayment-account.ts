import { EntityId } from '@library/shared/common/data';
import { IApplicationUser } from './iapplication-user';
import { PaymentAccountOwnershipType, PaymentAccountProvider, PaymentAccountState, PaymentAccountType } from '../enum';
import { PaymentAccountDetails } from '@library/shared/type/lending';

export interface IPaymentAccount extends EntityId<string> {
  id: string; // UUID

  userId: string | null;
  user: IApplicationUser | null;

  type: PaymentAccountType;
  ownership: PaymentAccountOwnershipType;
  state: PaymentAccountState;

  provider: PaymentAccountProvider; // Move to entity ???
    
  details: PaymentAccountDetails | null;
}
