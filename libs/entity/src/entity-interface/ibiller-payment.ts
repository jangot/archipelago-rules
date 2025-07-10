import { EntityId } from '@library/shared/common/data';
import { IBillerAddress } from './ibiller-address';
import { IBillerMask } from './ibiller-mask';
import { IBillerName } from './ibiller-name';


/**
 * IBiller defines the contract for a biller entity in the payment domain.
 */
export interface IBillerPayment extends EntityId<string> {
  id: string; // UUID

  // #region External IDs
  externalBillerId?: string;
  externalBillerKey?: string;
  liveDate: Date;
  // #endregion

  // #region Biller Info
  billerName: string;
  billerClass?: string;
  // #endregion

  // #region Biller Info
  billerType?: string;
  lineOfBusiness?: string;
  territoryCode?: string;
  // #endregion
  totalAddresses: number;
  totalMasks: number;
  totalAkas: number;
  totalContacts: number;
  crc32: string; // for comparing if the biller changed

  namesId: string
  names: IBillerName[];

  masksId: string
  masks: IBillerMask[];

  addressesId: string
  addresses: IBillerAddress[];
} 
