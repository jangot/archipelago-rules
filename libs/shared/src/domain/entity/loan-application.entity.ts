import { LoanApplicationStates, LoanApplicationStateType, LoanType } from '@library/entity/enum';
import { DbSchemaCodes } from '@library/shared/common/data';
import { Biller } from '@library/shared/domain/entity/biller.entity';
import { PaymentAccount } from '@library/shared/domain/entity/payment.account.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicationUser } from './application.user.entity';

@Entity({ schema: DbSchemaCodes.Core })
export class LoanApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true, default: LoanApplicationStates.Pending }) //TODO: Should this be an enum for status
  status: LoanApplicationStateType | null;

  
  // Biller
  @Column({ type: 'uuid', nullable: true })
  billerId: string | null;

  @ManyToOne(() => Biller, { nullable: true })
  @JoinColumn({ name: 'biller_id' })
  biller: Biller | null;

  @Column({ type: 'text', nullable: true })
  billerName: string | null;

  @Column({ type: 'text', nullable: true })
  billerPostalCode: string | null;


  // Bill
  @Column({ type: 'text', nullable: true })
  billAccountNumber: string | null;


  // Lender
  @Column({ type: 'uuid', nullable: true })
  lenderId: string | null;

  @ManyToOne(() => ApplicationUser, { nullable: true })
  @JoinColumn({ name: 'lender_id' })
  lender: ApplicationUser | null;

  @Column({ type: 'uuid', nullable: true })
  lenderPaymentAccountId: string | null;

  @ManyToOne(() => PaymentAccount, { nullable: true })
  @JoinColumn({ name: 'lender_payment_account_id' })
  lenderPaymentAccount: PaymentAccount | null;

  @Column({ type: 'text', nullable: true })
  lenderFirstName: string | null;

  @Column({ type: 'text', nullable: true })
  lenderLastName: string | null;

  @Column({ type: 'text', nullable: true })
  lenderEmail: string | null;

  @Column({ type: 'text', nullable: true })
  lenderRelationship: string | null;

  @Column({ type: 'text', nullable: true })
  lenderNote: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lenderRespondedAt: Date | null;


  // Borrower
  @Column({ type: 'uuid', nullable: true })
  borrowerId: string | null;

  @ManyToOne(() => ApplicationUser, { nullable: true })
  @JoinColumn({ name: 'borrower_id' })
  borrower: ApplicationUser | null;

  @Column({ type: 'uuid', nullable: true })
  borrowerPaymentAccountId: string | null;

  @ManyToOne(() => PaymentAccount, { nullable: true })
  @JoinColumn({ name: 'borrower_account_id' })
  borrowerPaymentAccount: PaymentAccount | null;

  @Column({ name: 'borrower_submitted_at', type: 'timestamptz', nullable: true })
  borrowerSubmittedAt: Date | null;


  // Loan Info
  @Column({ type: 'text', nullable: true })
  loanType: LoanType | null;

  @Column({ type: 'text', nullable: true })
  loanPaymentFrequency: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  loanAmount: number | null;

  @Column({ type: 'int', nullable: true })
  loanPayments: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, default: 0 })
  loanServiceFee: number | null;

  // Metadata
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date | null;
}
