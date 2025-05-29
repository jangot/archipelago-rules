import { PaymentStepState } from '@library/entity/enum';
import { ILoanPaymentStep } from '@library/entity/interface';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { LoanPayment } from './loan.payment.entity';
import { PaymentAccount } from './payment.account.entity';
import { Transfer } from './transfer.entity';

@Entity({ schema: 'core' })
export class LoanPaymentStep implements ILoanPaymentStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  loanPaymentId: string;

  @ManyToOne(() => LoanPayment, { nullable: false })
  @JoinColumn({ name: 'loan_payment_id' })
  loanPayment: LoanPayment;

  @Column({ type: 'integer', default: 0 })
  order: number;

  @Column({ type: 'decimal' })
  amount: number;

  @Column({ type: 'uuid' })
  sourcePaymentAccountId: string;

  @ManyToOne(() => PaymentAccount, { nullable: false })
  @JoinColumn({ name: 'source_payment_account_id' })
  sourcePaymentAccount: PaymentAccount;

  @Column({ type: 'uuid' })
  targetPaymentAccountId: string;

  @ManyToOne(() => PaymentAccount, { nullable: false })
  @JoinColumn({ name: 'target_payment_account_id' })
  targetPaymentAccount: PaymentAccount;

  @OneToMany(() => Transfer, (transfer) => transfer.loanPaymentStep, { nullable: true })
  transfers: Transfer[] | null;

  @Column({ type: 'text' })
  state: PaymentStepState;

  @Column({ type: 'text', nullable: true })
  awaitStepState: PaymentStepState | null;

  @Column({ type: 'uuid', nullable: true })
  awaitStepId: string | null;
}
