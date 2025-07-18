import { LoanPaymentState, LoanPaymentType } from '@library/entity/enum';
import { DbSchemaCodes } from '@library/shared/common/data';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Loan } from './loan.entity';
import { LoanPaymentStep } from './loan.payment.step.entity';

@Entity({ schema: DbSchemaCodes.Payment })
export class LoanPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal' })
  amount: number;

  @Column({ type: 'uuid' })
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @Column({ type: 'integer', nullable: true })
  paymentNumber: number | null;

  @Column({ type: 'text' })
  type: LoanPaymentType;

  @Column({ type: 'text' })
  state: LoanPaymentState;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  initiatedAt: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  scheduledAt: Date | null;

  @OneToMany(() => LoanPaymentStep, (step) => step.loanPayment, { nullable: true })
  steps: LoanPaymentStep[] | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt: Date | null;
}
