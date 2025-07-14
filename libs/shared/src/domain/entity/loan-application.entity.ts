import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoanType } from '@library/entity/enum';
import { PaymentAccount } from '@library/shared/domain/entity/payment.account.entity';
import { Biller } from '@library/shared/domain/entity/biller.entity';
import { DbSchemaCodes } from '@library/shared/common/data';
import { ILoanApplication } from '@library/entity/entity-interface';

@Entity({ schema: DbSchemaCodes.Core })
export class LoanApplication implements ILoanApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  status: string | null;

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

  @Column({ type: 'text', nullable: true })
  billAccount: string | null;

  @Column({ type: 'decimal', nullable: true })
  loanAmount: number | null;

  // Lender
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

  @Column({ type: 'uuid', nullable: true })
  lenderAccountId: string | null;

  @ManyToOne(() => PaymentAccount, { nullable: true })
  @JoinColumn({ name: 'lender_account_id' })
  lenderAccount: PaymentAccount | null;

  // Borrower
  @Column({ type: 'uuid', nullable: true })
  borrowerAccountId: string | null;

  @ManyToOne(() => PaymentAccount, { nullable: true })
  @JoinColumn({ name: 'borrower_account_id' })
  borrowerAccount: PaymentAccount | null;

  // Loan Info
  @Column({ type: 'text', nullable: true })
  loanType: LoanType | null;

  @Column({ type: 'int', nullable: true })
  loanPayments: number | null;

  @Column({ type: 'decimal', nullable: true })
  loanServiceFee: number | null;

  // Metadata
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date | null;
}
