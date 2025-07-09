import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LoanPaymentState } from '../../../../entity/src/enum';
import { DbSchemaCodes } from '../../common/data';
import { LoanPayment } from './loan.payment.entity';


@Entity({ schema: DbSchemaCodes.Payment })
export class LoanPaymentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  loanPaymentId: string;

  @ManyToOne(() => LoanPayment)
  @JoinColumn({ name: 'loan_payment_id' })
  loanPayment: LoanPayment;

  @Column({ type: 'text' })
  fromState: LoanPaymentState;

  @Column({ type: 'text' })
  toState: LoanPaymentState;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
