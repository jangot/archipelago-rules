import { PaymentAccountType, PaymentAccountProvider } from '@library/entity/enum';
import { IPaymentAccount } from '@library/entity/interface';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApplicationUser } from './application.user.entity';

@Entity({ schema: 'core' })
export class PaymentAccount implements IPaymentAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => ApplicationUser)
  @JoinColumn({ name: 'owner_id' })
  owner: ApplicationUser;

  @Column({ type: 'text' })
  type: PaymentAccountType;

  @Column({ type: 'text' })
  provider: PaymentAccountProvider;
}
