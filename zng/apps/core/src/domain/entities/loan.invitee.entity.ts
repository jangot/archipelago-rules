import { LoanInviteeType } from '@library/entity/enum';
import { ILoanInvitee } from '@library/entity/interface';
import { Loan } from './loan.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'core' })
export class LoanInvitee implements ILoanInvitee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  loanId: string;

  @OneToOne(() => Loan, (loan) => loan.invitee, { nullable: false })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @Column({ type: 'text', nullable: false })
  type: LoanInviteeType;

  @Column({ type: 'text', nullable: true })
  firstName: string | null;

  @Column({ type: 'text', nullable: true })
  lastName: string | null;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  phone: string | null;
}
