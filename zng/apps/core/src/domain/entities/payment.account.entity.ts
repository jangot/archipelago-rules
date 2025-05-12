import { PaymentAccountType, PaymentAccountProvider, PaymentAccountOwnershipType, PaymentAccountState } from '@library/entity/enum';
import { IPaymentAccount } from '@library/entity/interface';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApplicationUser } from './application.user.entity';
import { PaymentAccountDetails } from '@library/shared/types/lending';

@Entity({ schema: 'core' })
export class PaymentAccount implements IPaymentAccount {

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
