import { IBiller } from '@library/entity/entity-interface/ibiller-payment';
import { DbSchemaCodes } from '@library/shared/common/data';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BillerAddress } from './biller.address.entity';
import { BillerMask } from './biller.mask.entity';
import { BillerName } from './biller.name.entity';

/**
 * Biller entity implements IBiller for the payment domain.
 */
@Entity({ schema: DbSchemaCodes.Payment })
export class Biller implements IBiller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  externalBillerId: string;

  @Column({ type: 'text', nullable: true })
  externalBillerKey?: string;

  @Column({ type: 'date' })
  liveDate: Date;

  @Column({ type: 'text' })
  billerName: string;

  @Column({ type: 'text', nullable: true })
  billerClass?: string;

  @Column({ type: 'text', nullable: true })
  billerType?: string;

  @Column({ type: 'text', nullable: true })
  lineOfBusiness?: string;

  @Column({ type: 'text', nullable: true })
  territoryCode?: string;

  @Column({ type: 'int' })
  crc32: number;

  // Relations (to be implemented with TypeORM decorators as needed)
  names: BillerName[];
  masks: BillerMask[];
  addresses: BillerAddress[];
}
