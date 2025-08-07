import { DbSchemaCodes } from '@library/shared/common/data';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * BillerAddress entity implements IBillerAddress for the payment domain.
 */
@Entity({ schema: DbSchemaCodes.Core })
export class BillerAddress {
  /** UUID primary key */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Foreign key for Biller */
  @Column({ type: 'uuid' })
  billerId: string;

  /** External key */
  @Column({ type: 'text' })
  externalKey: string;

  /** Date when the address went live */
  @Column({ type: 'date' })
  liveDate: Date;

  /** Address line 1 */
  @Column({ type: 'text' })
  addressLine1: string;

  /** Address line 2 */
  @Column({ type: 'text', nullable: true })
  addressLine2: string | null;

  /** City */
  @Column({ type: 'text' })
  city: string;

  /** State or province code */
  @Column({ type: 'text' })
  stateProvinceCode: string;

  /** Country code */
  @Column({ type: 'text' })
  countryCode: string;

  /** Postal code */
  @Column({ type: 'text' })
  postalCode: string;
} 
