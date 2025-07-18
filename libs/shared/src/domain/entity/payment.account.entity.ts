import { PaymentAccountOwnershipType, PaymentAccountProvider, PaymentAccountState, PaymentAccountType } from '@library/entity/enum';
import { DbSchemaCodes } from '@library/shared/common/data';
import { PaymentAccountDetails } from '@library/shared/type/lending';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApplicationUser } from './application.user.entity';

@Entity({ schema: DbSchemaCodes.Core })
export class PaymentAccount {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => ApplicationUser)
  @JoinColumn({ name: 'owner_id' })
  user: ApplicationUser;

  @Column({ type: 'text' })
  type: PaymentAccountType;

  @Column({ type: 'text' })
  provider: PaymentAccountProvider;

  @Column({ type: 'text' })
  ownership: PaymentAccountOwnershipType;

  @Column({ type: 'text' })
  state: PaymentAccountState;

  @Column({ type: 'jsonb', nullable: true })
  details: PaymentAccountDetails | null;
}
