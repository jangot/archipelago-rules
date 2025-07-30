import { BillerType } from '@library/entity/enum';
import { DbSchemaCodes } from '@library/shared/common/data';
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApplicationUser } from './application.user.entity';
import { BillerAddress } from './biller-address.entity';
import { BillerMask } from './biller-mask.entity';
import { BillerName } from './biller-name.entity';
import { PaymentAccount } from './payment.account.entity';

/**
 * Biller entity implements IBiller for the core domain.
 *
 */
@Entity({ schema: DbSchemaCodes.Core })
export class Biller {
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

  @Column({ type: 'text', nullable: true })
  externalBillerId: string | null;

  @Column({ type: 'text', nullable: true })
  externalBillerKey: string;

  @Column({ type: 'date' })
  liveDate: Date;

  @Column({ type: 'text', nullable: true })
  billerClass: string | null;

  @Column({ type: 'text', nullable: true })
  billerType: string | null;

  @Column({ type: 'text', nullable: true })
  lineOfBusiness: string | null;

  @Column({ type: 'text', nullable: true })
  territoryCode: string | null;

  @Column({ type: 'bigint' })
  crc32: number;

  /**
   * List of alternative names for the biller.
   */
  @OneToMany(() => BillerName, (billerName) => billerName.billerId, { cascade: true })
  names: BillerName[];

  /**
   * List of account number masks for the biller.
   */
  @OneToMany(() => BillerMask, (billerMask) => billerMask.billerId, { cascade: true })
  masks: BillerMask[];

  /**
   * List of addresses for the biller.
   */
  @OneToMany(() => BillerAddress, (billerAddress) => billerAddress.billerId, { cascade: true })
  addresses: BillerAddress[];

}
