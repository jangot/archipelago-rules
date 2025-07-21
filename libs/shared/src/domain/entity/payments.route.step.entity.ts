import { DbSchemaCodes } from '@library/shared/common/data';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentAccount } from './payment.account.entity';
import { PaymentsRoute } from './payments.route.entity';

@Entity({ schema: DbSchemaCodes.Payment })
export class PaymentsRouteStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  routeId: string;

  @ManyToOne(() => PaymentsRoute)
  @JoinColumn({ name: 'route_id' })
  route: PaymentsRoute;

  @Column({ type: 'integer', default: 0 })
  order: number;

  @Column({ type: 'uuid', nullable: true })
  fromId: string | null;

  @ManyToOne(() => PaymentAccount, { nullable: true })
  @JoinColumn({ name: 'from_id' })
  from: PaymentAccount | null;

  @Column({ type: 'uuid', nullable: true })
  toId: string | null;

  @ManyToOne(() => PaymentAccount, { nullable: true })
  @JoinColumn({ name: 'to_id' })
  to: PaymentAccount | null;
}
