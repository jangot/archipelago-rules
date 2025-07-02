import { PaymentAccountType, PaymentAccountOwnershipType, PaymentAccountProvider, LoanType, LoanPaymentType } from '@library/entity/enum';
import { IPaymentsRoute } from '@library/entity/entity-interface';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentsRouteStep } from './payments.route.step.entity';
import { DbSchemaCodes } from '@library/shared/common/data';

@Entity({ schema: DbSchemaCodes.Payment })
export class PaymentsRoute implements IPaymentsRoute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  fromAccount: PaymentAccountType;

  @Column({ type: 'text' })
  fromOwnership: PaymentAccountOwnershipType;

  @Column({ type: 'text' })
  fromProvider: PaymentAccountProvider;

  @Column({ type: 'text' })
  toAccount: PaymentAccountType;

  @Column({ type: 'text' })
  toOwnership: PaymentAccountOwnershipType;

  @Column({ type: 'text' })
  toProvider: PaymentAccountProvider;

  @Column({ type: 'text', array: true })
  loanStagesSupported: LoanPaymentType[];

  @Column({ type: 'text', array: true })
  loanTypesSupported: LoanType[];

  @OneToMany(() => PaymentsRouteStep, (step) => step.route, { nullable: true })
  steps: PaymentsRouteStep[];
}
