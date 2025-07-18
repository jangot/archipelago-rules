import { LoanPaymentType, LoanType, PaymentAccountOwnershipType, PaymentAccountProvider, PaymentAccountType } from '@library/entity/enum';
import { DbSchemaCodes } from '@library/shared/common/data';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentsRouteStep } from './payments.route.step.entity';

@Entity({ schema: DbSchemaCodes.Payment })
export class PaymentsRoute {
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
