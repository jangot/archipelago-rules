import { TransferState } from '@library/entity/enum';
import { ITransfer } from '@library/entity/interface/itransfer';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentAccount } from './payment.account.entity';
import { LoanPayment } from './loan.payment.entity';

@Entity({ schema: 'core' })
export class Transfer implements ITransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal' })
  amount: number;

  @Column({ type: 'text' })
  state: TransferState;

  @Column({ type: 'text', nullable: true })
  errorData: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  sourceAccountId: string | null;

  @ManyToOne(() => PaymentAccount, { nullable: true })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount: PaymentAccount | null;

  @Column({ type: 'uuid', nullable: true })
  destinationAccountId: string | null;

  @ManyToOne(() => PaymentAccount, { nullable: true })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount: PaymentAccount | null;

  @Column({ type: 'text' })
  sourceAccountType: string;

  @Column({ type: 'text' })
  destinationAccountType: string;

  @Column({ type: 'uuid', nullable: true })
  loanPaymentId: string | null;

  @ManyToOne(() => LoanPayment, { nullable: true })
  @JoinColumn({ name: 'loan_payment_id' })
  loanPayment: LoanPayment | null;
    
}
