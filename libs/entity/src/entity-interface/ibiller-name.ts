import { EntityId } from '@library/shared/common/data';

export interface IBillerName extends EntityId<string> {
  id: string; // UUID
  billerId: string; // FK for Biller

  name: string;
  externalKey?: string; 
  liveDate: Date;
} 
