import { IBiller } from '@library/entity/entity-interface/ibiller';
import { BillerType } from '@library/entity/enum';
import { DbSchemaCodes } from '@library/shared/common/data';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApplicationUser } from './application.user.entity';
import { BillerAddress } from './biller.address.entity';
import { BillerMask } from './biller.mask.entity';
import { BillerName } from './biller.name.entity';
import { PaymentAccount } from './payment.account.entity';

@Entity({ schema: DbSchemaCodes.Core })
export class Biller implements IBiller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  type: BillerType;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @ManyToOne(() => ApplicationUser, { nullable: true })
  createdBy: ApplicationUser | null;

  @Column({ type: 'uuid', nullable: true })
  paymentAccountId: string | null;

  @ManyToOne(() => PaymentAccount, { nullable: true })
  paymentAccount: PaymentAccount | null;

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
