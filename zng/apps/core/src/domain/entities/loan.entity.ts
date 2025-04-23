import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Check, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ILoan } from '@library/entity/interface';
import { LoanType, LoanState, LoanClosure, LoanPaymentFrequency, LoanFeeMode } from '@library/entity/enum';
import { ApplicationUser } from './application.user.entity';
import { Biller } from './biller.entity';
import { PaymentAccount } from './payment.account.entity';
import { ILoanPayment } from '@library/entity/interface/iloan-payment';
import { LoanPayment } from './loan.payment.entity';

@Entity({ schema: 'core' })
// When using @Check('<constraint_name>', '<expression') -- always specify a Constraint name
// (not worth trying to parse the expression to generate a reasonable Check constraint name)
@Check('loans_borrower_id_ne_lender_id_check', '"borrower_id" <> "lender_id"') // Ensures borrowerId and lenderId are different
export class Loan implements ILoan {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal')
  amount: number;

  @Column('uuid')
  lenderId: string;

  // TODO: In Loan we heve two AppUsers, thats why simple cascade deletion decorator is not make sense (we need to have one User already deleted and socind in deletion)
  // We might try to achieve this by having custom enitity subscriber and resolve this problem there
  @ManyToOne(() => ApplicationUser)
  @JoinColumn({ name: 'lender_id' }) // FYI, column names defined here must match the DB generated ones!
  lender: ApplicationUser;

  @Column('uuid')
  borrowerId: string;

  @ManyToOne(() => ApplicationUser)
  @JoinColumn({ name: 'borrower_id' })
  borrower: ApplicationUser;

  @Column({ type: 'text' })
  type: LoanType;

  @Column({ type: 'boolean', default: true })
  isLendLoan: boolean;

  @Column({ type: 'text' })
  state: LoanState;

  @Column({ type: 'text', nullable: true })
  closureType: LoanClosure | null;

  @Column({ type: 'text', nullable: true })
  relationship: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'text', nullable: true })
  attachement: string | null;

  @Column({ type: 'text', nullable: true })
  deeplink: string | null;

  @Column({ type: 'text', nullable: true })
  targetUserUri: string | null;

  @Column({ type: 'text', nullable: true })
  targetUserFirstName: string | null;

  @Column({ type: 'text', nullable: true })
  targetUserLastName: string | null;

  @Column({ type: 'uuid', nullable: true })
  billerId: string | null;

  @ManyToOne(() => Biller)
  @JoinColumn({ name: 'biller_id' })
  biller: Biller | null;

  @Column({ type: 'text', nullable: true })
  billingAccountNumber: string | null;

  @Column({ type: 'int' })
  paymentsCount: number;

  @Column({ type: 'int', nullable: true })
  currentPaymentIndex: number | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nextPaymentDate: Date | null;

  @Column({ type: 'text' })
  paymentFrequency: LoanPaymentFrequency;

  @Column({ type: 'decimal', nullable: true })
  paymmentAmount: number | null;

  @OneToMany(() => LoanPayment, (loanPayment) => loanPayment.loan, { nullable: true })
  payments: LoanPayment[] | null;

  @Column({ type: 'text', nullable: true })
  feeMode: LoanFeeMode | null;

  @Column({ type: 'decimal', nullable: true })
  feeValue: number | null;

  @Column({ type: 'uuid', nullable: true })
  lenderAccountId: string | null;

  @ManyToOne(() => PaymentAccount, { nullable: true })
  @JoinColumn({ name: 'lender_account_id' })
  lenderAccount: PaymentAccount | null;

  @Column({ type: 'uuid', nullable: true })
  borrowerAccountId: string | null;

  @ManyToOne(() => PaymentAccount, { nullable: true })
  @JoinColumn({ name: 'borrower_account_id' })
  borrowerAccount: PaymentAccount | null;

  @Column({ type: 'uuid', nullable: true })
  partnerId: string | null;

  // TODO: Link to Entity
  partner: string | null;

  @Column({ type: 'text', nullable: true })
  presetLink: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  acceptedAt: Date | null;
}
