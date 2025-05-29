import { TransferState } from '@library/entity/enum';
import { ITransfer } from '@library/entity/interface/itransfer';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentAccount } from './payment.account.entity';
import { TransferError } from './transfer.error.entity';
import { LoanPaymentStep } from './loan.payment.step.entity';

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

  @Column({ type: 'uuid', nullable: false })
  sourceAccountId: string;

  @ManyToOne(() => PaymentAccount, { nullable: false })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount: PaymentAccount;

  @Column({ type: 'uuid', nullable: false })
  destinationAccountId: string;

  @ManyToOne(() => PaymentAccount, { nullable: false })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount: PaymentAccount;

  @OneToOne(() => TransferError, (error) => error.transfer, { nullable: true })
  error: TransferError | null;

  @Column({ type: 'uuid', nullable: true })
  loanPaymentStepId: string | null;

  @ManyToOne(() => LoanPaymentStep, { nullable: true })
  @JoinColumn({ name: 'loan_payment_step_id' })
  loanPaymentStep: LoanPaymentStep | null;

    
}
