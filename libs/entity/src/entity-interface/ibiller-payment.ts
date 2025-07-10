import { EntityId } from '@library/shared/common/data';
import { IBillerAddress } from './ibiller-address';
import { IBillerMask } from './ibiller-mask';
import { IBillerName } from './ibiller-name';

/**
 * IBiller defines the contract for a biller entity in the payment domain.
 */
export interface IBiller extends EntityId<string> {
  id: string; // UUID
  externalBillerId: string;
  externalBillerKey?: string;
  liveDate: Date;
  billerName: string;
  billerClass?: string;
  billerType?: string;
  lineOfBusiness?: string;
  territoryCode?: string;
  crc32: number;
  names: IBillerName[];
  masks: IBillerMask[];
  addresses: IBillerAddress[];
} 
