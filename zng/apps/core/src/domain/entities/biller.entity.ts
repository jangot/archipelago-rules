import { BillerType } from '@library/entity/enum';
import { IBiller } from '@library/entity/interface';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApplicationUser } from './application.user.entity';
import { PaymentAccount } from './payment.account.entity';

@Entity({ schema: 'core' })
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
}
