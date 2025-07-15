import { EntityId } from '@library/shared/common/data';

export interface IBillerMask extends EntityId<string> {

  id: string; // UUID
  billerId: string; // FK for Biller

  mask: string;
  maskLength: number;
  externalKey?: string; 
  liveDate: Date;
} 
