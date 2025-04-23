import { LoanPaymentType, LoanPaymentState } from '@library/entity/enum';
import { ILoanPayment } from '@library/entity/interface/iloan-payment';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Loan } from './loan.entity';
import { Transfer } from './transfer.entity';

@Entity({ schema: 'core' })
export class LoanPayment implements ILoanPayment {
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
  paymentIndex: number | null;

  @Column({ type: 'text' })
  type: LoanPaymentType;

  @Column({ type: 'integer', default: 0 })
  stage: number;

  @Column({ type: 'text' })
  state: LoanPaymentState;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'timestamp with time zone' })
  executionDate: Date;

  @Column({ type: 'timestamp with time zone' })
  originalExecutionDate: Date;

  @OneToMany(() => Transfer, (transfer) => transfer.loanPayment, { nullable: true })
  transfers: Transfer[] | null;
    
}
