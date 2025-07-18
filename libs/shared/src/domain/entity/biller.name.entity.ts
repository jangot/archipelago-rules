import { DbSchemaCodes } from '@library/shared/common/data';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * BillerName entity implements IBillerName for the payment domain.
 */
@Entity({ schema: DbSchemaCodes.Core })
export class BillerName {
  /** UUID primary key */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Foreign key for Biller */
  @Column({ type: 'uuid' })
  billerId: string;

  /** Name string */
  @Index()
  @Column({ type: 'text' })
  name: string;

  /** External key */
  @Column({ type: 'text' })
  externalKey: string;

  /** Date when the name went live */
  @Column({ type: 'date' })
  liveDate: Date;
} 
