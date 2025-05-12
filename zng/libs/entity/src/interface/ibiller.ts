import { EntityId } from '@library/shared/common/data';
import { BillerType } from '../enum';
import { IApplicationUser } from './iapplication-user';
import { IPaymentAccount } from './ipayment-account';

export interface IBiller extends EntityId<string> {
  id: string; // UUID
  name: string;

  /** Type of the Biller: 
   * `network` - Biller was imported from Billers network (RPPS); 
   * `custom` - Biller that was added by User (not found in Billers network); 
   * `personal` - Emulates the real Biller for P2P Loans. */
  type: BillerType;
  /** Type of account number validation flow for Biller clients.
   * Currently disabled as details are unknown, but requirement highlighted in designs
  */
  // accountNumberValidation: string | null;

  createdAt: Date;
  updatedAt: Date | null;

  createdById: string | null;
  createdBy: IApplicationUser | null;
  
  paymentAccountId: string | null;
  paymentAccount: IPaymentAccount | null;

}
