import { IBillerPayment } from '@library/entity/entity-interface/ibiller-payment';
import { DbSchemaCodes } from '@library/shared/common/data';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BillerAddress } from './biller.address.entity';
import { BillerMask } from './biller.mask.entity';
import { BillerName } from './biller.name.entity';

/**
 * BillerPayment entity implements IBillerPayment for the payment domain.
 * TODO: Replace any[] with proper entity relations for names, masks, and addresses.
 */
@Entity({ schema: DbSchemaCodes.Payment })
export class BillerPayment implements IBillerPayment {
  /** UUID primary key */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** External biller ID */
  @Column({ type: 'text', nullable: true })
  externalBillerId?: string;

  /** External biller key */
  @Column({ type: 'text', nullable: true })
  externalBillerKey?: string;

  /** Date when the biller went live */
  @Column({ type: 'date' })
  liveDate: Date;

  /** Biller name */
  @Column({ type: 'text' })
  billerName: string;

  /** Biller class */
  @Column({ type: 'text', nullable: true })
  billerClass?: string;

  /** Biller type */
  @Column({ type: 'text', nullable: true })
  billerType?: string;

  /** Line of business */
  @Column({ type: 'text', nullable: true })
  lineOfBusiness?: string;

  /** Territory code */
  @Column({ type: 'text', nullable: true })
  territoryCode?: string;

  /** Total addresses */
  @Column({ type: 'int' })
  totalAddresses: number;

  /** Total masks */
  @Column({ type: 'int' })
  totalMasks: number;

  /** Total AKAs */
  @Column({ type: 'int' })
  totalAkas: number;

  /** Total contacts */
  @Column({ type: 'int' })
  totalContacts: number;

  /** CRC32 for change detection */
  @Column({ type: 'text' })
  crc32: string;

  /** Names relation ID */
  @Column({ type: 'uuid' })
  namesId: string;

  /** Names (TODO: replace any[] with BillerNameEntity[]) */
  names: BillerName[];

  /** Masks relation ID */
  @Column({ type: 'uuid' })
  masksId: string;

  /** Masks (TODO: replace any[] with BillerMaskEntity[]) */
  masks: BillerMask[];

  /** Addresses relation ID */
  @Column({ type: 'uuid' })
  addressesId: string;

  /** Addresses (TODO: replace any[] with BillerAddressEntity[]) */
  addresses: BillerAddress[];
}
