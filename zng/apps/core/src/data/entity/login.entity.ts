import { ILogin } from '@library/entity/interface';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicationUser } from './application.user.entity';
import { LoginType } from '@library/entity/enum';

@Entity('user_logins', { schema: 'core' })
@Unique('logins_user_id_per_type_unique', ['userId', 'type'])
export class Login implements ILogin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  type: LoginType;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => ApplicationUser)
  @JoinColumn({ name: 'user_id' })
  user: ApplicationUser;

  @Column('text', { nullable: true })
  secret: string | null;

  @Column('timestamp with time zone', { nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date | null;

  @Column('int', { default: 0 })
  attempts: number;

  @Column('timestamp with time zone', { nullable: true })
  unlocksAt: Date | null;

  @Column('text', { nullable: true })
  externalId: string | null;

  @Column('text', { nullable: true })
  externalData: string | null;
}
