import { EntityId } from '@library/shared/common/data';

export interface IBillerAddress extends EntityId<string> {
  id: string; // UUID
  billerId: string; // FK for Biller
  

  externalKey: string; 
  liveDate: Date;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvinceCode: string;
  countryCode: string;
  postalCode: string;
} 
