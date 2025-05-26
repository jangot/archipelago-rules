import { TransferErrorType, TransferErrorCode } from '@library/entity/enum';
import { ITransferError } from '@library/entity/interface/itransfer-error';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Transfer } from './transfer.entity';
import { Loan } from './loan.entity';

@Entity({ schema: 'core' })
export class TransferError implements ITransferError {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  transferId: string;

  @OneToOne(() => Transfer, (transfer) => transfer.error, { nullable: false })
  @JoinColumn({ name: 'transfer_id' })
  transfer: Transfer;

  @Column({ type: 'uuid', nullable: true })
  loanId: string | null;

  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan | null;

  @Column({ type: 'text' })
  type: TransferErrorType;

  @Column({ type: 'text' })
  code: TransferErrorCode;

  @Column({ type: 'text' })
  displayMessage: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ type: 'text' })
  raw: string;
}
