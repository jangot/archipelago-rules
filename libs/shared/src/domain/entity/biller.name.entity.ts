import { IBillerName } from '@library/entity/entity-interface/ibiller-name';
import { DbSchemaCodes } from '@library/shared/common/data';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * BillerName entity implements IBillerName for the payment domain.
 */
@Entity({ schema: DbSchemaCodes.Payment })
export class BillerName implements IBillerName {
  /** UUID primary key */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Foreign key for Biller */
  @Column({ type: 'uuid' })
  billerId: string;

  /** Name string */
  @Column({ type: 'text' })
  name: string;

  /** External key (optional) */
  @Column({ type: 'text', nullable: true })
  externalKey?: string;

  /** Date when the name went live */
  @Column({ type: 'date' })
  liveDate: Date;
} 
