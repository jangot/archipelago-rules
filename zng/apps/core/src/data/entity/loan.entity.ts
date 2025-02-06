import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Check } from 'typeorm';
import { ApplicationUser } from './application.user.entity';
import { ILoan } from '@library/entity/interface';

@Entity('loans')
@Check(`"borrower_id" <> "lender_id"`) // Ensures borrowerId and lenderId are different
export class Loan implements ILoan {
  @PrimaryGeneratedColumn('uuid', {primaryKeyConstraintName: 'loans_id_pkey' })
  id: string;

  @Column('decimal')
  amount: number;

  @Column('uuid')
  lenderId: string;

  @ManyToOne(() => ApplicationUser)
  @JoinColumn({ name: 'lender_id' }) // FYI, column names defined here must match the DB generated ones!
  lender: ApplicationUser;

  @Column('uuid')
  borrowerId: string;

  @ManyToOne(() => ApplicationUser)
  @JoinColumn({ name: 'borrower_id' })
  borrower: ApplicationUser;
}
