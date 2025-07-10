import { IBillerMask } from '@library/entity/entity-interface/ibiller-mask';
import { DbSchemaCodes } from '@library/shared/common/data';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * BillerMask entity implements IBillerMask for the payment domain.
 */
@Entity({ schema: DbSchemaCodes.Payment })
export class BillerMask implements IBillerMask {
  /** UUID primary key */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Foreign key for Biller */
  @Column({ type: 'uuid' })
  billerId: string;

  /** Mask string */
  @Column({ type: 'text' })
  mask: string;

  /** Mask length */
  @Column({ type: 'int' })
  maskLength: number;

  /** External key (optional) */
  @Column({ type: 'text', nullable: true })
  externalKey?: string;

  /** Date when the mask went live */
  @Column({ type: 'date' })
  liveDate: Date;
} 
