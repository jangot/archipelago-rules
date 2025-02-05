import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApplicationUserEntity } from './application.user.entity';
import { ILoan } from '@library/entity/interface';

@Entity()
export class LoanEntity implements ILoan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal')
  amount: number;

  @Column('uuid')
  lenderId: string;

  @ManyToOne(() => ApplicationUserEntity)
  @JoinColumn({ name: 'lenderId' })
  lender: ApplicationUserEntity;

  @Column('uuid')
  borrowerId: string;

  @ManyToOne(() => ApplicationUserEntity)
  @JoinColumn({ name: 'borrowerId' })
  borrower: ApplicationUserEntity;
}
