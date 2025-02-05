import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApplicationUser } from './application.user.entity';
import { ILoan } from '@library/entity/interface';

@Entity()
export class Loan implements ILoan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal')
  amount: number;

  @Column('uuid')
  lenderId: string;

  @ManyToOne(() => ApplicationUser)
  @JoinColumn({ name: 'lenderId' })
  lender: ApplicationUser;

  @Column('uuid')
  borrowerId: string;

  @ManyToOne(() => ApplicationUser)
  @JoinColumn({ name: 'borrowerId' })
  borrower: ApplicationUser;
}
